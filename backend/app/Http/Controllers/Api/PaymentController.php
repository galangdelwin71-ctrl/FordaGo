<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Payment;
use App\Models\ProgramBooking;
use App\Models\User;
use App\Models\WorkoutPlanProposal;
use App\Services\ActivityLogger;
use App\Services\FcmService;
use App\Services\PayMongoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    private PayMongoService $payMongo;

    public function __construct(PayMongoService $payMongo)
    {
        $this->payMongo = $payMongo;
    }

    /**
     * POST /api/payments/checkout
     * Initiates a payment session for GCash, Maya, Card, or Counter Cash.
     */
    public function checkout(Request $request)
    {
        $request->validate([
            'payment_for'      => 'required|in:membership,order,attendance,program,proposal',
            'amount'           => 'required|numeric|min:1',
            'payment_channel'  => 'required|in:gcash,paymaya,maya,card,cash',
            'related_id'       => 'nullable|string|max:100',
            'description'      => 'nullable|string|max:255',
            'return_url'       => 'nullable|string|max:500',
            'items_breakdown'  => 'nullable|array',
        ]);

        $user = $request->user();
        if (! $user && $request->input('user_id')) {
            $user = User::find($request->input('user_id'));
        }
        if (! $user) {
            return response()->json(['message' => 'User not found or unauthenticated.'], 401);
        }

        $amount = (float) $request->input('amount');
        $channel = $request->input('payment_channel');
        if ($channel === 'maya') {
            $channel = 'paymaya';
        }
        $paymentFor = $request->input('payment_for');
        $relatedId = $request->input('related_id');
        $receiptNumber = Payment::generateReceiptNumber();
        $itemsBreakdown = $request->input('items_breakdown') ?: [];

        $customerDetails = [
            'id'       => $user->id,
            'name'     => trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')) ?: $user->username,
            'username' => $user->username,
            'email'    => $user->email,
            'phone'    => $user->phone,
        ];

        // 1. CASH / COUNTER PAYMENT FLOW
        if ($channel === 'cash') {
            $payment = Payment::create([
                'user_id'            => $user->id,
                'receipt_number'     => $receiptNumber,
                'payment_for'        => $paymentFor,
                'related_id'         => $relatedId,
                'amount'             => $amount,
                'fee'                => 0.00,
                'currency'           => 'PHP',
                'payment_channel'    => 'cash',
                'status'             => 'pending',
                'gateway'            => 'manual_counter',
                'items_breakdown'    => $itemsBreakdown,
                'customer_details'   => $customerDetails,
            ]);

            // Notify staff of cash order to be settled at desk
            try {
                $staff = User::whereIn('role', ['admin', 'super_admin', 'employee'])->get();
                $displayName = $customerDetails['name'];
                foreach ($staff as $s) {
                    Notification::create([
                        'user_id' => $s->id,
                        'title'   => 'Cash Payment Pending at Counter',
                        'message' => "{$displayName} opted to pay ₱" . number_format($amount, 2) . " via Cash at Counter for " . ucfirst($paymentFor) . ". (Ref: {$receiptNumber})",
                    ]);
                }
            } catch (\Throwable) {}

            return response()->json([
                'success'        => true,
                'payment_id'     => $payment->id,
                'receipt_number' => $receiptNumber,
                'status'         => 'pending',
                'payment_channel'=> 'cash',
                'message'        => 'Cash payment recorded. Please settle at the gym counter.',
            ]);
        }

        // 2. ONLINE PAYMENT FLOW (GCash, Maya, Card via PayMongo)
        $frontendOrigin = $request->header('Origin') ?: url('/');
        $baseReturnUrl = $request->input('return_url') ?: "{$frontendOrigin}/transactions";
        $sep = str_contains($baseReturnUrl, '?') ? '&' : '?';

        $successUrl = "{$baseReturnUrl}{$sep}payment=success&ref={$receiptNumber}";
        $cancelUrl  = "{$baseReturnUrl}{$sep}payment=cancelled&ref={$receiptNumber}";

        $methodsForGateway = match ($channel) {
            'gcash'   => ['gcash'],
            'paymaya' => ['paymaya'],
            'card'    => ['card'],
            default   => ['gcash', 'paymaya'],
        };

        $lineItems = ! empty($itemsBreakdown) ? $itemsBreakdown : [
            [
                'name'     => $request->input('description') ?: ('FordaGO ' . ucfirst($paymentFor)),
                'amount'   => (int) round($amount * 100),
                'quantity' => 1,
            ],
        ];

        try {
            $session = $this->payMongo->createCheckoutSession([
                'amount'           => $amount,
                'name'             => $request->input('description') ?: ('FordaGO ' . ucfirst($paymentFor)),
                'description'      => "Official FordaGO Gym Payment ({$receiptNumber})",
                'payment_methods'  => $methodsForGateway,
                'reference_number' => $receiptNumber,
                'success_url'      => $successUrl,
                'cancel_url'       => $cancelUrl,
                'line_items'       => $lineItems,
                'metadata'         => [
                    'user_id'        => (string) $user->id,
                    'receipt_number' => $receiptNumber,
                    'payment_for'    => $paymentFor,
                    'related_id'     => (string) $relatedId,
                ],
            ]);

            $payment = Payment::create([
                'user_id'            => $user->id,
                'receipt_number'     => $receiptNumber,
                'payment_for'        => $paymentFor,
                'related_id'         => $relatedId,
                'amount'             => $amount,
                'fee'                => 0.00,
                'currency'           => 'PHP',
                'payment_channel'    => $channel,
                'status'             => 'pending',
                'gateway'            => 'paymongo',
                'gateway_session_id' => $session['session_id'],
                'items_breakdown'    => $itemsBreakdown,
                'customer_details'   => $customerDetails,
            ]);

            return response()->json([
                'success'        => true,
                'payment_id'     => $payment->id,
                'receipt_number' => $receiptNumber,
                'session_id'     => $session['session_id'],
                'checkout_url'   => $session['checkout_url'],
                'is_mock'        => $session['is_mock'] ?? false,
                'payment_channel'=> $channel,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to initiate PayMongo checkout: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Unable to connect to online payment service: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/payments/verify-session/{sessionId}
     * Instant return-trip verification from the frontend.
     */
    public function verifySession(Request $request, string $sessionId)
    {
        $payment = Payment::where('gateway_session_id', $sessionId)->first();

        // Also check by reference number if provided
        if (! $payment && $request->input('ref')) {
            $payment = Payment::where('receipt_number', $request->input('ref'))->first();
        }

        if (! $payment) {
            return response()->json(['success' => false, 'message' => 'Payment record not found.'], 404);
        }

        // If already paid, return immediately
        if ($payment->isPaid()) {
            return response()->json([
                'success' => true,
                'payment' => $payment,
                'receipt' => $this->formatReceipt($payment),
            ]);
        }

        // Query PayMongo status
        $session = $this->payMongo->retrieveCheckoutSession($sessionId);

        if ($session && ($session['status'] === 'paid' || ! empty($session['is_mock']))) {
            $this->fulfillPayment($payment, [
                'payment_id'      => $session['payment_id'] ?? null,
                'payment_channel' => $session['payment_channel'] ?? $payment->payment_channel,
            ]);

            return response()->json([
                'success' => true,
                'payment' => $payment->fresh(),
                'receipt' => $this->formatReceipt($payment->fresh()),
            ]);
        }

        return response()->json([
            'success' => false,
            'status'  => $payment->status,
            'message' => 'Payment is still processing or was not completed.',
        ]);
    }

    /**
     * POST /api/payments/paymongo/webhook
     * Webhook receiver for PayMongo events.
     */
    public function webhook(Request $request)
    {
        $payload = $request->all();
        Log::info('PayMongo Webhook Received', ['type' => $payload['data']['attributes']['type'] ?? 'unknown']);

        $eventType = $payload['data']['attributes']['type'] ?? '';

        if ($eventType === 'checkout_session.payment.paid') {
            $sessionData = $payload['data']['attributes']['data'] ?? [];
            $sessionId   = $sessionData['id'] ?? '';
            $attributes  = $sessionData['attributes'] ?? [];
            $payments    = $attributes['payments'] ?? [];
            $firstPay    = ! empty($payments) ? $payments[0] : null;

            $payment = Payment::where('gateway_session_id', $sessionId)->first();
            if ($payment && ! $payment->isPaid()) {
                $paymentId = $firstPay['id'] ?? null;
                $sourceType = $firstPay['attributes']['source']['type'] ?? '';
                $channel = str_contains(strtolower($sourceType), 'maya') ? 'paymaya' : (str_contains(strtolower($sourceType), 'card') ? 'card' : 'gcash');

                $this->fulfillPayment($payment, [
                    'payment_id'      => $paymentId,
                    'payment_channel' => $channel,
                ]);
            }
        }

        return response()->json(['status' => 'acknowledged']);
    }

    /**
     * GET /api/payments/receipt/{receiptNumber}
     */
    public function getReceipt(string $receiptNumber)
    {
        $payment = Payment::with('user')->where('receipt_number', $receiptNumber)->first();
        if (! $payment) {
            return response()->json(['message' => 'Receipt not found.'], 404);
        }

        return response()->json($this->formatReceipt($payment));
    }

    /**
     * Fulfill services once payment is confirmed
     */
    private function fulfillPayment(Payment $payment, array $details = []): void
    {
        DB::transaction(function () use ($payment, $details) {
            $payment->update([
                'status'             => 'paid',
                'gateway_payment_id' => $details['payment_id'] ?? $payment->gateway_payment_id,
                'payment_channel'    => $details['payment_channel'] ?? $payment->payment_channel,
                'paid_at'            => now(),
            ]);

            $user = User::find($payment->user_id);
            $userName = $payment->customer_details['name'] ?? ($user->username ?? 'Member');
            $channelUpper = strtoupper($payment->payment_channel);
            $amountFormatted = '₱' . number_format($payment->amount, 2);

            // 1. MEMBERSHIP FULFILLMENT
            if ($payment->payment_for === 'membership' && $user) {
                $user->update([
                    'membership_type'   => 'premium',
                    'membership_status' => 'active',
                    'payment_method'    => $payment->payment_channel,
                    'membership_expiry' => now()->addDays(30)->toDateString(),
                ]);

                try {
                    ActivityLogger::log(
                        $user,
                        'membership_online_paid',
                        "Premium Membership Activated via {$channelUpper}",
                        "{$userName} successfully paid {$amountFormatted} online for 1-Month Premium Access. Ref: #{$payment->receipt_number}",
                        'user',
                        $user->id
                    );
                } catch (\Throwable) {}
            }

            // 2. SHOP ORDER FULFILLMENT
            if ($payment->payment_for === 'order' && ! empty($payment->related_id)) {
                Order::where('order_group_id', $payment->related_id)
                    ->update([
                        'status'         => 'approved',
                        'payment_method' => $payment->payment_channel,
                    ]);

                try {
                    ActivityLogger::log(
                        $user ?: null,
                        'shop_online_paid',
                        "Shop Order Paid via {$channelUpper}",
                        "{$userName} successfully paid {$amountFormatted} online for order group #{$payment->related_id}. Ready for counter pickup. Ref: #{$payment->receipt_number}",
                        'order_group',
                        null,
                        ['order_group_id' => $payment->related_id]
                    );
                } catch (\Throwable) {}
            }

            // 3. CLASS PROGRAM BOOKING FULFILLMENT
            if ($payment->payment_for === 'program' && ! empty($payment->related_id)) {
                ProgramBooking::where('id', $payment->related_id)
                    ->update(['payment_status' => 'paid']);
            }

            // 4. DAILY ATTENDANCE CHECK-IN FULFILLMENT
            if ($payment->payment_for === 'attendance' && ! empty($payment->related_id)) {
                Attendance::where('id', $payment->related_id)
                    ->update(['payment_status' => 'paid']);
            }

            // 5. WORKOUT PROPOSAL FULFILLMENT
            if ($payment->payment_for === 'proposal' && ! empty($payment->related_id)) {
                $proposal = WorkoutPlanProposal::find($payment->related_id);
                if ($proposal) {
                    $proposal->update([
                        'status'      => 'accepted',
                        'accepted_at' => now(),
                    ]);
                }
            }

            // MULTI-CHANNEL NOTIFICATIONS
            // A. User In-App + FCM Push Notification
            if ($user) {
                $notifTitle = "Payment Confirmed! ({$channelUpper}) ✅";
                $notifMsg   = "Your payment of {$amountFormatted} for " . ucfirst($payment->payment_for) . " was successful. Official Receipt #{$payment->receipt_number}.";

                try {
                    Notification::create([
                        'user_id' => $user->id,
                        'title'   => $notifTitle,
                        'message' => $notifMsg,
                        'is_read' => false,
                    ]);

                    app(FcmService::class)->sendToUser($user->id, $notifTitle, $notifMsg, [
                        'type'        => 'payment_success',
                        'targetRoute' => '/transactions',
                        'receipt'     => $payment->receipt_number,
                    ]);
                } catch (\Throwable $e) {
                    Log::warning('Failed to send user payment notification: ' . $e->getMessage());
                }
            }

            // B. Admin In-App + Push Notification
            try {
                $staff = User::whereIn('role', ['admin', 'super_admin', 'employee'])->get();
                $adminTitle = "💰 Online Payment Received ({$channelUpper})";
                $adminMsg   = "{$userName} (@{$user?->username}) paid {$amountFormatted} for " . ucfirst($payment->payment_for) . ". Ref: #{$payment->receipt_number}.";

                foreach ($staff as $s) {
                    Notification::create([
                        'user_id' => $s->id,
                        'title'   => $adminTitle,
                        'message' => $adminMsg,
                        'is_read' => false,
                    ]);
                }

                app(FcmService::class)->sendToAdmins($adminTitle, $adminMsg, [
                    'type'        => 'admin_payment',
                    'targetRoute' => '/admin-reports',
                ]);
            } catch (\Throwable $e) {
                Log::warning('Failed to send admin payment notification: ' . $e->getMessage());
            }
        });
    }

    /**
     * Standardized receipt format
     */
    private function formatReceipt(Payment $payment): array
    {
        $user = $payment->user;
        $items = ! empty($payment->items_breakdown) ? $payment->items_breakdown : [
            [
                'name'     => 'FordaGO ' . ucfirst($payment->payment_for) . ' Service',
                'quantity' => 1,
                'price'    => (float) $payment->amount,
                'total'    => (float) $payment->amount,
            ],
        ];

        return [
            'club_name'        => 'FORDAGO FITNESS & WELLNESS CLUB',
            'club_address'     => 'Bustos, Bulacan, Philippines',
            'receipt_number'   => $payment->receipt_number,
            'transaction_date' => $payment->paid_at ? $payment->paid_at->toIso8601String() : $payment->created_at->toIso8601String(),
            'paid_at'          => $payment->paid_at ? $payment->paid_at->toIso8601String() : $payment->created_at->toIso8601String(),
            'customer_name'    => $payment->customer_details['name'] ?? ($user?->username ?? 'Valued Member'),
            'customer_email'   => $payment->customer_details['email'] ?? ($user?->email ?? 'member@fordago.ph'),
            'payment_channel'  => strtoupper($payment->payment_channel),
            'status'           => strtoupper($payment->status),
            'payment_for'      => ucfirst($payment->payment_for),
            'currency'         => $payment->currency ?: 'PHP',
            'amount'           => (float) $payment->amount,
            'subtotal'         => (float) $payment->amount,
            'total'            => (float) $payment->amount,
            'fee'              => (float) $payment->fee,
            'grand_total'      => (float) $payment->amount,
            'items'            => $items,
            'gateway_ref'      => $payment->gateway_payment_id ?: $payment->gateway_session_id,
        ];
    }
}
