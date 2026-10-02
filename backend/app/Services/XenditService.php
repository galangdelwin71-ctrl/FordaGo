<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class XenditService
{
    private string $secretKey;
    private string $callbackToken;
    private string $baseUrl = 'https://api.xendit.co';

    public function __construct()
    {
        $this->secretKey     = config('services.xendit.secret_key', env('XENDIT_SECRET_KEY', ''));
        $this->callbackToken = (string) config('services.xendit.callback_token', '');
    }

    public function isConfigured(): bool
    {
        return ! empty($this->secretKey) && str_starts_with($this->secretKey, 'xnd_');
    }

    /**
     * Verify the x-callback-token header sent by Xendit with every webhook.
     * Fails closed: returns false when no callback token is configured or the header is missing.
     */
    public function verifyCallbackToken(?string $headerToken): bool
    {
        if ($this->callbackToken === '' || empty($headerToken)) {
            return false;
        }

        return hash_equals($this->callbackToken, $headerToken);
    }

    /**
     * Create a Xendit Invoice for GCash, Maya, and other online payments
     *
     * @param array $params [
     *   'amount'               => float,
     *   'external_id'          => string,
     *   'description'          => string,
     *   'payment_methods'      => array, // e.g. ['GCASH']
     *   'success_redirect_url' => string,
     *   'failure_redirect_url' => string,
     *   'customer'             => array,
     *   'items'                => array,
     * ]
     * @return array [ 'session_id' => string, 'checkout_url' => string, 'status' => string ]
     */
    public function createInvoice(array $params): array
    {
        $amount = (float) ($params['amount'] ?? 0);
        $externalId = $params['external_id'] ?? ('FGO-' . time());
        $description = $params['description'] ?? 'FordaGO Gym Payment';
        $successUrl = $params['success_redirect_url'] ?? '';
        $failureUrl = $params['failure_redirect_url'] ?? '';

        $paymentMethods = ! empty($params['payment_methods'])
            ? array_map('strtoupper', $params['payment_methods'])
            : ['GCASH', 'PAYMAYA'];

        $payload = [
            'external_id'          => $externalId,
            'amount'               => $amount,
            'description'          => $description,
            'invoice_duration'     => 86400,
            'currency'             => 'PHP',
            'payment_methods'      => $paymentMethods,
            'success_redirect_url' => $successUrl,
            'failure_redirect_url' => $failureUrl,
        ];

        if (! empty($params['customer'])) {
            $payload['customer'] = [
                'given_names' => $params['customer']['name'] ?? 'FordaGO Member',
                'email'       => ! empty($params['customer']['email']) ? $params['customer']['email'] : 'customer@fordago.fit',
            ];
            if (! empty($params['customer']['phone'])) {
                $rawPhone = preg_replace('/[^0-9]/', '', $params['customer']['phone']);
                if (str_starts_with($rawPhone, '09') && strlen($rawPhone) === 11) {
                    $e164 = '+63' . substr($rawPhone, 1);
                } elseif (str_starts_with($rawPhone, '639') && strlen($rawPhone) === 12) {
                    $e164 = '+' . $rawPhone;
                } else {
                    $e164 = '+63' . ltrim($rawPhone, '0');
                }
                if (preg_match('/^\+639\d{9}$/', $e164)) {
                    $payload['customer']['mobile_number'] = $e164;
                }
            }
        }

        if (! empty($params['items'])) {
            $formattedItems = [];
            foreach ($params['items'] as $item) {
                $formattedItems[] = [
                    'name'     => $item['name'] ?? 'Gym Item',
                    'quantity' => max(1, (int) ($item['quantity'] ?? 1)),
                    'price'    => (float) ($item['price'] ?? $item['amount'] ?? $amount),
                    'category' => 'Fitness',
                ];
            }
            $payload['items'] = $formattedItems;
        }

        Log::info('Xendit: Creating invoice', ['external_id' => $externalId, 'amount' => $amount]);

        $response = Http::withBasicAuth($this->secretKey, '')
            ->timeout(25)
            ->post("{$this->baseUrl}/v2/invoices", $payload);

        if ($response->failed()) {
            $errorBody = $response->json();
            $msg = $errorBody['message'] ?? $response->body();
            Log::error('Xendit Invoice Creation Failed', [
                'status' => $response->status(),
                'error'  => $msg,
            ]);
            throw new \RuntimeException("Xendit Error: {$msg}");
        }

        $data = $response->json();

        return [
            'session_id'   => $data['id'],
            'checkout_url' => $data['invoice_url'],
            'status'       => strtolower($data['status'] ?? 'pending'),
            'external_id'  => $data['external_id'] ?? $externalId,
            'raw'          => $data,
        ];
    }

    /**
     * Retrieve status of a Xendit Invoice
     */
    public function retrieveInvoice(string $invoiceId): ?array
    {
        $response = Http::withBasicAuth($this->secretKey, '')
            ->timeout(15)
            ->get("{$this->baseUrl}/v2/invoices/{$invoiceId}");

        if ($response->failed()) {
            Log::error('Xendit Invoice Retrieval Failed', [
                'invoice_id' => $invoiceId,
                'status'     => $response->status(),
                'body'       => $response->body(),
            ]);
            return null;
        }

        $data = $response->json();
        $status = strtolower($data['status'] ?? 'pending');

        return [
            'session_id'      => $data['id'],
            'status'          => ($status === 'settled' || $status === 'paid') ? 'paid' : $status,
            'payment_method'  => strtolower($data['payment_method'] ?? 'gcash'),
            'payment_channel' => strtolower($data['payment_channel'] ?? 'gcash'),
            'paid_amount'     => (float) ($data['paid_amount'] ?? $data['amount'] ?? 0),
            'external_id'     => $data['external_id'] ?? null,
            'raw'             => $data,
        ];
    }
}
