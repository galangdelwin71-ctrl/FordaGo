<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\EquipmentScanLog;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * Ported from server/routes/equipment.js.
 */
class EquipmentController extends Controller
{
    /** Cache key for the full equipment list (see index()/invalidateEquipmentCache()). */
    private const EQUIPMENT_CACHE_KEY = 'equipment.all';

    /**
     * How long the equipment list stays cached before a natural refresh.
     *
     * Short on purpose (not the original 10 min) -- invalidateEquipmentCache()
     * only fires on writes made THROUGH this controller (store/update/
     * destroy). A row added or edited directly in the database (phpMyAdmin,
     * a seeder, a fresh migrate+seed -- all common during active dev/
     * testing) bypasses that hook entirely, so the cache would otherwise
     * keep serving a stale/empty snapshot for the full TTL with no way to
     * know new data exists. 60s bounds that blind spot to something barely
     * noticeable while still avoiding a re-query on every rapid tab switch,
     * which was the actual goal of caching this list.
     */
    private const EQUIPMENT_CACHE_TTL_MINUTES = 1;

    /**
     * Invalidate the cached equipment list. Called from every write path
     * (store/update/destroy) so the cache can never serve stale data.
     */
    private function invalidateEquipmentCache(): void
    {
        Cache::forget(self::EQUIPMENT_CACHE_KEY);
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private function normalizeStatus(?string $value): string
    {
        $v = strtolower(trim((string) $value));

        if (in_array($v, ['not available', 'unavailable', 'notavailable', 'in-use', 'occupied'], true)) {
            return 'unavailable';
        }
        if (in_array($v, ['available', 'maintenance'], true)) {
            return $v;
        }

        return 'available';
    }

    private function normalizeText(?string $value): ?string
    {
        $v = trim((string) $value);

        return $v !== '' ? $v : null;
    }

    private function parseDate(?string $value): ?string
    {
        $input = trim((string) $value);

        return preg_match('/^\d{4}-\d{2}-\d{2}$/', $input) ? $input : null;
    }

    // ── Endpoints ────────────────────────────────────────────────────────

    /**
     * GET /api/equipment
     * All equipment, any authenticated user.
     */
    public function index()
    {
        // NOTE: the cached value must be a plain array, never the raw
        // Eloquent Collection/Model objects. config/cache.php sets
        // 'serializable_classes' => false (Laravel's default hardening
        // against gadget-chain attacks on a leaked APP_KEY), which makes
        // unserialize() refuse to reconstruct ANY class on a cache HIT --
        // every Equipment model in the collection comes back as an inert
        // __PHP_Incomplete_Class stub with no readable properties instead.
        // response()->json() on that silently produced "{}" rather than an
        // array, which the frontend read as "not an array" and displayed
        // as "Could not load equipment." This was only ever wrong on a
        // cache HIT (the first read after each 60s TTL/invalidation was
        // always fine), which is exactly why it looked intermittent when
        // navigating back and forth. ->toArray() caches plain arrays/
        // scalars instead, which unserialize() always reconstructs
        // correctly regardless of the allowed-classes restriction.
        $rows = Cache::remember(
            self::EQUIPMENT_CACHE_KEY,
            now()->addMinutes(self::EQUIPMENT_CACHE_TTL_MINUTES),
            fn () => Equipment::orderByDesc('created_at')->orderByDesc('id')->get()->toArray()
        );

        return response()->json($rows);
    }

    /**
     * POST /api/equipment/scan
     * Log a QR scan — any authenticated user.
     */
    public function scan(Request $request)
    {
        $equipmentCode = trim((string) $request->input('equipment_code', ''));
        $equipmentName = trim((string) $request->input('equipment_name', ''));
        $rawQr         = trim((string) $request->input('raw_qr', ''));
        $equipmentIdRaw = $request->input('equipment_id');
        $equipmentId   = is_numeric($equipmentIdRaw) ? (int) $equipmentIdRaw : null;

        if ($equipmentName === '') {
            return response()->json(['message' => 'equipment_name is required'], 400);
        }

        // Try to resolve equipment ID from name/code if not provided
        if (! $equipmentId && $equipmentCode !== '') {
            $match = Equipment::whereRaw('LOWER(name) = LOWER(?)', [$equipmentName])
                ->orWhereRaw('LOWER(category) = LOWER(?)', [$equipmentCode])
                ->first();
            if ($match) {
                $equipmentId = $match->id;
            }
        }

        EquipmentScanLog::create([
            'user_id'        => $request->user()->id,
            'equipment_id'   => $equipmentId,
            'equipment_code' => $equipmentCode !== '' ? $equipmentCode : null,
            'equipment_name' => $equipmentName,
            'raw_qr'         => $rawQr !== '' ? $rawQr : null,
        ]);

        return response()->json(['message' => 'Equipment scan logged.'], 201);
    }

    /**
     * GET /api/equipment/scan-logs?date=YYYY-MM-DD
     * Scan logs for a date (staff only).
     */
    public function scanLogs(Request $request)
    {
        $date = $this->parseDate($request->query('date')) ?? now()->toDateString();

        $rows = EquipmentScanLog::query()
            ->join('users', 'users.id', '=', 'equipment_scan_logs.user_id')
            ->whereDate('equipment_scan_logs.scanned_at', $date)
            ->orderByDesc('equipment_scan_logs.scanned_at')
            ->select([
                'equipment_scan_logs.id',
                'equipment_scan_logs.user_id',
                'users.username',
                'users.email',
                'equipment_scan_logs.equipment_id',
                'equipment_scan_logs.equipment_code',
                'equipment_scan_logs.equipment_name',
                'equipment_scan_logs.scanned_at',
            ])
            ->get();

        return response()->json($rows);
    }

    /**
     * POST /api/equipment
     * Add equipment and notify all regular users (staff only).
     */
    public function store(Request $request)
    {
        $name = $this->normalizeText($request->input('name'));

        if (! $name) {
            return response()->json(['message' => 'Equipment name is required'], 400);
        }

        $equipment = Equipment::create([
            'name'          => $name,
            'category'      => $this->normalizeText($request->input('category')),
            'icon'          => $this->normalizeText($request->input('icon')),
            'status'        => $this->normalizeStatus($request->input('status')),
            'image_url'     => $this->normalizeText($request->input('image_url')),
            'thumbnail_url' => $this->normalizeText($request->input('thumbnail_url')),
            'description'   => $this->normalizeText($request->input('description')),
            'weight_scale'  => $this->normalizeText($request->input('weight_scale')),
        ]);

        $this->invalidateEquipmentCache();

        // Notify all regular users (best-effort, mirrors Node version)
        $this->notifyNewEquipment($equipment->name);

        return response()->json($equipment, 201);
    }

    /**
     * PUT /api/equipment/{id}
     * Update equipment (staff only).
     */
    public function update(Request $request, int $id)
    {
        $name = $this->normalizeText($request->input('name'));

        if (! $name) {
            return response()->json(['message' => 'Equipment name is required'], 400);
        }

        $equipment = Equipment::find($id);
        if (! $equipment) {
            return response()->json(['message' => 'Equipment not found'], 404);
        }

        $equipment->update([
            'name'          => $name,
            'category'      => $this->normalizeText($request->input('category')),
            'icon'          => $this->normalizeText($request->input('icon')),
            'status'        => $this->normalizeStatus($request->input('status')),
            'image_url'     => $this->normalizeText($request->input('image_url')),
            'thumbnail_url' => $this->normalizeText($request->input('thumbnail_url')),
            'description'   => $this->normalizeText($request->input('description')),
            'weight_scale'  => $this->normalizeText($request->input('weight_scale')),
        ]);

        $this->invalidateEquipmentCache();

        return response()->json($equipment);
    }

    /**
     * DELETE /api/equipment/{id}
     * Delete equipment (staff only).
     */
    public function destroy(int $id)
    {
        $equipment = Equipment::find($id);
        if (! $equipment) {
            return response()->json(['message' => 'Equipment not found'], 404);
        }

        $equipment->delete();
        $this->invalidateEquipmentCache();

        return response()->noContent();
    }

    // ── Private helpers ───────────────────────────────────────────────────

    private function notifyNewEquipment(string $name): void
    {
        try {
            $userIds = User::where('role', 'user')->pluck('id');
            if ($userIds->isEmpty()) {
                return;
            }

            $notifications = $userIds->map(fn ($uid) => [
                'user_id' => $uid,
                'title'   => 'New Equipment Added',
                'message' => "A new equipment \"{$name}\" is now available in the gym!",
            ])->all();

            Notification::insert($notifications);
        } catch (\Throwable) {
            // best-effort — don't fail the request
        }
    }
}
