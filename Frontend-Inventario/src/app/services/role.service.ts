import { Injectable } from '@angular/core';
import { enviroment } from '../enviroments';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Role } from '../models/role';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private url: string;
  private headers: HttpHeaders;

  constructor(private _http: HttpClient) {
    this.url = enviroment.apiUrl;
    this.headers = new HttpHeaders().set('Content-Type', 'application/json');
  }

  createRole(role: Role): Observable<any> {
    return this._http.post(this.url + 'roles', role, { headers: this.headers });
  }

  getRoles(): Observable<any> {
    return this._http.get(this.url + 'roles', { headers: this.headers });
  }

  updateRole(role: Role) {
    return this._http.put(this.url + 'roles', role, { headers: this.headers });
  }

  deleteRole(role_id: number) {
    return this._http.delete(this.url + 'roles/' + role_id, { headers: this.headers });
  }
}
