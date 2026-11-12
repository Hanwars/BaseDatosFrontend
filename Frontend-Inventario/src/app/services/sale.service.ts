import { Injectable } from '@angular/core';
import { enviroment } from '../enviroments';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sale, SaleDetail } from '../models/sale';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private url: string;
  private headers: HttpHeaders;

  constructor(private _http: HttpClient) {
    this.url = enviroment.apiUrl;
    this.headers = new HttpHeaders().set('Content-Type', 'application/json');
  }

  getClients(): Observable<any> {
    return this._http.get(this.url + 'clients', { headers: this.headers });
  }

  getSupplies(): Observable<any> {
    return this._http.get(this.url + 'supplies', { headers: this.headers });
  }

  createSale(sale: any): Observable<any> {
    return this._http.post(this.url + 'sales', sale, { headers: this.headers });
  }

  getSales(): Observable<any> {
    return this._http.get(this.url + 'sales', { headers: this.headers });
  }

  updateSale(sale: any) {
    return this._http.put(this.url + 'sales', sale, { headers: this.headers });
  }

  deleteSale(sale_id: number) {
    return this._http.delete(this.url + 'sales/' + sale_id, { headers: this.headers });
  }

  getSaleDetails(sale_id: number): Observable<any> {
    return this._http.get(this.url + 'sales/' + sale_id + '/details', {
      headers: this.headers,
    });
  }

  createSaleDetail(detail: any): Observable<any> {
    return this._http.post(this.url + 'sale_details', detail, { headers: this.headers });
  }

  updateSaleDetail(detail: any) {
    return this._http.put(this.url + 'sale_details', detail, { headers: this.headers });
  }

  deleteSaleDetail(detail_id: number) {
    return this._http.delete(this.url + 'sale_details/' + detail_id, {
      headers: this.headers,
    });
  }
}
