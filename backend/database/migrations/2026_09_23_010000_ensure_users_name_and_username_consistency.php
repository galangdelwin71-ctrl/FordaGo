<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Ensure columns exist and have appropriate lengths
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'first_name')) {
                $table->string('first_name', 80)->nullable()->after('name');
            }
            if (! Schema::hasColumn('users', 'last_name')) {
                $table->string('last_name', 80)->nullable()->after('first_name');
            }
            if (! Schema::hasColumn('users', 'username')) {
                $table->string('username', 50)->nullable()->unique()->after('id');
            }
        });

        // 2. Data normalization: backfill any rows where first_name or last_name is null
        $users = User::all();
        foreach ($users as $user) {
            $updated = false;

            // If first_name is empty or null, attempt to derive from username
            if (empty($user->first_name)) {
                $usernameStr = trim((string) $user->username);
                // Strip trailing numeric suffixes like " 2" or " 3"
                $cleanName = preg_replace('/\s+\d+$/', '', $usernameStr);
                $parts = preg_split('/\s+/', $cleanName, 2);

                if (! empty($parts[0])) {
                    $user->first_name = ucfirst($parts[0]);
                    $user->last_name = ! empty($parts[1]) ? ucfirst($parts[1]) : (! empty($user->last_name) ? $user->last_name : 'Member');
                    $updated = true;
                } else {
                    $user->first_name = 'Member';
                    $user->last_name = ! empty($user->last_name) ? $user->last_name : 'User';
                    $updated = true;
                }
            }

            // If last_name is still empty
            if (empty($user->last_name)) {
                $user->last_name = 'Member';
                $updated = true;
            }

            // If username is empty
            if (empty($user->username)) {
                $base = strtolower(preg_replace('/[^a-zA-Z0-9_]/', '', $user->first_name . ($user->last_name ? '_' . $user->last_name : '')));
                if (empty($base)) {
                    $base = 'member_' . $user->id;
                }
                $candidate = $base;
                $i = 1;
                while (User::where('username', $candidate)->where('id', '!=', $user->id)->exists()) {
                    $candidate = $base . '_' . $i;
                    $i++;
                }
                $user->username = $candidate;
                $updated = true;
            }

            if ($updated) {
                $user->save();
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Safe no-op to protect data integrity
    }
};
