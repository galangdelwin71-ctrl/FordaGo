<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // SMS provider switch: semaphore or twilio (ported from server/services/sms.js)
    'sms' => [
        'provider' => env('SMS_PROVIDER'),
    ],

    'semaphore' => [
        'api_key' => env('SEMAPHORE_API_KEY'),
        'sender' => env('SEMAPHORE_SENDER', 'FordaGO'),
    ],


    'twilio' => [
        'sid'   => env('TWILIO_ACCOUNT_SID'),
        'token' => env('TWILIO_AUTH_TOKEN'),
        'from'  => env('TWILIO_FROM_NUMBER'),
    ],

    // Firebase Cloud Messaging (HTTP v1 API)
    // FIREBASE_PROJECT_ID  → Firebase Console → Project Settings → General → Project ID
    // FIREBASE_SERVICE_ACCOUNT_JSON → Project Settings → Service Accounts → Generate new private key
    //   (paste the entire JSON content as a single-line string in .env)
    'firebase' => [
        'project_id'           => env('FIREBASE_PROJECT_ID', ''),
        'service_account_json' => env('FIREBASE_SERVICE_ACCOUNT_JSON', ''),
    ],

];

