import { ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';

import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { AuthInterceptor } from './core/auth.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { CamelToSnakeInterceptor } from './core/interceptors/camel-to-snake.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),

    provideRouter(
      routes,
      withComponentInputBinding(),          // route params auto-bound to @Input()
      withInMemoryScrolling({ scrollPositionRestoration: 'top' })
    ),

    provideHttpClient(withInterceptorsFromDi()),
    // CamelToSnake runs first — transforms API responses before other interceptors see the body
    { provide: HTTP_INTERCEPTORS, useClass: CamelToSnakeInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor,         multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor,        multi: true },

    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
