import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiService } from '../api.service';
import { MockDataService } from '../mock/mock-data.service';
import { Address } from '../../models/address.model';

@Injectable({ providedIn: 'root' })
export class AddressService {
  private api = inject(ApiService);
  private mock = inject(MockDataService);

  getSavedAddresses(): Observable<Address[]> {
    if (environment.useMock) {
      return of(this.mock.getMockUser().addresses ?? []).pipe(delay(300));
    }
    return this.api.get<Address[]>('/addresses');
  }

  saveAddress(address: Omit<Address, 'id'>): Observable<Address> {
    if (environment.useMock) {
      const saved: Address = { ...address, id: 'addr_' + Date.now() };
      return of(saved).pipe(delay(400));
    }
    return this.api.post<Address>('/addresses', address);
  }

  updateAddress(id: string, address: Partial<Address>): Observable<Address> {
    if (environment.useMock) {
      const updated: Address = { id, label: 'home', line1: '', city: '', state: '', pincode: '', ...address };
      return of(updated).pipe(delay(400));
    }
    return this.api.put<Address>(`/addresses/${id}`, address);
  }

  deleteAddress(id: string): Observable<void> {
    if (environment.useMock) {
      return of(undefined).pipe(delay(300));
    }
    return this.api.delete<void>(`/addresses/${id}`);
  }
}
