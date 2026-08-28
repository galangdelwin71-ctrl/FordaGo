<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\CoachProfile;
use App\Services\AvatarService;

$users = User::all();
foreach ($users as $user) {
    $cp = CoachProfile::where('user_id', $user->id)->first();
    
    // Choose the active photo (coach photo or user photo)
    $activePhoto = $cp?->photo_url ?: $user->profile_image;
    
    if ($activePhoto) {
        // If it's base64, save to static storage file
        $processed = AvatarService::processAvatar($activePhoto, $user->id);
        
        $user->update(['profile_image' => $processed]);
        if ($cp) {
            $cp->update(['photo_url' => $processed]);
        }
        echo "Synced avatar for user {$user->username} (ID: {$user->id}) -> {$processed}\n";
    }
}

echo "Avatar sync complete.\n";
