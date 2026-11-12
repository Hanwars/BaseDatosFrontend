
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupplierService } from '../../services/supplier.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-suppliers',
  imports: [CommonModule, FormsModule],
  templateUrl: './suppliers.html',
  styleUrl: './suppliers.css',
})
export class Suppliers implements OnInit {
  public suppliers: any[] = [];

  public isModalOpen = false;
  public selectedSupplier: any = null;

  public isDeleteModalOpen = false;
  public supplierToDelete: any = null;

  public toast = {
    show: false,
    message: '',
    typeClass: 'bg-success',
  };

  public search: string = '';
  public currentUser;

  constructor(
    private _supplierService: SupplierService,
    private cdr: ChangeDetectorRef,
    private _auth: AuthService,
  ) {
    this.currentUser = this._auth.currentUser;
  }

  ngOnInit() {
    this.getSuppliers();
  }

  // Mostrar notificaciones
  showToast(
    message: string,
    type: 'success' | 'danger' | 'info' | 'warning' = 'success',
  ) {
    this.toast.message = message;
    this.toast.typeClass = `bg-${type}`;
    this.toast.show = true;

    setTimeout(() => {
      this.toast.show = false;
      this.cdr.detectChanges();
    }, 5000);
  }

  // Manejo general de errores
  private showError(message: string, err: any) {
    console.error(message, err);
    console.error('Status:', err?.status);
    console.error('Error del servidor:', err?.error);
    console.error('Mensaje:', err?.message);

    const detail =
      err?.error?.error ||
      err?.error?.message ||
      err?.message;

    this.showToast(
      detail ? `${message}: ${detail}` : message,
      'danger',
    );
  }

  // Convertir teléfono a número y validar máximo 8 dígitos
  private normalizePhone(value: any): number | null | undefined {
    // Los teléfonos vacíos continúan siendo opcionales
    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ''
    ) {
      return null;
    }

    const phone = String(value).trim();

    // Solo permite números y un máximo de 8 dígitos
    if (!/^[0-9]{1,8}$/.test(phone)) {
      return undefined;
    }

    return Number(phone);
  }

  // Preparar información antes de enviarla al backend
  private prepareSupplierPayload(supplier: any): any | null {
    const companyPhone = this.normalizePhone(supplier.company_phone);
    const contactPhone = this.normalizePhone(supplier.contact_phone);

    if (companyPhone === undefined || contactPhone === undefined) {
      this.showToast(
        'Los teléfonos deben contener únicamente números y un máximo de 8 dígitos.',
        'danger',
      );

      return null;
    }

    return {
      ...supplier,
      company_phone: companyPhone,
      contact_phone: contactPhone,
    };
  }

  // Obtener proveedores
  getSuppliers() {
    this._supplierService.getSuppliers().subscribe({
      next: (response: any) => {
        this.suppliers = response || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showError('Error al obtener proveedores', err);
      },
    });
  }

  // Crear proveedor
  createSupplier(supplier: any) {
    const payload = this.prepareSupplierPayload(supplier);

    if (!payload) {
      return;
    }

    this._supplierService.createSupplier(payload).subscribe({
      next: (response: any) => {
        this.getSuppliers();
        this.closeModal();
        this.showToast('Proveedor creado correctamente', 'success');
      },
      error: (err) => {
        this.showError('Error al crear proveedor', err);
      },
    });
  }

  // Actualizar proveedor
  updateSupplier(supplier: any) {
    const payload = this.prepareSupplierPayload(supplier);

    if (!payload) {
      return;
    }

    this._supplierService.updateSupplier(payload).subscribe({
      next: (response: any) => {
        this.getSuppliers();
        this.closeModal();
        this.showToast('Proveedor actualizado correctamente', 'warning');
      },
      error: (err) => {
        this.showError('Error al actualizar proveedor', err);
      },
    });
  }

  // Eliminar proveedor
  confirmDelete(supplier_id: number) {
    if (!supplier_id) {
      return;
    }

    this._supplierService.deleteSupplier(supplier_id).subscribe({
      next: (response: any) => {
        this.getSuppliers();
        this.closeDeleteModal();
        this.showToast('Proveedor eliminado correctamente', 'success');
      },
      error: (err) => {
        this.showError('Error al eliminar proveedor', err);
      },
    });
  }

  // Abrir modal de creación o edición
  openModal(supplier: any) {
    this.selectedSupplier = supplier
      ? {
          ...supplier,
          contact_name: supplier.contact_name || null,
          contact_phone: supplier.contact_phone ?? null,
          contact_email: supplier.contact_email || null,
        }
      : {
          supplier_id: null,
          company_name: '',
          company_phone: null,
          company_email: null,
          contact_name: '',
          contact_phone: null,
          contact_email: null,
        };

    this.isModalOpen = true;
  }

  // Cerrar modal de creación o edición
  closeModal() {
    this.isModalOpen = false;
    this.selectedSupplier = null;
  }

  // Abrir modal de eliminación
  openDeleteModal(supplier: any) {
    this.supplierToDelete = supplier;
    this.isDeleteModalOpen = true;
  }

  // Cerrar modal de eliminación
  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.supplierToDelete = null;
  }
}
