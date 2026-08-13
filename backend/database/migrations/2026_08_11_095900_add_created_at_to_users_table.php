<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The real `users` table (created by the old Node backend) has no
     * created_at column — see the comment in App\Models\User and in
     * 2026_08_07_120000_document_existing_users_table.php. That is the
     * actual reason `login()` was returning `created_at: null`: there was
     * nothing to read.
     *
     * Adding it with ->useCurrent() means:
     *  - MySQL fills EVERY existing row with the timestamp of this
     *    migration run (their real signup date is unknowable, so "the day
     *    this feature shipped" is the safe cutover — it will not flag any
     *    pre-existing schedule data as "missed before account creation",
     *    and it will not retroactively spam existing users either).
     *  - Every new registration going forward gets a real, accurate
     *    created_at automatically via the column default, with no change
     *    needed in AuthController::register().
     */
    public function up(): void
    {
        if (Schema::hasColumn('users', 'created_at')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('created_at')->nullable()->useCurrent()->after('last_name');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'created_at')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('created_at');
        });
    }
};
