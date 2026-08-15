
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { ngrokInterceptor } from './ngrok.interceptor';
import { authInterceptor } from './app/services/auth.interceptor';

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
    // authInterceptor attaches the bearer token; ngrokInterceptor skips the
    // ngrok browser-warning page. Order doesn't matter here — both clone
    // the request via setHeaders on independent header keys.
    provideHttpClient(
      withInterceptors([authInterceptor, ngrokInterceptor])
    ),
  ],
});
