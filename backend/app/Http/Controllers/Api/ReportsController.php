<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Ported from server/routes/reports.js.
 */
class ReportsController extends Controller
{
    /**
     * Build a raw WHERE clause fragment for the requested period.
     * Mirrors the periodWhere() helper in the Node version.
     */
    private function periodWhere(string $period, string $column): string
    {
        return match ($period) {
            'daily'   => "DATE({$column}) = CURDATE()",
            'weekly'  => "YEARWEEK({$column}, 1) = YEARWEEK(CURDATE(), 1)",
            'monthly' => "YEAR({$column}) = YEAR(CURDATE()) AND MONTH({$column}) = MONTH(CURDATE())",
            'yearly'  => "YEAR({$column}) = YEAR(CURDATE())",
            default   => '1=1',
        };
    }

    /**
     * GET /api/reports/my-transactions?period=daily|weekly|monthly|all
     */
    public function myTransactions(Request $request)
    {
        $period = $request->query('period', 'all');
        $userId = $request->user()->id;

        $attWhere  = $period !== 'all' ? 'AND ' . $this->periodWhere($period, 'a.check_in_time') : '';
        $ordWhere  = $period !== 'all' ? 'AND ' . $this->periodWhere($period, 'o.created_at')    : '';

        $attendance = DB::select("
            SELECT
                a.id,
                'attendance' AS source,
                a.check_in_time AS transaction_date,
                a.membership_type AS sub_type,
                a.payment_status,
                CASE WHEN a.membership_type = 'daily' THEN 40.00 ELSE 0.00 END AS amount,
                CASE WHEN a.membership_type = 'daily' THEN 'Daily Pass' ELSE 'Premium Membership' END AS type_label,
                a.confirmed_at,
                NULL AS product_name,
                NULL AS quantity
            FROM attendance a
            WHERE a.user_id = ? {$attWhere}
            ORDER BY a.check_in_time DESC
        ", [$userId]);

        $orders = DB::select("
            SELECT
                o.id,
                'order' AS source,
                o.created_at AS transaction_date,
                o.status AS sub_type,
                o.status AS payment_status,
                o.total AS amount,
                'Shop Purchase' AS type_label,
                NULL AS confirmed_at,
                p.name AS product_name,
                o.quantity
            FROM orders o
            LEFT JOIN products p ON o.product_id = p.id
            WHERE o.user_id = ? {$ordWhere}
            ORDER BY o.created_at DESC
        ", [$userId]);

        $combined = collect(array_merge($attendance, $orders))
            ->map(function ($row) {
                $row->amount = (float) $row->amount;
                return $row;
            })
            ->sortByDesc('transaction_date')
            ->values();

        return response()->json($combined);
    }

    /**
     * GET /api/reports/admin/transactions?period=daily|weekly|monthly|all
     */
    public function adminTransactions(Request $request)
    {
        $period  = $request->query('period', 'all');
        $attWhere = $period !== 'all' ? 'WHERE ' . $this->periodWhere($period, 'a.check_in_time') : '';
        $ordWhere = $period !== 'all' ? 'WHERE ' . $this->periodWhere($period, 'o.created_at')    : '';

        $attendance = DB::select("
            SELECT
                a.id,
                'attendance' AS source,
                u.username,
                u.email,
                a.check_in_time AS transaction_date,
                a.membership_type AS sub_type,
                a.payment_status,
                CASE WHEN a.membership_type = 'daily' THEN 40.00 ELSE 0.00 END AS amount,
                CASE WHEN a.membership_type = 'daily' THEN 'Daily Pass' ELSE 'Premium Membership' END AS type_label,
                NULL AS product_name,
                NULL AS quantity
            FROM attendance a
            JOIN users u ON a.user_id = u.id
            {$attWhere}
            ORDER BY a.check_in_time DESC
        ");

        $orders = DB::select("
            SELECT
                o.id,
                'order' AS source,
                u.username,
                u.email,
                o.created_at AS transaction_date,
                o.status AS sub_type,
                o.status AS payment_status,
                o.total AS amount,
                'Shop Purchase' AS type_label,
                p.name AS product_name,
                o.quantity
            FROM orders o
            JOIN users u ON o.user_id = u.id
            LEFT JOIN products p ON o.product_id = p.id
            {$ordWhere}
            ORDER BY o.created_at DESC
        ");

        $combined = collect(array_merge($attendance, $orders))
            ->map(function ($row) {
                $row->amount = (float) $row->amount;
                return $row;
            })
            ->sortByDesc('transaction_date')
            ->values();

        return response()->json($combined);
    }

    /**
     * GET /api/reports/admin/attendance?period=daily|weekly|monthly
     */
    public function adminAttendance(Request $request)
    {
        $period = $request->query('period', 'daily');
        $where  = $this->periodWhere($period, 'a.check_in_time');

        $rows = DB::select("
            SELECT
                a.id,
                u.username,
                u.email,
                u.membership_type AS user_plan,
                a.check_in_time,
                a.membership_type,
                a.payment_status,
                a.confirmed_at,
                CASE WHEN a.membership_type = 'daily' THEN 40.00 ELSE 0.00 END AS amount
            FROM attendance a
            JOIN users u ON a.user_id = u.id
            WHERE {$where}
            ORDER BY a.check_in_time DESC
        ");

        $rows = collect($rows)->map(function ($row) {
            $row->amount = (float) $row->amount;
            return $row;
        })->values()->all();

        $total        = count($rows);
        $daily        = collect($rows)->where('membership_type', 'daily')->count();
        $premium      = collect($rows)->where('membership_type', 'premium')->count();
        $paidCount    = collect($rows)->where('payment_status', 'paid')->count();
        $totalRevenue = collect($rows)->sum('amount');

        return response()->json([
            'rows'    => $rows,
            'summary' => compact('total', 'daily', 'premium', 'paidCount', 'totalRevenue'),
        ]);
    }

    /**
     * GET /api/reports/admin/sales?period=daily|weekly|monthly|yearly
     */
    public function adminSales(Request $request)
    {
        $period   = $request->query('period', 'monthly');
        $attWhere = $this->periodWhere($period, 'a.check_in_time');
        $ordWhere = $this->periodWhere($period, 'o.created_at');

        $attendanceSales = DB::select("
            SELECT
                DATE(a.check_in_time) AS sale_date,
                COUNT(*) AS count,
                SUM(CASE WHEN a.membership_type = 'daily' THEN 40.00 ELSE 0.00 END) AS revenue
            FROM attendance a
            WHERE {$attWhere} AND a.payment_status = 'paid'
            GROUP BY DATE(a.check_in_time)
            ORDER BY sale_date DESC
        ");

        $shopSales = DB::select("
            SELECT
                DATE(o.created_at) AS sale_date,
                COUNT(*) AS count,
                SUM(o.total) AS revenue
            FROM orders o
            WHERE {$ordWhere} AND o.status = 'approved'
            GROUP BY DATE(o.created_at)
            ORDER BY sale_date DESC
        ");

        $attendanceSales = collect($attendanceSales)->map(function ($row) {
            $row->count   = (int) $row->count;
            $row->revenue = (float) $row->revenue;
            return $row;
        })->values()->all();

        $shopSales = collect($shopSales)->map(function ($row) {
            $row->count   = (int) $row->count;
            $row->revenue = (float) $row->revenue;
            return $row;
        })->values()->all();

        $attTotal = DB::selectOne("
            SELECT
                COUNT(*) AS total_checkins,
                SUM(CASE WHEN membership_type='daily' AND payment_status='paid' THEN 40.00 ELSE 0 END) AS gym_revenue
            FROM attendance a WHERE {$attWhere}
        ");

       $ordTotal = DB::selectOne("
            SELECT COUNT(*) AS total_orders, COALESCE(SUM(o.total), 0) AS shop_revenue
            FROM orders o WHERE {$ordWhere} AND o.status='approved'
        ");

        $gymRevenue  = (float) ($attTotal->gym_revenue  ?? 0);
        $shopRevenue = (float) ($ordTotal->shop_revenue ?? 0);

        return response()->json([
            'attendanceSales' => $attendanceSales,
            'shopSales'       => $shopSales,
            'summary' => [
                'gymRevenue'    => $gymRevenue,
                'shopRevenue'   => $shopRevenue,
                'totalRevenue'  => $gymRevenue + $shopRevenue,
                'totalCheckins' => $attTotal->total_checkins ?? 0,
                'totalOrders'   => $ordTotal->total_orders  ?? 0,
            ],
        ]);
    }

    /**
     * GET /api/reports/admin/inventory
     */
    public function adminInventory()
    {
        $rows = DB::select("
            SELECT
                p.id,
                p.name,
                p.brand,
                p.price,
                p.stock AS current_stock,
                COALESCE(SUM(CASE WHEN o.status = 'approved' THEN o.quantity ELSE 0 END), 0) AS total_sold,
                COALESCE(SUM(CASE WHEN o.status = 'approved' THEN o.total    ELSE 0 END), 0) AS total_revenue
            FROM products p
            LEFT JOIN orders o ON o.product_id = p.id
            GROUP BY p.id, p.name, p.brand, p.price, p.stock
            ORDER BY total_sold DESC
        ");

        // MySQL returns DECIMAL columns (price, SUM() results) as strings via
        // PDO. Cast them to real numbers so the JSON response — and any math
        // the Angular frontend does on it — isn't working with strings.
        $rows = collect($rows)->map(function ($row) {
            $row->price         = (float) $row->price;
            $row->current_stock = (int) $row->current_stock;
            $row->total_sold    = (int) $row->total_sold;
            $row->total_revenue = (float) $row->total_revenue;
            return $row;
        })->values()->all();

        $totalStock   = collect($rows)->sum('current_stock');
        $totalSold    = collect($rows)->sum('total_sold');
        $totalRevenue = collect($rows)->sum('total_revenue');

        return response()->json([
            'rows'    => $rows,
            'summary' => compact('totalStock', 'totalSold', 'totalRevenue'),
        ]);
    }
}
