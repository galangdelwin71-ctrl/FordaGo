
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { authInterceptor } from './app/services/auth.interceptor';
import { networkErrorInterceptor } from './app/services/network-error.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    // animated: false — this app's routes behave like bottom-tab navigation
    // (Home/Schedule/Scan/Shop/Profile), not a hierarchical push/pop stack.
    // Ionic's default page-transition animation slides the ENTIRE ion-page
    // (header + content + footer together) on every route change, which is
    // what made the header/bottom-nav look like they were "moving"/shifting
    // between pages. Disabling it makes route swaps instant, so the shared
    // header and bottom nav read as a fixed, persistent shell.
    provideIonicAngular({ animated: false }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    // authInterceptor attaches the bearer token; networkErrorInterceptor
    // normalizes "can't reach the server" failures into one accurate
    // message (see that file). networkErrorInterceptor must be LAST so it
    // sees the final error after auth has already run.
    //
    // NOTE: there used to be a third interceptor here (ngrokInterceptor)
    // that added an `ngrok-skip-browser-warning` header to every request.
    // That was needed for the old ngrok tunnel, but this project now uses
    // InstaTunnel (see api.config.ts), which doesn't need it -- and worse,
    // InstaTunnel's edge answers the CORS preflight itself with a fixed
    // allowed-headers list that does NOT include ngrok-skip-browser-warning,
    // so sending it made every request fail CORS preflight client-side
    // ("Request header field ngrok-skip-browser-warning is not allowed by
    // Access-Control-Allow-Headers in preflight response") before it ever
    // reached the backend. Do not re-add it.
    provideHttpClient(
      withInterceptors([authInterceptor, networkErrorInterceptor])
    ),
  ],
});
