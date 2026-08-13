import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = this.auth.token;
    const headers: Record<string, string> = {
      // Skips ngrok's free-tier HTML interstitial warning page so API
      // responses stay valid JSON when the backend is tunneled via ngrok.
      // Harmless no-op against Laravel or any other real backend.
      'ngrok-skip-browser-warning': 'true'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    req = req.clone({ setHeaders: headers });
    return next.handle(req);
  }
}
