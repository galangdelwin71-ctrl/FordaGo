// DEPRECATED — DO NOT USE.
//
// This interceptor added an `ngrok-skip-browser-warning` header to every
// request. It was needed back when this project tunneled through ngrok's
// free tier (which shows an interstitial warning page for browser
// traffic). The project has since moved to InstaTunnel (see
// src/app/config/api.config.ts), which does not show that warning page
// and does not need this header at all.
//
// Worse, InstaTunnel's own edge answers the CORS preflight (`OPTIONS`)
// request itself, with a fixed `Access-Control-Allow-Headers` list that
// does NOT include `ngrok-skip-browser-warning`. Sending this header
// therefore made the browser/WebView reject every request during CORS
// preflight -- before it ever reached the Laravel backend -- surfacing
// to Angular as an opaque `status: 0` network error. See main.ts, which
// no longer registers this interceptor.
//
// Left here (unused, unregistered) instead of deleted only because this
// filesystem connector has no delete operation. Do not import or
// register this again.
export {};
