<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Ported from server/routes/inventory.js.
 */
class InventoryController extends Controller
{
    private function toNonNegative(mixed $value, float $fallback = 0): float
    {
        $parsed = floatval($value);
        return (is_finite($parsed) && $parsed >= 0) ? $parsed : $fallback;
    }

    // ── Products ──────────────────────────────────────────────────────────

    /** GET /api/inventory/products */
    public function products()
    {
        return response()->json(Product::orderByDesc('created_at')->get());
    }

    /** POST /api/inventory/products */
    public function storeProduct(Request $request)
    {
        $name = trim((string) $request->input('name', ''));
        if (! $name) {
            return response()->json(['message' => 'Product name is required'], 400);
        }

        $price = $this->toNonNegative($request->input('price'), 0);
        $stock = (int) $this->toNonNegative($request->input('stock'), 0);

        $product = Product::create([
            'name'      => $name,
            'brand'     => $request->input('brand') ?: null,
            'price'     => $price,
            'stock'     => $stock,
            'image_url' => $request->input('image_url') ?: null,
        ]);

        return response()->json($product, 201);
    }

    /** PUT /api/inventory/products/{id} */
    public function updateProduct(Request $request, int $id)
    {
        $product = Product::find($id);
        if (! $product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $price = $this->toNonNegative($request->input('price'), 0);
        $stock = (int) $this->toNonNegative($request->input('stock'), 0);

        $product->update([
            'name'      => $request->input('name', $product->name),
            'brand'     => $request->input('brand') ?: null,
            'price'     => $price,
            'stock'     => $stock,
            'image_url' => $request->input('image_url') ?: null,
        ]);

        return response()->json(['message' => 'Product updated']);
    }

    /** DELETE /api/inventory/products/{id} */
    public function destroyProduct(int $id)
    {
        $product = Product::find($id);
        if (! $product) {
            return response()->json(['message' => 'Product not found'], 404);
        }
        $product->delete();
        return response()->json(['message' => 'Product deleted']);
    }

    // ── Orders ────────────────────────────────────────────────────────────

    /** GET /api/inventory/my-orders */
    public function myOrders(Request $request)
    {
        $rows = Order::query()
            ->leftJoin('products', 'products.id', '=', 'orders.product_id')
            ->where('orders.user_id', $request->user()->id)
            ->orderByDesc('orders.created_at')
            ->select(
                'orders.*',
                'products.name as product_name_db',
                'orders.order_group_id as group_id',
                'orders.payment_method as group_payment_method',
                'orders.created_at as group_created_at'
            )
            ->get();

        return response()->json($rows);
    }

    /** GET /api/inventory/orders */
    public function orders()
    {
        $rows = Order::query()
            ->leftJoin('users', 'users.id', '=', 'orders.user_id')
            ->leftJoin('products', 'products.id', '=', 'orders.product_id')
            ->orderByDesc('orders.created_at')
            ->select('orders.*', 'users.username', 'users.email', 'products.name as product_name')
            ->get();

        return response()->json($rows);
    }

    /** POST /api/inventory/orders */
    public function placeOrder(Request $request)
    {
        $productId = $request->input('product_id');
        $qty = max(1, (int) $this->toNonNegative($request->input('quantity'), 1));

        if (! $productId) {
            return response()->json(['message' => 'Product is required'], 400);
        }

        return DB::transaction(function () use ($request, $productId, $qty) {
            // Lock the product row for the life of this transaction so two
            // concurrent orders can't both pass the stock check and oversell
            // the last unit(s) (classic race condition on shared stock).
            $product = Product::where('id', $productId)->lockForUpdate()->first();

            if (! $product) {
                return response()->json(['message' => 'Product not found'], 404);
            }

            if ($product->stock < $qty) {
                return response()->json([
                    'message' => $product->stock > 0
                        ? "Only {$product->stock} unit(s) left in stock."
                        : 'This product is out of stock.',
                ], 409);
            }

            $total = $product->price * $qty;
            $product->decrement('stock', $qty);

            $order = Order::create([
                'user_id'    => $request->user()->id,
                'product_id' => $product->id,
                'quantity'   => $qty,
                'total'      => $total,
            ]);

            return response()->json([
                'id'         => $order->id,
                'product_id' => $order->product_id,
                'quantity'   => $order->quantity,
                'total'      => (float) $order->total,
                'status'     => $order->status,
                'created_at' => $order->created_at,
                'message'    => 'Order placed',
            ], 201);
        });
    }

    /**
     * POST /api/inventory/cart/checkout
     *
     * Atomic multi-item checkout used by both the member's cart (several
     * products at once) and the product page's "Place Order Now" quick-buy
     * (a single item, `items` has one entry). All items are validated and
     * decremented inside one DB transaction with row locks, so either the
     * whole checkout succeeds or none of it does -- a member can never be
     * charged/queued for a partial order because one item ran out of stock
     * mid-request.
     *
     * Every resulting order row shares one generated `order_group_id`, which
     * is what lets the frontend show/cancel the checkout as a single packed
     * group instead of unrelated rows.
     *
     * Body: { items: [{ product_id, quantity }], payment_method: 'cash'|'gcash' }
     */
    public function checkout(Request $request)
    {
        $items = $request->input('items');
        $paymentMethod = $request->input('payment_method') === 'gcash' ? 'gcash' : 'cash';

        if (! is_array($items) || count($items) === 0) {
            return response()->json(['message' => 'Your cart is empty.'], 400);
        }

        // Normalize + validate shape before touching the database at all.
        $normalizedItems = [];
        foreach ($items as $item) {
            $productId = (int) ($item['product_id'] ?? 0);
            $quantity = max(1, (int) $this->toNonNegative($item['quantity'] ?? 1, 1));
            if ($productId <= 0) {
                return response()->json(['message' => 'Invalid item in cart.'], 400);
            }
            $normalizedItems[] = ['product_id' => $productId, 'quantity' => $quantity];
        }

        return DB::transaction(function () use ($request, $normalizedItems, $paymentMethod) {
            // Lock every product row up front (sorted by id to avoid
            // deadlocking against a concurrent checkout that touches the
            // same products in a different order) so no other request can
            // change stock underneath this checkout while it's validating.
            $productIds = collect($normalizedItems)->pluck('product_id')->unique()->sort()->values();
            $products = Product::whereIn('id', $productIds)->lockForUpdate()->get()->keyBy('id');

            foreach ($normalizedItems as $item) {
                $product = $products->get($item['product_id']);
                if (! $product) {
                    return response()->json(['message' => 'One of the items in your cart no longer exists.'], 404);
                }
                if ($product->stock < $item['quantity']) {
                    return response()->json([
                        'message' => $product->stock > 0
                            ? "Only {$product->stock} unit(s) of {$product->name} left in stock."
                            : "{$product->name} is out of stock.",
                    ], 409);
                }
            }

            $groupId = (string) Str::uuid();
            $total = 0;
            $orders = [];

            foreach ($normalizedItems as $item) {
                $product = $products->get($item['product_id']);
                $lineTotal = $product->price * $item['quantity'];
                $total += $lineTotal;

                $product->decrement('stock', $item['quantity']);

                $orders[] = Order::create([
                    'user_id'         => $request->user()->id,
                    'product_id'      => $product->id,
                    'quantity'        => $item['quantity'],
                    'total'           => $lineTotal,
                    'status'          => 'pending',
                    'order_group_id'  => $groupId,
                    'payment_method'  => $paymentMethod,
                ]);
            }

            return response()->json([
                'order_group_id' => $groupId,
                'total'           => (float) $total,
                'payment_method'  => $paymentMethod,
                'items'           => count($orders),
                'message'         => 'Order placed',
            ], 201);
        });
    }

    /**
     * PUT /api/inventory/order-groups/{groupId}/cancel
     *
     * Cancels every order row in the group -- but only while the WHOLE
     * group is still pending, and only for the member who owns it (an id
     * alone isn't authorization; without this check any logged-in member
     * could cancel another member's order by guessing/observing a group id).
     * Stock is restored for each cancelled line item.
     */
    public function cancelOrderGroup(Request $request, string $groupId)
    {
        return DB::transaction(function () use ($request, $groupId) {
            $orders = Order::where('order_group_id', $groupId)
                ->lockForUpdate()
                ->get();

            // Legacy/ungrouped orders (placed before order_group_id existed,
            // or created with a null group) have order_group_id = NULL, so
            // the query above never matches them. The frontend's own
            // fallback for these rows uses the order's plain numeric id as
            // its "group id" (see rebuildOrderGroups() in inventory.page.ts),
            // so mirror that here -- guarded to ungrouped rows only, and to
            // a purely numeric $groupId, so this can never be tricked into
            // satisfying a real (UUID) group id via a raw id collision.
            if ($orders->isEmpty() && ctype_digit($groupId)) {
                $orders = Order::where('id', (int) $groupId)
                    ->whereNull('order_group_id')
                    ->lockForUpdate()
                    ->get();
            }

            if ($orders->isEmpty()) {
                return response()->json(['message' => 'Order not found'], 404);
            }

            if ($orders->first()->user_id !== $request->user()->id) {
                return response()->json(['message' => 'You do not have permission to cancel this order.'], 403);
            }

            if ($orders->contains(fn ($o) => $o->status !== 'pending')) {
                return response()->json(['message' => 'Only orders still waiting for payment can be cancelled.'], 409);
            }

            foreach ($orders as $order) {
                if ($order->product_id) {
                    Product::where('id', $order->product_id)->increment('stock', $order->quantity);
                }
                $order->update(['status' => 'cancelled']);
            }

            return response()->json(['message' => 'Order cancelled']);
        });
    }

    /** PUT /api/inventory/orders/{id}/approve */
    public function approveOrder(int $id)
    {
        $order = Order::find($id);
        if (! $order) {
            return response()->json(['message' => 'Order not found'], 404);
        }
        $order->update(['status' => 'approved']);
        return response()->json(['message' => 'Order approved']);
    }

    /** PUT /api/inventory/orders/{id}/reject */
    public function rejectOrder(int $id)
    {
        return DB::transaction(function () use ($id) {
            $order = Order::where('id', $id)->lockForUpdate()->first();
            if (! $order) {
                return response()->json(['message' => 'Order not found'], 404);
            }

            // Give the stock back when rejecting -- but only once. Without
            // this guard, rejecting an already-rejected order (double click,
            // retried request) would incorrectly add stock back twice.
            if ($order->status !== 'rejected' && $order->product_id) {
                Product::where('id', $order->product_id)->increment('stock', $order->quantity);
            }

            $order->update(['status' => 'rejected']);
            return response()->json(['message' => 'Order rejected']);
        });
    }
}
