<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\EquipmentScanLog;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Ported from server/routes/equipment.js.
 */
class EquipmentController extends Controller
{
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
        $rows = Equipment::orderByDesc('created_at')->orderByDesc('id')->get();

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
            'name'         => $name,
            'category'     => $this->normalizeText($request->input('category')),
            'icon'         => $this->normalizeText($request->input('icon')),
            'status'       => $this->normalizeStatus($request->input('status')),
            'image_url'    => $this->normalizeText($request->input('image_url')),
            'description'  => $this->normalizeText($request->input('description')),
            'weight_scale' => $this->normalizeText($request->input('weight_scale')),
        ]);

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
            'name'         => $name,
            'category'     => $this->normalizeText($request->input('category')),
            'icon'         => $this->normalizeText($request->input('icon')),
            'status'       => $this->normalizeStatus($request->input('status')),
            'image_url'    => $this->normalizeText($request->input('image_url')),
            'description'  => $this->normalizeText($request->input('description')),
            'weight_scale' => $this->normalizeText($request->input('weight_scale')),
        ]);

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
