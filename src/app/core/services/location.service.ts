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
    display: 'JVTS Garden, C Block, Chhatarpur, New Delhi 110074',
    line1: 'JVTS Garden, C Block',
    city: 'Chhatarpur',
    state: 'Delhi',
    pincode: '110074',
    latlng: { lat: 28.4992, lng: 77.1855 },
  },
  {
    display: 'A-12 Saket, New Delhi 110017',
    line1: 'A-12 Saket',
    city: 'Saket',
    state: 'Delhi',
    pincode: '110017',
    latlng: { lat: 28.5244, lng: 77.2167 },
  },
  {
    display: '23 Malviya Nagar, New Delhi 110017',
    line1: '23 Malviya Nagar',
    city: 'Malviya Nagar',
    state: 'Delhi',
    pincode: '110017',
    latlng: { lat: 28.5317, lng: 77.2055 },
  },
  {
    display: '7 Mehrauli, New Delhi 110030',
    line1: '7 Mehrauli',
    city: 'Mehrauli',
    state: 'Delhi',
    pincode: '110030',
    latlng: { lat: 28.5177, lng: 77.1762 },
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
