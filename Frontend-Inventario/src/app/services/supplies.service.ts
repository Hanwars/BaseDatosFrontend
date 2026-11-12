
import { Injectable } from '@angular/core';
import { enviroment } from '../enviroments';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Supplies } from '../models/supplies';

@Injectable({ providedIn: 'root' })
export class SuppliesService {
  private url: string;
  private headers: HttpHeaders;

  constructor(private _http: HttpClient) {
    this.url = enviroment.apiUrl;
    this.headers = new HttpHeaders().set('Content-Type', 'application/json');
  }

  // Crear insumo
  createSupply(supply: Supplies): Observable<any> {
    return this._http.post(
      this.url + 'supplies',
      supply,
      { headers: this.headers }
    );
  }

  // Obtener todos los insumos
  getSupplies(): Observable<any> {
    return this._http.get(
      this.url + 'supplies',
      { headers: this.headers }
    );
  }

  // Actualizar insumo
  updateSupply(supply: Supplies): Observable<any> {
    return this._http.put(
      this.url + 'supplies',
      supply,
      { headers: this.headers }
    );
  }

  // Eliminar insumo
  deleteSupply(supply_id: number): Observable<any> {
    return this._http.delete(
      this.url + 'supplies/' + supply_id,
      { headers: this.headers }
    );
  }

  // Subir imagen
  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file0', file, file.name);

    return this._http.post(
      this.url + 'supplies/upload_image',
      formData
    );
  }

  // Descargar imagen
  downloadImage(filename: string): Observable<Blob> {
    return this._http.get(
      this.url + 'supplies/download_image/' + encodeURIComponent(filename),
      { responseType: 'blob' }
    );
  }

  // Eliminar imagen
  deleteImage(filename: string): Observable<any> {
    return this._http.delete(
      this.url + 'supplies/delete_image/' + encodeURIComponent(filename)
    );
  }
}
