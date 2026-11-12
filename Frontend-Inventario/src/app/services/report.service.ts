import { Injectable } from '@angular/core';
import { enviroment } from '../enviroments';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private url: string;
  private headers: HttpHeaders;

  constructor(private _http: HttpClient) {
    this.url = enviroment.apiUrl;
    this.headers = new HttpHeaders().set('Content-Type', 'application/json');
  }

  getSalesByClient(): Observable<any> {
    return this._http.get(this.url + 'reports/sales-by-client', { headers: this.headers });
  }

  getInventory(): Observable<any> {
    return this._http.get(this.url + 'reports/inventory', { headers: this.headers });
  }

  getDiscountMovements(): Observable<any> {
    return this._http.get(this.url + 'reports/discount-movements', { headers: this.headers });
  }

  getAudit(limit = 100, table?: string, operation?: string): Observable<any> {
    let q = `limit=${limit}`;
    if (table) q += `&table=${table}`;
    if (operation) q += `&operation=${operation}`;
    return this._http.get(this.url + 'audit?' + q, { headers: this.headers });
  }

  createBackup(): Observable<any> {
    return this._http.post(this.url + 'database/backup', {}, { headers: this.headers });
  }

  getBackups(limit = 20): Observable<any> {
    return this._http.get(this.url + 'database/backups?limit=' + limit, { headers: this.headers });
  }
}
