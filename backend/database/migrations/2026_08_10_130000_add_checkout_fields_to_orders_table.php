<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Adds cart-checkout support to the orders table.
 *
 * The frontend's shop cart/quick-order flow (InventoryController::checkout)
 * needs three things the original orders table never had:
 *
 *   - order_group_id: ties multiple order rows together when a member
 *     checks out several cart items (or places a single quick order) in
 *     one action, so the "My Orders" screen can show/cancel them as one
 *     packed group instead of separate unrelated rows.
 *   - payment_method: which method (cash/gcash) the member chose at
 *     checkout time.
 *   - status enum gains 'completed' (admin has handed the item over) and
 *     'cancelled' (member cancelled while still pending) -- both already
 *     expected/mapped by the frontend but never existed at the DB level,
 *     which is why POST /inventory/cart/checkout had nowhere valid to
 *     write to even once the route itself is added.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('orders', 'order_group_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->string('order_group_id', 36)->nullable()->after('id')->index();
            });
        }

        if (! Schema::hasColumn('orders', 'payment_method')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->enum('payment_method', ['cash', 'gcash'])->default('cash')->after('total');
            });
        }

        // Widening an enum isn't portable via the schema builder, so alter
        // the column directly. Existing rows (all currently
        // pending/approved/rejected) are unaffected by widening the set.
        DB::statement(
            "ALTER TABLE orders MODIFY status ENUM('pending','approved','rejected','completed','cancelled') NOT NULL DEFAULT 'pending'"
        );
    }

    public function down(): void
    {
        // Narrowing back to the original 3-value enum would fail if any
        // 'completed'/'cancelled' rows exist by then, so leave the enum as
        // committed data; only reverse the additive columns.
        if (Schema::hasColumn('orders', 'payment_method')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn('payment_method');
            });
        }

        if (Schema::hasColumn('orders', 'order_group_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn('order_group_id');
            });
        }
    }
};
