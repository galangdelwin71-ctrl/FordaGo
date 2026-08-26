<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with default test & admin accounts.
     */
    public function run(): void
    {
        // 1. Primary Super Admin Account
        User::updateOrCreate(
            ['email' => 'superadmin@fordago.com'],
            [
                'username'          => 'Super Admin',
                'first_name'        => 'Super',
                'last_name'         => 'Admin',
                'password'          => Hash::make('SuperAdmin@1'),
                'role'              => 'super_admin',
                'phone'             => '09191234567',
                'gender'            => 'male',
                'membership_type'   => 'premium',
                'membership_status' => 'active',
                'payment_method'    => 'cash',
            ]
        );

        // 2. Personal Super Admin Account
        User::updateOrCreate(
            ['email' => 'delwinfermin3@gmail.com'],
            [
                'username'          => 'Admin Delwin',
                'first_name'        => 'Delwin',
                'last_name'         => 'Fermin',
                'password'          => Hash::make('winMay7676#'),
                'role'              => 'super_admin',
                'phone'             => '09171234567',
                'gender'            => 'male',
                'membership_type'   => 'premium',
                'membership_status' => 'active',
                'payment_method'    => 'cash',
            ]
        );

        // 2. Secondary Admin Account
        User::updateOrCreate(
            ['email' => 'admin@fordago.com'],
            [
                'username'          => 'Admin FordaGo',
                'first_name'        => 'FordaGo',
                'last_name'         => 'Admin',
                'password'          => Hash::make('Admin1234!'),
                'role'              => 'admin',
                'phone'             => '09181234567',
                'gender'            => 'male',
                'membership_type'   => 'premium',
                'membership_status' => 'active',
                'payment_method'    => 'cash',
            ]
        );
    }
}
