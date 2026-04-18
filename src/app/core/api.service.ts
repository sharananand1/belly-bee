import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/** Backend envelope: all real-API responses are wrapped in this shape. */
interface Envelope<T> { success: boolean; data: T; message: string; meta: any }

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: Record<string, string>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => { httpParams = httpParams.set(k, v); });
    }
    return this.http.get<Envelope<T>>(`${this.base}${path}`, { params: httpParams })
      .pipe(map(r => r.data));
  }

  post<T>(path: string, body: any = {}): Observable<T> {
    return this.http.post<Envelope<T>>(`${this.base}${path}`, body)
      .pipe(map(r => r.data));
  }

  put<T>(path: string, body: any = {}): Observable<T> {
    return this.http.put<Envelope<T>>(`${this.base}${path}`, body)
      .pipe(map(r => r.data));
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<Envelope<T>>(`${this.base}${path}`)
      .pipe(map(r => r.data));
  }
}
