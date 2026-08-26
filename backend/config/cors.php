<?php

/*
 * FordaGO CORS configuration.
 *
 * ACTIVE (paths => ['api/*', ...]) -- Laravel itself now sets the
 * Access-Control-Allow-* headers on every /api/* response.
 *
 * History: this used to be intentionally inert (paths => []) because the
 * old tunnel provider, InstaTunnel, injected its own
 * Access-Control-Allow-Origin/-Headers/-Methods on every response
 * regardless of what Laravel sent -- so Laravel setting its own copy on
 * top produced a DUPLICATED header ("contains multiple values '*, *'"),
 * which browsers reject outright.
 *
 * The project has since moved to Cloudflare Tunnel (`cloudflared tunnel
 * --url ...`), which is a transparent TCP/HTTP proxy: it does NOT inject
 * any CORS headers of its own. So there is now exactly ONE layer setting
 * CORS headers (this file), which is the normal/correct setup -- no more
 * duplicate-header risk.
 *
 * IMPORTANT: do not go back to a tunnel provider that injects its own
 * Access-Control-Allow-Origin (InstaTunnel, some ngrok configs) while
 * this file is active -- that reintroduces the duplicated-header bug.
 * If that ever happens again, either switch the tunnel provider or set
 * `paths => []` here again (pick ONE layer, never both).
 *
 * supports_credentials stays false: the frontend authenticates with a
 * Bearer token in the Authorization header (see auth.interceptor.ts),
 * not cookies, so credentialed CORS requests are never needed. Leaving
 * this false also means allowed_origins => ['*'] is safe/spec-compliant
 * (browsers refuse to combine wildcard origins with credentials
 * anyway).
 */

return [

    'paths' => ['api/*', 'broadcasting/auth', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    // Cache preflight results for 24 hours — with max_age=0 (the previous
    // value) the browser fires a fresh OPTIONS preflight before EVERY
    // single API request, each one occupying a PHP worker for 0.5–8s.
    // Setting 86400 (24 h, the Chrome maximum) means the browser only sends
    // one preflight the first time, then reuses the cached result for the
    // rest of the session — eliminating all those extra 1-8s round-trips.
    'max_age' => 86400,

    'supports_credentials' => false,

];
