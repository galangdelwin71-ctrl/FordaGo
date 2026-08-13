<?php

namespace App\Providers;

use Illuminate\Support\Carbon;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // By default, Eloquent's datetime casts serialize to JSON as
        // "Y-m-d H:i:s" — a NAIVE string with no timezone/offset info.
        // The app timezone is UTC (config/app.php), so every timestamp
        // (attendance.check_in_time, notifications.created_at, etc.) is
        // stored in UTC, but the frontend's `new Date(str)` has no way of
        // knowing that: it silently treats the naive string as if it were
        // already in the DEVICE's local time (Asia/Manila, UTC+8). That
        // produces a timestamp that is 8 hours off, and can even flip the
        // calendar date across midnight (e.g. a scan at 11:30 PM PHT is
        // 15:30 UTC the SAME day, but a scan at 1:00 AM PHT is 17:00 UTC
        // the PREVIOUS day — the naive string then shows the wrong date).
        //
        // Forcing ISO-8601 output with an explicit "Z" (UTC) suffix lets
        // every client correctly convert to its own local timezone.
        Carbon::serializeUsing(fn (Carbon $date) => $date->toISOString());
    }
}
