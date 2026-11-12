import { Injectable } from '@angular/core';
import { enviroment } from '../enviroments';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from '../models/category';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private url: string;
  private headers: HttpHeaders;

  constructor(private _http: HttpClient) {
    this.url = enviroment.apiUrl;
    this.headers = new HttpHeaders().set('Content-Type', 'application/json');
  }

  createCategory(category: Category): Observable<any> {
    return this._http.post(this.url + 'categories', category, { headers: this.headers });
  }

  getCategories(): Observable<any> {
    return this._http.get(this.url + 'categories', { headers: this.headers });
  }

  updateCategory(category: Category) {
    return this._http.put(this.url + 'categories', category, { headers: this.headers });
  }

  deleteCategory(category_id: number) {
    return this._http.delete(this.url + 'categories/' + category_id, { headers: this.headers });
  }
}
