
import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { PurchaseService } from '../../services/purchase.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-purchases',
  imports: [CommonModule, FormsModule],
  templateUrl: './purchases.html',
  styleUrl: './purchases.css',
})
export class Purchases implements OnInit {
  public purchases: any[] = [];
  public suppliers: any[] = [];
  public supplies: any[] = [];

  // Encabezado (crear / editar compra)
  public isModalOpen = false;
  public selectedPurchase: any = null;

  public isDeleteModalOpen = false;
  public purchaseToDelete: any = null;

  // Detalles de la compra
  public isDetailsModalOpen = false;
  public purchaseDetails: any = null;
  public details: any[] = [];
  public selectedDetail: any = null;

  public isDeleteDetailModalOpen = false;
  public detailToDelete: any = null;

  public search: string = '';
  public currentUser: any;

  public toast = {
    show: false,
    message: '',
    typeClass: 'bg-success',
  };

  constructor(
    private _purchaseService: PurchaseService,
    private cdr: ChangeDetectorRef,
    private _auth: AuthService,
  ) {
    this.currentUser = this._auth.currentUser;
  }

  // ========================= NOTIFICACIONES =========================

  showToast(
    message: string,
    type: 'success' | 'danger' | 'info' | 'warning' = 'success',
  ): void {
    this.toast.message = message;
    this.toast.typeClass = `bg-${type}`;
    this.toast.show = true;

    this.cdr.detectChanges();

    setTimeout(() => {
      this.toast.show = false;
      this.cdr.detectChanges();
    }, 5000);
  }

  // Mostrar el mensaje devuelto por el backend.
  showError(message: string, err: HttpErrorResponse): void {
    console.error(message, err);

    const backendError =
      typeof err?.error === 'string'
        ? err.error
        : err?.error?.error ||
          err?.error?.message ||
          err?.message ||
          'Error desconocido';

    this.showToast(`${message}: ${backendError}`, 'danger');
  }

  // ========================= INICIALIZACIÓN =========================

  ngOnInit(): void {
    this.getSuppliers();
    this.getSupplies();
    this.getPurchases();
  }

  getSuppliers(): void {
    this._purchaseService.getSuppliers().subscribe({
      next: (response: any) => {
        this.suppliers = response || [];
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.showError('Error al obtener proveedores', err);
      },
    });
  }

  getSupplies(): void {
    this._purchaseService.getSupplies().subscribe({
      next: (response: any) => {
        this.supplies = response || [];
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.showError('Error al obtener insumos', err);
      },
    });
  }

  // Permite abrir los detalles de una compra recién creada.
  getPurchases(openDetailsId: number | null = null): void {
    this._purchaseService.getPurchases().subscribe({
      next: (response: any) => {
        this.purchases = response || [];

        // Actualizar los totales de la compra que se está visualizando.
        if (this.purchaseDetails) {
          this.purchaseDetails =
            this.purchases.find(
              (p) => Number(p.purchase_id) === Number(this.purchaseDetails.purchase_id),
            ) || this.purchaseDetails;
        }

        // Abrir automáticamente los detalles de una compra recién creada.
        if (openDetailsId) {
          const created = this.purchases.find(
            (p) => Number(p.purchase_id) === Number(openDetailsId),
          );

          if (created) {
            this.openDetailsModal(created);
          }
        }

        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.showError('Error al obtener compras', err);
      },
    });
  }

  // ========================= COMPRAS =========================

  savePurchase(): void {
    const payload = {
      purchase_id: this.selectedPurchase.purchase_id,
      supplier_id: this.selectedPurchase.supplier_id,

      // La fecha se maneja en UTC para evitar cambios de día por zona horaria.
      date: this.selectedPurchase.date
        ? this.selectedPurchase.date + 'T00:00:00Z'
        : null,

      iva: Number(this.selectedPurchase.iva),
    };

    if (payload.purchase_id) {
      this.updatePurchase(payload);
    } else {
      this.createPurchase(payload);
    }
  }

  createPurchase(purchase: any): void {
    this._purchaseService.createPurchase(purchase).subscribe({
      next: (response: any) => {
        this.closeModal();

        this.getPurchases(
          response?.generated_id ?? response?.purchase_id ?? null,
        );

        this.showToast(
          'Compra creada correctamente, agregue los insumos',
          'success',
        );
      },
      error: (err: HttpErrorResponse) => {
        this.showError('Error al crear compra', err);
      },
    });
  }

  updatePurchase(purchase: any): void {
    this._purchaseService.updatePurchase(purchase).subscribe({
      next: () => {
        this.getPurchases();
        this.closeModal();

        this.showToast('Compra actualizada correctamente', 'warning');
      },
      error: (err: HttpErrorResponse) => {
        this.showError('Error al actualizar compra', err);
      },
    });
  }

  confirmDelete(purchase_id: number): void {
    this._purchaseService.deletePurchase(purchase_id).subscribe({
      next: () => {
        this.closeDeleteModal();

        this.getPurchases();
        this.getSupplies();

        this.showToast('Compra eliminada correctamente', 'danger');
      },
      error: (err: HttpErrorResponse) => {
        this.showError('Error al eliminar compra', err);
      },
    });
  }

  openModal(purchase: any): void {
    this.selectedPurchase = purchase
      ? {
          purchase_id: purchase.purchase_id,
          supplier_id: purchase.supplier_id,
          date: purchase.date?.substring(0, 10),
          iva: purchase.iva,
        }
      : {
          purchase_id: null,
          supplier_id: null,
          date: new Date().toLocaleDateString('en-CA'),
          iva: 13,
        };

    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedPurchase = null;
  }

  openDeleteModal(purchase: any): void {
    this.purchaseToDelete = purchase;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.purchaseToDelete = null;
  }

  // ===================== DETALLES DE COMPRA =====================

  openDetailsModal(purchase: any): void {
    this.purchaseDetails = purchase;
    this.details = [];

    // El formulario comienza oculto.
    this.selectedDetail = null;

    this.isDetailsModalOpen = true;

    this.getPurchaseDetails();
  }

  closeDetailsModal(): void {
    this.isDetailsModalOpen = false;
    this.purchaseDetails = null;
    this.details = [];
    this.selectedDetail = null;
  }

  getPurchaseDetails(): void {
    if (!this.purchaseDetails?.purchase_id) {
      return;
    }

    this._purchaseService
      .getPurchaseDetails(this.purchaseDetails.purchase_id)
      .subscribe({
        next: (response: any) => {
          this.details = response || [];
          this.cdr.detectChanges();
        },
        error: (err: HttpErrorResponse) => {
          this.showError('Error al obtener detalles', err);
        },
      });
  }

  // Abrir formulario para agregar un nuevo insumo.
  resetDetailForm(): void {
    this.selectedDetail = {
      detail_id: null,
      purchase_id: this.purchaseDetails?.purchase_id,
      supply_id: null,
      quantity: null,
      unit_price: null,
      discount: 0,
    };
  }

  // Precargar el precio del insumo seleccionado.
  onSupplyChange(): void {
    if (!this.selectedDetail?.supply_id) {
      return;
    }

    const supply = this.supplies.find(
      (s) => Number(s.supply_id) === Number(this.selectedDetail.supply_id),
    );

    if (supply) {
      this.selectedDetail.unit_price = supply.price;
    }
  }

  // Editar un detalle existente.
  editDetail(detail: any): void {
    this.selectedDetail = {
      ...detail,
    };
  }

  // Guardar un detalle nuevo o actualizar uno existente.
  saveDetail(): void {
    if (!this.selectedDetail || !this.purchaseDetails) {
      return;
    }

    const payload = {
      ...this.selectedDetail,
      purchase_id: this.purchaseDetails.purchase_id,
      quantity: Number(this.selectedDetail.quantity),
      unit_price: Number(this.selectedDetail.unit_price),
      discount: Number(this.selectedDetail.discount || 0),
    };

    if (!payload.supply_id) {
      this.showToast('Debes seleccionar un insumo', 'danger');
      return;
    }

    if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) {
      this.showToast('La cantidad debe ser mayor que cero', 'danger');
      return;
    }

    if (!Number.isFinite(payload.unit_price) || payload.unit_price < 0) {
      this.showToast('El precio unitario no es válido', 'danger');
      return;
    }

    if (
      !Number.isFinite(payload.discount) ||
      payload.discount < 0 ||
      payload.discount > 100
    ) {
      this.showToast('El descuento debe estar entre 0 y 100', 'danger');
      return;
    }

    const isEdit = !!payload.detail_id;

    const request = isEdit
      ? this._purchaseService.updatePurchaseDetail(payload)
      : this._purchaseService.createPurchaseDetail(payload);

    request.subscribe({
      next: () => {
        this.afterDetailChange(
          isEdit
            ? 'Insumo actualizado en la compra'
            : 'Insumo agregado a la compra',
          isEdit ? 'warning' : 'success',
        );
      },
      error: (err: HttpErrorResponse) => {
        this.showError('Error al guardar el detalle', err);
      },
    });
  }

  // ===================== ELIMINAR DETALLES =====================

  openDeleteDetailModal(detail: any): void {
    this.detailToDelete = detail;
    this.isDeleteDetailModalOpen = true;
  }

  closeDeleteDetailModal(): void {
    this.isDeleteDetailModalOpen = false;
    this.detailToDelete = null;
  }

  confirmDeleteDetail(detail_id: number): void {
    this._purchaseService.deletePurchaseDetail(detail_id).subscribe({
      next: () => {
        this.closeDeleteDetailModal();

        this.afterDetailChange(
          'Insumo eliminado de la compra',
          'danger',
        );
      },
      error: (err: HttpErrorResponse) => {
        this.showError('Error al eliminar el detalle', err);
      },
    });
  }

  // ===================== ACTUALIZAR INFORMACIÓN =====================

  // Los triggers actualizan los totales y las existencias.
  // Se vuelven a consultar los datos después de cada cambio.
  afterDetailChange(
    message: string,
    type: 'success' | 'danger' | 'warning',
  ): void {
    // Ocultar el formulario después de guardar o eliminar.
    this.selectedDetail = null;

    this.getPurchaseDetails();
    this.getPurchases();
    this.getSupplies();

    this.showToast(message, type);
  }
}
