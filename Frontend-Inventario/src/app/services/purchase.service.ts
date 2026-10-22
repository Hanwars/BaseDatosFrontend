import { Injectable } from '@angular/core';
import { enviroment } from '../enviroments';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Purchase, PurchaseDetail } from '../models/purchase';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private url: string;
  private headers: any;
  private token: any;
  constructor(private _http: HttpClient) {
    this.url = enviroment.apiUrl;
    this.token = sessionStorage.getItem('token');
    this.headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.token}`);
  }

  getSuppliers(): Observable<any> {
    return this._http.get(this.url + 'suppliers', { headers: this.headers });
  }

  getSupplies(): Observable<any> {
    return this._http.get(this.url + 'supplies', { headers: this.headers });
  }

  // Compras
  createPurchase(purchase: Purchase): Observable<any> {
    let data = JSON.stringify(purchase);
    return this._http.post(this.url + 'purchases', data, { headers: this.headers });
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

  // Detalles de compra
  getPurchaseDetails(purchase_id: number): Observable<any> {
    return this._http.get(this.url + 'purchases/' + purchase_id + '/details', {
      headers: this.headers,
    });
  }

  createPurchaseDetail(detail: PurchaseDetail): Observable<any> {
    let data = JSON.stringify(detail);
    return this._http.post(this.url + 'purchase_details', data, { headers: this.headers });
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
