<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'two_factor_enabled')) {
                $table->boolean('two_factor_enabled')->default(false);
            }
            if (!Schema::hasColumn('users', 'two_factor_channel')) {
                $table->string('two_factor_channel', 20)->default('email');
            }
            if (!Schema::hasColumn('users', 'two_factor_code')) {
                $table->string('two_factor_code', 64)->nullable();
            }
            if (!Schema::hasColumn('users', 'two_factor_expires_at')) {
                $table->timestamp('two_factor_expires_at')->nullable();
            }
            if (!Schema::hasColumn('users', 'biometric_enabled')) {
                $table->boolean('biometric_enabled')->default(false);
            }
            if (!Schema::hasColumn('users', 'biometric_credential_id')) {
                $table->text('biometric_credential_id')->nullable();
            }
            if (!Schema::hasColumn('users', 'biometric_token_hash')) {
                $table->string('biometric_token_hash', 64)->nullable();
            }
            if (!Schema::hasColumn('users', 'biometric_device_name')) {
                $table->string('biometric_device_name', 100)->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $cols = [
                'two_factor_enabled',
                'two_factor_channel',
                'two_factor_code',
                'two_factor_expires_at',
                'biometric_enabled',
                'biometric_credential_id',
                'biometric_token_hash',
                'biometric_device_name',
            ];
            foreach ($cols as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
