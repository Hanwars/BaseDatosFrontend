import { Injectable } from '@angular/core';
import { enviroment } from '../enviroments';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Purchase, PurchaseDetail } from '../models/purchase';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private url: string;
  private headers: HttpHeaders;

  constructor(private _http: HttpClient) {
    this.url = enviroment.apiUrl;
    this.headers = new HttpHeaders().set('Content-Type', 'application/json');
  }

  getSuppliers(): Observable<any> {
    return this._http.get(this.url + 'suppliers', { headers: this.headers });
  }

  getSupplies(): Observable<any> {
    return this._http.get(this.url + 'supplies', { headers: this.headers });
  }

  createPurchase(purchase: Purchase): Observable<any> {
    return this._http.post(this.url + 'purchases', purchase, { headers: this.headers });
  }

  getPurchases(): Observable<any> {
    return this._http.get(this.url + 'purchases', { headers: this.headers });
  }

  updatePurchase(purchase: Purchase) {
    return this._http.put(this.url + 'purchases', purchase, { headers: this.headers });
  }

  deletePurchase(purchase_id: number) {
    return this._http.delete(this.url + 'purchases/' + purchase_id, { headers: this.headers });
  }

  getPurchaseDetails(purchase_id: number): Observable<any> {
    return this._http.get(this.url + 'purchases/' + purchase_id + '/details', {
      headers: this.headers,
    });
  }

  createPurchaseDetail(detail: PurchaseDetail): Observable<any> {
    return this._http.post(this.url + 'purchase_details', detail, { headers: this.headers });
  }

  updatePurchaseDetail(detail: PurchaseDetail) {
    return this._http.put(this.url + 'purchase_details', detail, { headers: this.headers });
  }

  deletePurchaseDetail(detail_id: number) {
    return this._http.delete(this.url + 'purchase_details/' + detail_id, {
      headers: this.headers,
    });
  }
}
