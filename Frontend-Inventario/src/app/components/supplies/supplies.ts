
import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { SuppliesService } from '../../services/supplies.service';
import { AuthService } from '../../services/auth.service';
import { enviroment } from '../../enviroments';

@Component({
  selector: 'app-supplies',
  imports: [CommonModule, FormsModule],
  templateUrl: './supplies.html',
  styleUrl: './supplies.css',
})
export class Supplies implements OnInit {

  public supplies: any[] = [];
  public categories: any[] = [];
  public apiURL: any;
  public imageUrls: { [filename: string]: string } = {};

  public isModalOpen = false;
  public selectedSupply: any = null;
  public selectedFile: File | null = null;
  public imageTouched = false;

  public isDeleteModalOpen = false;
  public supplyToDelete: any = null;

  public isDetailsModalOpen = false;
  public supplyDetails: any = null;

  public search: string = '';
  public currentUser: any;

  public toast = {
    show: false,
    message: '',
    typeClass: 'bg-success',
  };

  constructor(
    private _supplyService: SuppliesService,
    private cdr: ChangeDetectorRef,
    private _auth: AuthService
  ) {
    this.apiURL = enviroment.apiUrl;
    this.currentUser = this._auth.currentUser;
  }

  ngOnInit(): void {
    this.getSupplies();
  }

  // Mostrar notificaciones
  showToast(
    message: string,
    type: 'success' | 'danger' | 'info' | 'warning' = 'success'
  ): void {
    this.toast.message = message;
    this.toast.typeClass = `bg-${type}`;
    this.toast.show = true;

    setTimeout(() => {
      this.toast.show = false;
      this.cdr.detectChanges();
    }, 5000);
  }

  // Obtener categorías desde los insumos
  getCategories(): void {
    const categories = this.supplies
      .map((supply) => supply.category)
      .filter((category) => category?.category_id != null);

    this.categories = Array.from(
      new Map(
        categories.map((category) => [
          category.category_id,
          category
        ])
      ).values()
    );
  }

  // Obtener insumos
  getSupplies(): void {
    this._supplyService.getSupplies().subscribe({
      next: (response: any) => {
        this.supplies = response;

        this.getCategories();

        this.supplies.forEach((supply) => {
          if (supply.image) {
            this.downloadImage(supply.image);
          }
        });

        this.cdr.detectChanges();
      },
      error: (_err: HttpErrorResponse) => {
        this.showToast('Error al obtener los insumos', 'danger');
      },
    });
  }

  // Guardar insumo (crear o actualizar)
  saveSupply(): void {
    const isEdit = !!this.selectedSupply?.supply_id;

    if (!isEdit && !this.selectedFile) {
      this.showToast('Debes seleccionar una imagen', 'danger');
      return;
    }

    if (isEdit && this.selectedFile == null) {
      const payload = {
        ...this.selectedSupply,
      };

      this.updateSupply(payload);
      return;
    }

    if (this.selectedFile) {
      this._supplyService.uploadImage(this.selectedFile).subscribe({
        next: (res: any) => {
          const filename = res.filename;

          const payload = {
            ...this.selectedSupply,
            image: filename,
          };

          if (this.selectedSupply.supply_id) {
            const oldImage = this.selectedSupply.image;

            this.updateSupply(payload);

            if (oldImage) {
              this.deleteImage(oldImage);
            }
          } else {
            this.createSupply(payload);
          }
        },
        error: (_err: HttpErrorResponse) => {
          this.showToast('Error al subir imagen', 'danger');
        },
      });
    }
  }

  // Crear insumo
  createSupply(supply: any): void {
    this._supplyService.createSupply(supply).subscribe({
      next: (_response: any) => {
        this.getSupplies();
        this.closeModal();
        this.showToast('Insumo creado correctamente', 'success');
      },
      error: (err: HttpErrorResponse) => {
        console.log('ERROR COMPLETO:', err);
        console.log('STATUS:', err.status);
        console.log('ERROR DEL BACKEND:', err.error);

        this.showToast(
          err.error?.error || 'Error al crear insumo',
          'danger'
        );
      },
    });
  }

  // Actualizar insumo
  updateSupply(supply: any): void {
    this._supplyService.updateSupply(supply).subscribe({
      next: (_response: any) => {
        this.getSupplies();
        this.closeModal();
        this.showToast('Insumo actualizado correctamente', 'warning');
      },
      error: (_err: HttpErrorResponse) => {
        this.showToast('Error al actualizar insumo', 'danger');
      },
    });
  }

  // Descargar imagen
  downloadImage(filename: string): void {
    if (!filename) {
      return;
    }

    this._supplyService.downloadImage(filename).subscribe({
      next: (blob: Blob) => {
        this.imageUrls[filename] = URL.createObjectURL(blob);
        this.cdr.detectChanges();
      },
      error: (_err: HttpErrorResponse) => {
        console.error('Error al descargar imagen:', filename);
      },
    });
  }

  // Eliminar imagen
  deleteImage(filename: string): void {
    if (!filename) {
      return;
    }

    this._supplyService.deleteImage(filename).subscribe({
      next: (_response: any) => {
        if (this.imageUrls[filename]) {
          URL.revokeObjectURL(this.imageUrls[filename]);
          delete this.imageUrls[filename];
        }
      },
      error: (_err: HttpErrorResponse) => {
        console.error('Error al eliminar imagen:', filename);
      },
    });
  }

  // Confirmar eliminación de insumo
  confirmDelete(supply_id: number, filename: string): void {
    this._supplyService.deleteSupply(supply_id).subscribe({
      next: (_response: any) => {
        if (filename) {
          this.deleteImage(filename);
        }

        this.getSupplies();
        this.closeModal();
        this.showToast('Insumo eliminado correctamente', 'danger');
        this.closeDeleteModal();
      },
      error: (_err: HttpErrorResponse) => {
        this.showToast('Error al eliminar insumo', 'danger');
      },
    });
  }

  // Abrir modal de insumo
  openModal(supply: any): void {
    this.selectedSupply = supply
      ? {
          ...supply,
          category_id: supply.category?.category_id,
        }
      : {
          supply_id: null,
          name: '',
          type: null,
          stock: '',
          image: '',
          price: null,
          category_id: null,
        };

    this.isModalOpen = true;
  }

  // Cerrar modal
  closeModal(): void {
    this.isModalOpen = false;
    this.selectedSupply = null;
    this.imageTouched = false;
    this.selectedFile = null;
  }

  // Abrir modal de eliminación
  openDeleteModal(supply: any): void {
    this.supplyToDelete = supply;
    this.isDeleteModalOpen = true;
  }

  // Cerrar modal de eliminación
  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.supplyToDelete = null;
  }

  // Abrir detalles
  openDetailsModal(supply: any): void {
    this.supplyDetails = supply;
    this.isDetailsModalOpen = true;
  }

  // Cerrar detalles
  closeDetailsModal(): void {
    this.isDetailsModalOpen = false;
    this.supplyDetails = null;
  }

  // Seleccionar archivo
  onFileSelected(event: Event): void {
    this.imageTouched = true;

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.selectedFile = file;
      this.imageTouched = false;
    }
  }
}
