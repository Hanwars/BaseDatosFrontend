
import { Injectable } from '@angular/core';
import { enviroment } from '../enviroments';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {

  private url: string;
  private headers: HttpHeaders;

  constructor(private _http: HttpClient) {
    this.url = enviroment.apiUrl;
    this.headers = new HttpHeaders().set(
      'Content-Type',
      'application/json',
    );
  }

  // ========================= USUARIOS =========================

  getUsers(): Observable<any> {
    return this._http.get(
      this.url + 'users',
      { headers: this.headers },
    );
  }

  getUser(user_id: number): Observable<any> {
    return this._http.get(
      this.url + 'users/' + user_id,
      { headers: this.headers },
    );
  }

  createUser(user: any): Observable<any> {
    return this._http.post(
      this.url + 'users',
      user,
      { headers: this.headers },
    );
  }

  // Actualizar usuario administrativamente.
  updateUser(user: any): Observable<any> {
    return this._http.put(
      this.url + 'users',
      user,
      { headers: this.headers },
    );
  }

  deleteUser(user_id: number): Observable<any> {
    return this._http.delete(
      this.url + 'users/' + user_id,
      { headers: this.headers },
    );
  }

  // ========================= PERFIL PERSONAL =========================

  // Obtener perfil del usuario autenticado.
  getProfile(): Observable<any> {
    return this._http.get(
      this.url + 'profile',
      { headers: this.headers },
    );
  }

  // Actualizar perfil del usuario autenticado.
  // La identidad del usuario se obtiene del token en el backend.
  updateProfile(profile: {
    name: string;
    email: string;
    current_password?: string;
    new_password?: string;
  }): Observable<any> {

    return this._http.put(
      this.url + 'profile',
      profile,
      { headers: this.headers },
    );
  }
}
