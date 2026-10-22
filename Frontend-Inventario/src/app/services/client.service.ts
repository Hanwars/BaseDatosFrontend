import { Injectable } from '@angular/core';
import { enviroment } from '../enviroments';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client } from '../models/client';

@Injectable({ providedIn: 'root' })
export class ClientService {
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

  createClient(client: Client): Observable<any> {
    let data = JSON.stringify(client);
    return this._http.post(this.url + 'clients', data, { headers: this.headers });
  }

  getClients(): Observable<any> {
    return this._http.get(this.url + 'clients', { headers: this.headers });
  }

  updateClient(client: Client) {
    return this._http.put(this.url + 'clients', client, { headers: this.headers });
  }

  deleteClient(client_id: number) {
    return this._http.delete(this.url + 'clients/' + client_id, { headers: this.headers });
  }
}
