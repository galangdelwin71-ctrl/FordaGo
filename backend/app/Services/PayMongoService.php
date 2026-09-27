<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayMongoService
{
    private string $secretKey;
    private string $publicKey;
    private string $baseUrl = 'https://api.paymongo.com/v1';

    public function __construct()
    {
        $this->secretKey = config('services.paymongo.secret_key', env('PAYMONGO_SECRET_KEY', ''));
        $this->publicKey = config('services.paymongo.public_key', env('PAYMONGO_PUBLIC_KEY', ''));
    }

    public function isConfigured(): bool
    {
        return ! empty($this->secretKey) && ! str_starts_with($this->secretKey, 'your_');
    }

    /**
     * Create a PayMongo Checkout Session
     *
     * @param array $params [
     *   'amount'           => float (in PHP pesos),
     *   'description'      => string,
     *   'name'             => string,
     *   'payment_methods'  => array (e.g. ['gcash', 'paymaya']),
     *   'success_url'      => string,
     *   'cancel_url'       => string,
     *   'reference_number' => string,
     *   'metadata'         => array,
     *   'line_items'       => array optional
     * ]
     * @return array [ 'session_id' => string, 'checkout_url' => string, 'is_mock' => bool ]
     */
    public function createCheckoutSession(array $params): array
    {
        $amountInPesos = (float) ($params['amount'] ?? 0);
        $amountInCentavos = (int) round($amountInPesos * 100);

        // If no real PayMongo key is configured, direct to FordaGO's high-fidelity GCash checkout interface
        if (! $this->isConfigured()) {
            $mockSessionId = 'cs_mock_' . bin2hex(random_bytes(10));
            $successUrl = $params['success_url'] ?? '';
            $cancelUrl = $params['cancel_url'] ?? '';
            $ref = $params['reference_number'] ?? ('FGO-REC-' . rand(100000, 999999));
            $desc = $params['description'] ?? ($params['name'] ?? 'FordaGO Gym Payment');

            $parsedUrl = parse_url($successUrl);
            $baseUrl = '';
            if (isset($parsedUrl['scheme']) && isset($parsedUrl['host'])) {
                $baseUrl = $parsedUrl['scheme'] . '://' . $parsedUrl['host'] . (isset($parsedUrl['port']) ? ':' . $parsedUrl['port'] : '');
            }

            $mockCheckoutUrl = "{$baseUrl}/gcash-checkout?session_id={$mockSessionId}&amount=" . urlencode((string)$amountInPesos)
                . "&ref=" . urlencode($ref)
                . "&desc=" . urlencode($desc)
                . "&return_url=" . urlencode($successUrl)
                . "&cancel_url=" . urlencode($cancelUrl);

            Log::info('PayMongo: Generated mock checkout session directing to GCash', [
                'session_id'   => $mockSessionId,
                'amount'       => $amountInPesos,
                'checkout_url' => $mockCheckoutUrl,
            ]);

            return [
                'session_id'   => $mockSessionId,
                'checkout_url' => $mockCheckoutUrl,
                'is_mock'      => true,
            ];
        }

        $paymentMethods = ! empty($params['payment_methods'])
            ? $params['payment_methods']
            : ['gcash', 'paymaya', 'card'];

        $lineItems = ! empty($params['line_items']) ? $params['line_items'] : [
            [
                'name'        => $params['name'] ?? 'FordaGO Gym Service',
                'quantity'    => 1,
                'amount'      => $amountInCentavos,
                'currency'    => 'PHP',
                'description' => $params['description'] ?? 'Payment for FordaGO Gym',
            ],
        ];

        // Format line items to guarantee centavos match total amount
        $formattedLineItems = [];
        $runningTotalCentavos = 0;
        foreach ($lineItems as $item) {
            $qty = max(1, (int) ($item['quantity'] ?? 1));
            if (isset($item['price'])) {
                $unitCentavos = (int) round(((float) $item['price']) * 100);
            } elseif (isset($item['unit_price'])) {
                $unitCentavos = (int) round(((float) $item['unit_price']) * 100);
            } elseif (isset($item['amount'])) {
                $rawAmt = (float) $item['amount'];
                $unitCentavos = ($rawAmt >= 1000 && (int) round($rawAmt) === (int) round($amountInCentavos / $qty))
                    ? (int) round($rawAmt)
                    : (int) round($rawAmt * 100);
            } else {
                $unitCentavos = (int) round($amountInCentavos / $qty);
            }

            $formattedLineItems[] = [
                'name'        => (string) ($item['name'] ?? 'Item'),
                'quantity'    => $qty,
                'amount'      => $unitCentavos,
                'currency'    => 'PHP',
                'description' => (string) ($item['description'] ?? $item['name'] ?? 'Item'),
            ];
            $runningTotalCentavos += ($unitCentavos * $qty);
        }

        // If breakdown sum doesn't match total, fallback to single clean line item to avoid 400 Bad Request
        if ($runningTotalCentavos !== $amountInCentavos && $amountInCentavos > 0) {
            $formattedLineItems = [
                [
                    'name'        => $params['name'] ?? 'FordaGO Gym Payment',
                    'quantity'    => 1,
                    'amount'      => $amountInCentavos,
                    'currency'    => 'PHP',
                    'description' => $params['description'] ?? 'Payment for FordaGO Gym',
                ],
            ];
        }

        $payload = [
            'data' => [
                'attributes' => [
                    'send_email_receipt'   => true,
                    'show_description'     => true,
                    'show_line_items'      => true,
                    'payment_method_types' => $paymentMethods,
                    'line_items'           => $formattedLineItems,
                    'description'          => $params['description'] ?? 'FordaGO Online Payment',
                    'reference_number'     => $params['reference_number'] ?? ('FDG-' . time()),
                    'success_url'          => $params['success_url'],
                    'cancel_url'           => $params['cancel_url'],
                    'metadata'             => $params['metadata'] ?? [],
                ],
            ],
        ];

        try {
            $response = Http::withBasicAuth($this->secretKey, '')
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept'       => 'application/json',
                ])
                ->post("{$this->baseUrl}/checkout_sessions", $payload);

            if ($response->successful()) {
                $body = $response->json();
                $sessionId = $body['data']['id'] ?? '';
                $checkoutUrl = $body['data']['attributes']['checkout_url'] ?? '';

                return [
                    'session_id'   => $sessionId,
                    'checkout_url' => $checkoutUrl,
                    'is_mock'      => false,
                ];
            }

            Log::error('PayMongo createCheckoutSession failed', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);

            throw new \RuntimeException('PayMongo checkout error: ' . ($response->json('errors.0.detail') ?? $response->body()));
        } catch (\Throwable $e) {
            Log::error('PayMongo exception: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Retrieve a Checkout Session from PayMongo
     */
    public function retrieveCheckoutSession(string $sessionId): ?array
    {
        // Handle mock sessions
        if (str_starts_with($sessionId, 'cs_mock_')) {
            return [
                'id'         => $sessionId,
                'status'     => 'paid',
                'is_mock'    => true,
                'payment_id' => 'pay_mock_' . substr($sessionId, 8),
                'channel'    => 'gcash',
            ];
        }

        if (! $this->isConfigured()) {
            return null;
        }

        try {
            $response = Http::withBasicAuth($this->secretKey, '')
                ->withHeaders(['Accept' => 'application/json'])
                ->get("{$this->baseUrl}/checkout_sessions/{$sessionId}");

            if ($response->successful()) {
                $data = $response->json('data');
                $attributes = $data['attributes'] ?? [];
                $payments = $attributes['payments'] ?? [];
                $firstPayment = ! empty($payments) ? $payments[0] : null;

                $paymentStatus = 'unpaid';
                $paymentId = null;
                $paymentChannel = 'gcash';

                if ($firstPayment) {
                    $paymentStatus = $firstPayment['attributes']['status'] ?? 'pending';
                    $paymentId = $firstPayment['id'] ?? null;
                    $sourceType = $firstPayment['attributes']['source']['type'] ?? '';
                    if (str_contains(strtolower($sourceType), 'maya')) {
                        $paymentChannel = 'paymaya';
                    } elseif (str_contains(strtolower($sourceType), 'card')) {
                        $paymentChannel = 'card';
                    } else {
                        $paymentChannel = 'gcash';
                    }
                } elseif (! empty($attributes['paid_at'])) {
                    $paymentStatus = 'paid';
                }

                return [
                    'id'             => $data['id'] ?? $sessionId,
                    'status'         => $paymentStatus,
                    'payment_id'     => $paymentId,
                    'payment_channel'=> $paymentChannel,
                    'metadata'       => $attributes['metadata'] ?? [],
                    'raw'            => $data,
                ];
            }

            return null;
        } catch (\Throwable $e) {
            Log::error('PayMongo retrieveCheckoutSession exception: ' . $e->getMessage());
            return null;
        }
    }
}
