import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiService } from '../api.service';
import { MockDataService } from '../mock/mock-data.service';
import { Category } from '../../models/category.model';
import { MenuItem, ItemTag } from '../../models/menu-item.model';

/** Normalise a raw API MenuItem:
 *  - price / rating come back as strings → coerce to number
 *  - category_name lives inside category.name on real API → hoist it
 */
function normaliseItem(raw: any): MenuItem {
  return {
    ...raw,
    price:        +raw.price,
    rating:       +raw.rating,
    category_name: raw.category_name ?? raw.category?.name ?? '',
  } as MenuItem;
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  private api  = inject(ApiService);
  private mock = inject(MockDataService);

  getCategories(): Observable<Category[]> {
    if (environment.useMock) return this.mock.getCategories();
    return this.api.get<Category[]>('/menu/categories');
  }

  getMenuItems(categoryId?: string): Observable<MenuItem[]> {
    if (environment.useMock) return this.mock.getMenuItems(categoryId);
    const params: Record<string, string> = {};
    if (categoryId) params['category_id'] = categoryId;
    return this.api.get<MenuItem[]>('/menu/items', params)
      .pipe(map(items => items.map(normaliseItem)));
  }

  getItemById(id: string): Observable<MenuItem | undefined> {
    if (environment.useMock) return this.mock.getItemById(id);
    return this.api.get<MenuItem>(`/menu/items/${id}`)
      .pipe(map(item => item ? normaliseItem(item) : undefined));
  }

  searchItems(query: string): Observable<MenuItem[]> {
    if (environment.useMock) return this.mock.searchItems(query);
    return this.api.get<MenuItem[]>('/menu/items/search', { q: query })
      .pipe(map(items => items.map(normaliseItem)));
  }

  getFeaturedItems(tag?: ItemTag): Observable<MenuItem[]> {
    if (environment.useMock) return tag ? this.mock.getFeaturedItems(tag) : this.mock.getMenuItems();
    const params: Record<string, string> = tag ? { tag } : {};
    return this.api.get<MenuItem[]>('/menu/items/featured', params)
      .pipe(map(items => items.map(normaliseItem)));
  }
}
