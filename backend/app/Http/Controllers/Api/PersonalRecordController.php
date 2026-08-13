<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PersonalRecord;
use Illuminate\Http\Request;

/**
 * Backed by the `personal_records` table (see
 * database/migrations/2026_08_11_100100_create_personal_records_table.php).
 * Replaces the frontend's `fordago_personal_records_{userId}` localStorage.
 * Every endpoint is scoped to $request->user()->id.
 */
class PersonalRecordController extends Controller
{
    /** GET /api/personal-records */
    public function index(Request $request)
    {
        $rows = PersonalRecord::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($rows);
    }

    /** POST /api/personal-records */
    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        $record = PersonalRecord::create([
            'user_id'  => $request->user()->id,
            ...$validated,
        ]);

        return response()->json($record, 201);
    }

    /** PUT /api/personal-records/{id} */
    public function update(Request $request, int $id)
    {
        $record = PersonalRecord::where('user_id', $request->user()->id)->find($id);
        if (! $record) {
            return response()->json(['message' => 'Personal record not found.'], 404);
        }

        $record->update($this->validatePayload($request));

        return response()->json($record);
    }

    /** DELETE /api/personal-records/{id} */
    public function destroy(Request $request, int $id)
    {
        $record = PersonalRecord::where('user_id', $request->user()->id)->find($id);
        if (! $record) {
            return response()->json(['message' => 'Personal record not found.'], 404);
        }

        $record->delete();

        return response()->noContent();
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'exercise' => ['required', 'string', 'max:255'],
            'icon'     => ['sometimes', 'nullable', 'string', 'max:100'],
            'value'    => ['required', 'string', 'max:50'],
            'unit'     => ['sometimes', 'nullable', 'string', 'max:20'],
        ]);
    }
}
