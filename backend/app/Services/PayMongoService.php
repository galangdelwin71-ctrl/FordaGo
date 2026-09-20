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

        // If no real PayMongo key is configured, provide seamless developer mock checkout
        if (! $this->isConfigured()) {
            $mockSessionId = 'cs_mock_' . bin2hex(random_bytes(10));
            $successUrl = $params['success_url'] ?? '';
            $separator = str_contains($successUrl, '?') ? '&' : '?';
            $mockCheckoutUrl = $successUrl . $separator . 'payment=success&session_id=' . $mockSessionId . '&is_mock=1';

            Log::info('PayMongo: Generated mock checkout session', [
                'session_id' => $mockSessionId,
                'amount'     => $amountInPesos,
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

        // Format line items to ensure centavos
        $formattedLineItems = array_map(function ($item) {
            $amt = isset($item['amount']) ? (int) $item['amount'] : 0;
            // If already in centavos (> 1000 for normal items or explicitly flagged)
            return [
                'name'        => (string) ($item['name'] ?? 'Item'),
                'quantity'    => (int) ($item['quantity'] ?? 1),
                'amount'      => $amt > 10000 && !str_contains($amt, '.') ? $amt : (int) round(((float) ($item['price'] ?? $amt)) * 100),
                'currency'    => 'PHP',
                'description' => (string) ($item['description'] ?? $item['name'] ?? 'Item'),
            ];
        }, $lineItems);

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
