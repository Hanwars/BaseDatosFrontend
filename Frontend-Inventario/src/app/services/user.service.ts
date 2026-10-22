import { Injectable } from '@angular/core';
import { enviroment } from '../enviroments';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user';

@Injectable({ providedIn: 'root' })
export class UserService {
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

  getRoles(): Observable<any> {
    return this._http.get(this.url + 'roles', { headers: this.headers });
  }

  createUser(user: User): Observable<any> {
    let data = JSON.stringify(user);
    return this._http.post(this.url + 'register', data, { headers: this.headers });
  }

  getProfile(): Observable<any> {
    return this._http.get(this.url + 'profile', { headers: this.headers });
  }

  // Perfil: { name, email, current_password?, new_password? }
  updateUser(user: any): Observable<any> {
    return this._http.put(this.url + 'profile', user, { headers: this.headers });
  }

  getAllUsers(): Observable<any> {
    return this._http.get(this.url + 'users', { headers: this.headers });
  }

  getUserbyID(id: number): Observable<any> {
    return this._http.get(this.url + 'users/' + id, { headers: this.headers });
  }

  updateRole(user_id: number, role_id: number) {
    return this._http.put(this.url + 'users/' + user_id + '/role/' + role_id, null, {
      headers: this.headers,
    });
  }

}
