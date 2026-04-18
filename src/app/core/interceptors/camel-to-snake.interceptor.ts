import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler,
  HttpEvent, HttpResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Converts camelCase keys in all HTTP response bodies to snake_case so that
 * the Angular models (which use snake_case) work correctly with the NestJS
 * backend (which serialises entities in camelCase by default).
 *
 * Keys that are already snake_case (e.g. from /config and /kitchen/status)
 * pass through unchanged — inserting an underscore before an uppercase letter
 * that isn't there is a no-op.
 */

function camelToSnake(key: string): string {
  return key.replace(/([A-Z])/g, '_$1').toLowerCase();
}

function transformKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(transformKeys);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(
        ([k, v]) => [camelToSnake(k), transformKeys(v)]
      )
    );
  }
  return value;
}

@Injectable()
export class CamelToSnakeInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      map(event => {
        if (event instanceof HttpResponse && event.body) {
          return event.clone({ body: transformKeys(event.body) });
        }
        return event;
      }),
    );
  }
}
