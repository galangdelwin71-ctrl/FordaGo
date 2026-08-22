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
        $period   = $request->query('period', 'all');
        $attWhere = $period !== 'all' ? 'WHERE ' . $this->periodWhere($period, 'a.check_in_time') : '';
        $ordWhere = $period !== 'all' ? 'WHERE ' . $this->periodWhere($period, 'o.created_at')    : '';
        $usrWhere = $period !== 'all' ? 'WHERE ' . $this->periodWhere($period, 'u.created_at')    : '';

        $attendance = DB::select("
            SELECT
                a.id,
                'attendance' AS source,
                u.id AS user_id,
                u.username,
                u.email,
                a.check_in_time AS transaction_date,
                a.membership_type AS sub_type,
                a.payment_status,
                'cash' AS payment_method,
                CASE WHEN a.membership_type = 'daily' THEN 40.00 ELSE 0.00 END AS amount,
                CASE WHEN a.membership_type = 'daily' THEN 'Daily Pass' ELSE 'Premium Check-in' END AS type_label,
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
                u.id AS user_id,
                u.username,
                u.email,
                o.created_at AS transaction_date,
                o.status AS sub_type,
                o.status AS payment_status,
                COALESCE(o.payment_method, 'cash') AS payment_method,
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

        $memberships = DB::select("
            SELECT
                u.id,
                'membership' AS source,
                u.id AS user_id,
                u.username,
                u.email,
                u.created_at AS transaction_date,
                u.membership_type AS sub_type,
                CASE WHEN u.membership_status = 'active' THEN 'paid' ELSE 'pending' END AS payment_status,
                COALESCE(u.payment_method, 'cash') AS payment_method,
                500.00 AS amount,
                'Premium Membership Plan' AS type_label,
                NULL AS product_name,
                1 AS quantity
            FROM users u
            {$usrWhere}
            " . ($usrWhere ? "AND" : "WHERE") . " u.membership_type = 'premium' AND u.role = 'user'
            ORDER BY u.created_at DESC
        ");

        $combined = collect(array_merge($attendance, $orders, $memberships))
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
                u.id AS user_id,
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
        $totalRevenue = collect($rows)->where('payment_status', 'paid')->sum('amount');

        // Hourly breakdown (Morning: 5-11, Afternoon: 12-16, Evening: 17-23)
        $morningCount   = 0;
        $afternoonCount = 0;
        $eveningCount   = 0;
        foreach ($rows as $r) {
            if (! empty($r->check_in_time)) {
                $hour = (int) date('H', strtotime($r->check_in_time));
                if ($hour >= 5 && $hour < 12) {
                    $morningCount++;
                } elseif ($hour >= 12 && $hour < 17) {
                    $afternoonCount++;
                } else {
                    $eveningCount++;
                }
            }
        }

        return response()->json([
            'rows'    => $rows,
            'summary' => array_merge(
                compact('total', 'daily', 'premium', 'paidCount', 'totalRevenue'),
                [
                    'morningCount'   => $morningCount,
                    'afternoonCount' => $afternoonCount,
                    'eveningCount'   => $eveningCount,
                ]
            ),
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
        $usrWhere = $this->periodWhere($period, 'u.created_at');

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
            WHERE {$ordWhere} AND o.status IN ('approved', 'completed')
            GROUP BY DATE(o.created_at)
            ORDER BY sale_date DESC
        ");

        $membershipSales = DB::select("
            SELECT
                DATE(u.created_at) AS sale_date,
                COUNT(*) AS count,
                SUM(500.00) AS revenue
            FROM users u
            WHERE {$usrWhere} AND u.membership_type = 'premium' AND u.membership_status = 'active' AND u.role = 'user'
            GROUP BY DATE(u.created_at)
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

        $membershipSales = collect($membershipSales)->map(function ($row) {
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
            SELECT 
                COUNT(*) AS total_orders, 
                COALESCE(SUM(CASE WHEN o.status IN ('approved', 'completed') THEN o.total ELSE 0 END), 0) AS shop_revenue,
                COALESCE(SUM(CASE WHEN o.status = 'pending' THEN o.total ELSE 0 END), 0) AS pending_revenue,
                COALESCE(SUM(CASE WHEN o.status IN ('approved', 'completed') AND o.payment_method = 'cash' THEN o.total ELSE 0 END), 0) AS cash_revenue,
                COALESCE(SUM(CASE WHEN o.status IN ('approved', 'completed') AND o.payment_method = 'gcash' THEN o.total ELSE 0 END), 0) AS gcash_revenue,
                COALESCE(SUM(CASE WHEN o.status IN ('approved', 'completed') THEN o.quantity ELSE 0 END), 0) AS items_sold
            FROM orders o WHERE {$ordWhere}
        ");

        $memTotal = DB::selectOne("
            SELECT
                COUNT(*) AS total_memberships,
                COALESCE(SUM(CASE WHEN u.membership_status = 'active' THEN 500.00 ELSE 0 END), 0) AS membership_revenue,
                COALESCE(SUM(CASE WHEN u.membership_status = 'pending' THEN 500.00 ELSE 0 END), 0) AS pending_membership_revenue,
                COALESCE(SUM(CASE WHEN u.membership_status = 'active' AND u.payment_method = 'cash' THEN 500.00 ELSE 0 END), 0) AS cash_membership,
                COALESCE(SUM(CASE WHEN u.membership_status = 'active' AND u.payment_method = 'gcash' THEN 500.00 ELSE 0 END), 0) AS gcash_membership
            FROM users u
            WHERE {$usrWhere} AND u.membership_type = 'premium' AND u.role = 'user'
        ");

        $gymRevenue        = (float) ($attTotal->gym_revenue  ?? 0);
        $shopRevenue       = (float) ($ordTotal->shop_revenue ?? 0);
        $membershipRevenue = (float) ($memTotal->membership_revenue ?? 0);
        $pendingRevenue    = (float) (($ordTotal->pending_revenue ?? 0) + ($memTotal->pending_membership_revenue ?? 0));
        $cashRevenue       = (float) (($ordTotal->cash_revenue ?? 0) + $gymRevenue + ($memTotal->cash_membership ?? 0));
        $gcashRevenue      = (float) (($ordTotal->gcash_revenue ?? 0) + ($memTotal->gcash_membership ?? 0));
        $itemsSold         = (int)   ($ordTotal->items_sold ?? 0);

        return response()->json([
            'attendanceSales' => $attendanceSales,
            'shopSales'       => $shopSales,
            'membershipSales' => $membershipSales,
            'summary' => [
                'gymRevenue'        => $gymRevenue,
                'shopRevenue'       => $shopRevenue,
                'membershipRevenue' => $membershipRevenue,
                'totalRevenue'      => $gymRevenue + $shopRevenue + $membershipRevenue,
                'pendingRevenue'    => $pendingRevenue,
                'cashRevenue'       => $cashRevenue,
                'gcashRevenue'      => $gcashRevenue,
                'itemsSold'         => $itemsSold,
                'totalCheckins'     => $attTotal->total_checkins ?? 0,
                'totalOrders'       => $ordTotal->total_orders  ?? 0,
                'totalMemberships'  => $memTotal->total_memberships ?? 0,
            ],
        ]);
    }

    /**
     * GET /api/reports/admin/memberships?period=all|monthly
     */
    public function adminMemberships(Request $request)
    {
        $users = DB::select("
            SELECT
                u.id,
                'member' AS account_type,
                u.username,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                u.membership_type,
                u.membership_status,
                u.membership_expiry,
                COALESCE(u.payment_method, 'cash') AS payment_method,
                u.created_at,
                CASE WHEN u.membership_type = 'premium' THEN 500.00 ELSE 40.00 END AS plan_price,
                NULL AS coach_specialty,
                NULL AS coach_rate
            FROM users u
            WHERE u.role = 'user' AND NOT EXISTS (SELECT 1 FROM coach_profiles cp WHERE cp.user_id = u.id)
            ORDER BY 
                CASE WHEN u.membership_status = 'pending' THEN 0 ELSE 1 END,
                u.created_at DESC
        ");

        $coaches = DB::select("
            SELECT
                u.id,
                'coach' AS account_type,
                u.username,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                'coach' AS membership_type,
                CASE WHEN cp.is_active = 1 THEN 'active' ELSE 'inactive' END AS membership_status,
                cp.contract_expiry AS membership_expiry,
                COALESCE(u.payment_method, 'cash') AS payment_method,
                u.created_at,
                cp.rate AS plan_price,
                cp.specialty AS coach_specialty,
                cp.rate AS coach_rate
            FROM coach_profiles cp
            JOIN users u ON cp.user_id = u.id
            ORDER BY cp.created_at DESC
        ");

        $allAccounts = array_merge($users, $coaches);
        $today = new \DateTime('today');

        $rows = collect($allAccounts)->map(function ($u) use ($today) {
            $u->plan_price = (float) $u->plan_price;
            
            if ($u->membership_expiry) {
                $expiry = new \DateTime($u->membership_expiry);
                $diff = (int) $today->diff($expiry)->format('%r%a');
                $u->days_left = max(0, $diff);
                $u->is_expired = $diff <= 0;
                $u->is_expiring_soon = $diff > 0 && $diff <= 7;
                
                $totalDays = 30;
                $consumedDays = min(max($totalDays - $u->days_left, 0), $totalDays);
                $u->progress_percent = (int) round(($consumedDays / $totalDays) * 100);
            } else {
                $u->days_left = ($u->membership_type === 'premium' || $u->membership_type === 'coach') ? 30 : 0;
                $u->is_expired = false;
                $u->is_expiring_soon = false;
                $u->progress_percent = 0;
            }

            return $u;
        })->values()->all();

        $totalMembers     = collect($rows)->where('account_type', 'member')->count();
        $totalCoaches     = collect($rows)->where('account_type', 'coach')->count();
        $activePremium    = collect($rows)->where('membership_type', 'premium')->where('membership_status', 'active')->count();
        $pendingPremium   = collect($rows)->where('membership_type', 'premium')->where('membership_status', 'pending')->count();
        $dailyMembers     = collect($rows)->where('membership_type', 'daily')->count();
        $activeCoaches    = collect($rows)->where('account_type', 'coach')->where('membership_status', 'active')->count();
        $expiringSoon     = collect($rows)->where('is_expiring_soon', true)->count();
        $expiredPlans     = collect($rows)->where('is_expired', true)->count();
        $premiumRevenue   = $activePremium * 500.00;

        return response()->json([
            'rows'    => $rows,
            'summary' => compact('totalMembers', 'totalCoaches', 'activePremium', 'pendingPremium', 'dailyMembers', 'activeCoaches', 'expiringSoon', 'expiredPlans', 'premiumRevenue'),
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
                COALESCE(SUM(CASE WHEN o.status IN ('approved', 'completed') THEN o.quantity ELSE 0 END), 0) AS total_sold,
                COALESCE(SUM(CASE WHEN o.status IN ('approved', 'completed') THEN o.total    ELSE 0 END), 0) AS total_revenue
            FROM products p
            LEFT JOIN orders o ON o.product_id = p.id
            GROUP BY p.id, p.name, p.brand, p.price, p.stock
            ORDER BY total_sold DESC
        ");

        $rows = collect($rows)->map(function ($row) {
            $row->price         = (float) $row->price;
            $row->current_stock = (int) $row->current_stock;
            $row->total_sold    = (int) $row->total_sold;
            $row->total_revenue = (float) $row->total_revenue;
            
            if ($row->current_stock == 0) {
                $row->stock_status = 'out_of_stock';
            } elseif ($row->current_stock <= 5) {
                $row->stock_status = 'low_stock';
            } else {
                $row->stock_status = 'in_stock';
            }
            
            return $row;
        })->values()->all();

        $totalStock       = collect($rows)->sum('current_stock');
        $totalSold        = collect($rows)->sum('total_sold');
        $totalRevenue     = collect($rows)->sum('total_revenue');
        $lowStockCount    = collect($rows)->where('stock_status', 'low_stock')->count();
        $outOfStockCount  = collect($rows)->where('stock_status', 'out_of_stock')->count();
        $inventoryValue   = collect($rows)->sum(fn ($r) => $r->price * $r->current_stock);

        return response()->json([
            'rows'    => $rows,
            'summary' => compact('totalStock', 'totalSold', 'totalRevenue', 'lowStockCount', 'outOfStockCount', 'inventoryValue'),
        ]);
    }
}
