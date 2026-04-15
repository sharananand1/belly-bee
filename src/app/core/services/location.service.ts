import { Injectable, inject } from '@angular/core';
import { Observable, of, from, throwError } from 'rxjs';
import { map, switchMap, delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiService } from '../api.service';
import { Address } from '../../models/address.model';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeocodedAddress {
  display: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  latlng: LatLng;
}

const MOCK_ADDRESSES: GeocodedAddress[] = [
  {
    display: '12 MG Road, Bengaluru, Karnataka 560001',
    line1: '12 MG Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    latlng: { lat: 12.9716, lng: 77.5946 },
  },
  {
    display: '5 Brigade Road, Bengaluru, Karnataka 560025',
    line1: '5 Brigade Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560025',
    latlng: { lat: 12.9734, lng: 77.6066 },
  },
];

@Injectable({ providedIn: 'root' })
export class LocationService {
  private api = inject(ApiService);

  /** Use browser Geolocation API to get current lat/lng. */
  getCurrentPosition(): Observable<LatLng> {
    if (!navigator.geolocation) {
      return throwError(() => new Error('Geolocation not supported'));
    }
    return from(
      new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      )
    ).pipe(map(pos => ({ lat: pos.coords.latitude, lng: pos.coords.longitude })));
  }

  /** Reverse-geocode lat/lng into a human-readable address. */
  reverseGeocode(latlng: LatLng): Observable<GeocodedAddress> {
    if (environment.useMock) {
      return of({ ...MOCK_ADDRESSES[0], latlng }).pipe(delay(600));
    }
    return this.api.get<GeocodedAddress>('/location/reverse-geocode', {
      lat: String(latlng.lat),
      lng: String(latlng.lng),
    });
  }

  /** Autocomplete address text input. */
  searchAddress(query: string): Observable<GeocodedAddress[]> {
    if (environment.useMock) {
      const lower = query.toLowerCase();
      return of(MOCK_ADDRESSES.filter(a => a.display.toLowerCase().includes(lower))).pipe(delay(350));
    }
    return this.api.get<GeocodedAddress[]>('/location/search', { q: query });
  }

  /** Get current position then reverse-geocode in one step. */
  detectCurrentAddress(): Observable<GeocodedAddress> {
    return this.getCurrentPosition().pipe(
      switchMap(latlng => this.reverseGeocode(latlng))
    );
  }
}
