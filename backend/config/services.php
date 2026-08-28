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
        'key'        => env('RESEND_API_KEY'),
        'from_email' => env('MAIL_FROM_ADDRESS', 'onboarding@resend.dev'),
        'from_name'  => env('MAIL_FROM_NAME', 'FordaGO Gym'),
    ],

    'brevo' => [
        'key'        => env('BREVO_API_KEY'),
        'from_email' => env('MAIL_FROM_ADDRESS', 'no-reply@fordago.com'),
        'from_name'  => env('MAIL_FROM_NAME', 'FordaGO Gym'),
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

    // SMS provider switch: philsms, semaphore, or twilio
    'sms' => [
        'provider' => env('SMS_PROVIDER'),
    ],

    'philsms' => [
        'api_token' => env('PHILSMS_API_TOKEN'),
        'sender_id' => env('PHILSMS_SENDER_ID', 'PhilSMS'),
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
    'firebase' => [
        'project_id'           => env('FIREBASE_PROJECT_ID', ''),
        'service_account_json' => env('FIREBASE_SERVICE_ACCOUNT_JSON', ''),
    ],
];

