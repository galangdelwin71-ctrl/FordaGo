<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Ported from server/routes/workout.js.
 *
 * Backed by the `workouts` table (see
 * database/migrations/2026_08_08_000000_create_workouts_table.php).
 */
class WorkoutController extends Controller
{
    /** GET /api/workouts — current user's workouts */
    public function index(Request $request)
    {
        $rows = DB::select('SELECT * FROM workouts WHERE user_id = ?', [$request->user()->id]);
        return response()->json($rows);
    }

    /** POST /api/workouts — add a workout for current user */
    public function store(Request $request)
    {
        $name        = $request->input('name');
        $description = $request->input('description');
        $date        = $request->input('date');

        DB::insert(
            'INSERT INTO workouts (user_id, name, description, date) VALUES (?, ?, ?, ?)',
            [$request->user()->id, $name, $description, $date]
        );

        return response()->json(['message' => 'Workout added'], 201);
    }

    /** GET /api/workouts/all — all workouts (staff only) */
    public function all()
    {
        return response()->json(DB::select('SELECT * FROM workouts'));
    }
}
