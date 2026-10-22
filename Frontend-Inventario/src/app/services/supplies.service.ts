import { Injectable } from '@angular/core';
import { enviroment } from '../enviroments';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Supplies } from '../models/supplies';

@Injectable({ providedIn: 'root' })
export class SupplyService {
  private url: string;

  constructor(private _http: HttpClient) {
    this.url = enviroment.apiUrl;
  }

  // Obtener la cabecera actualizada para peticiones JSON.
  private getHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token');

    console.log('¿Existe el token?', !!token);
    console.log('Longitud del token:', token?.length ?? 0);

    return new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${token ?? ''}`);
  }

  // Obtener la cabecera actualizada para imágenes y archivos.
  // No se establece Content-Type para permitir que el navegador
  // configure correctamente el formato multipart de FormData.
  private getImageHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token');

    return new HttpHeaders().set(
      'Authorization',
      `Bearer ${token ?? ''}`,
    );
  }

  // Obtener categorías.
  getCategories(): Observable<any> {
    return this._http.get(this.url + 'categories', {
      headers: this.getHeaders(),
    });
  }

  // Crear suministro.
  createSupply(supply: Supplies): Observable<any> {
    return this._http.post(this.url + 'supplies', supply, {
      headers: this.getHeaders(),
    });
  }

  // Obtener todos los suministros.
  getSupplies(): Observable<any> {
    return this._http.get(this.url + 'supplies', {
      headers: this.getHeaders(),
    });
  }

  // Actualizar suministro.
  updateSupply(supply: Supplies): Observable<any> {
    return this._http.put(this.url + 'supplies', supply, {
      headers: this.getHeaders(),
    });
  }

  // Eliminar suministro.
  deleteSupply(supply_id: number): Observable<any> {
    return this._http.delete(this.url + 'supplies/' + supply_id, {
      headers: this.getHeaders(),
    });
  }

  // Subir imagen.
  uploadImage(file: File): Observable<any> {
    const formData = new FormData();

    formData.append('file0', file, file.name);

    return this._http.post(
      this.url + 'supplies/upload_image',
      formData,
      {
        headers: this.getImageHeaders(),
      },
    );
  }

  // Descargar imagen.
  downloadImage(filename: string): Observable<any> {
    return this._http.get(
      this.url + 'supplies/download_image/' + filename,
      {
        headers: this.getImageHeaders(),
        responseType: 'blob',
      },
    );
  }

  // Eliminar imagen.
  deleteImage(filename: string): Observable<any> {
    return this._http.delete(
      this.url + 'supplies/delete_image/' + filename,
      {
        headers: this.getImageHeaders(),
        responseType: 'blob',
      },
    );
  }
}