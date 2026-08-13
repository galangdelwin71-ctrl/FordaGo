import { HttpInterceptorFn } from '@angular/common/http';

export const ngrokInterceptor: HttpInterceptorFn = (req, next) => {
  const clonedRequest = req.clone({
    setHeaders: {
      'ngrok-skip-browser-warning': 'true'
    }
  });

  return next(clonedRequest);
};