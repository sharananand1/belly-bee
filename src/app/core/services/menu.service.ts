import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiService } from '../api.service';
import { MockDataService } from '../mock/mock-data.service';
import { Category } from '../../models/category.model';
import { MenuItem, ItemTag } from '../../models/menu-item.model';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private api = inject(ApiService);
  private mock = inject(MockDataService);

  getCategories(): Observable<Category[]> {
    if (environment.useMock) {
      return of(this.mock.getCategories()).pipe(delay(200));
    }
    return this.api.get<Category[]>('/menu/categories');
  }

  getMenuItems(categoryId?: string): Observable<MenuItem[]> {
    if (environment.useMock) {
      return of(this.mock.getMenuItems(categoryId)).pipe(delay(300));
    }
    const params = categoryId ? { category_id: categoryId } : undefined;
    return this.api.get<MenuItem[]>('/menu/items', params);
  }

  getItemById(id: string): Observable<MenuItem | null> {
    if (environment.useMock) {
      return of(this.mock.getItemById(id)).pipe(delay(200));
    }
    return this.api.get<MenuItem>(`/menu/items/${id}`);
  }

  searchItems(query: string): Observable<MenuItem[]> {
    if (environment.useMock) {
      return of(this.mock.searchItems(query)).pipe(delay(250));
    }
    return this.api.get<MenuItem[]>('/menu/search', { q: query });
  }

  getFeaturedItems(tag: ItemTag): Observable<MenuItem[]> {
    if (environment.useMock) {
      return of(this.mock.getFeaturedItems(tag)).pipe(delay(200));
    }
    return this.api.get<MenuItem[]>('/menu/featured', { tag });
  }
}
