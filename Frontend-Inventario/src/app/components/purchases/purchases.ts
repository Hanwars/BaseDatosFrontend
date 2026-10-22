import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PurchaseService } from '../../services/purchase.service';
import { ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-purchases',
  imports: [CommonModule, FormsModule],
  templateUrl: './purchases.html',
  styleUrl: './purchases.css',
})
export class Purchases {
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

  public search: string = '';
  public currentUser;

  showToast(message: string, type: 'success' | 'danger' | 'info' | 'warning' = 'success') {
    this.toast.message = message;
    this.toast.typeClass = `bg-${type}`;
    this.toast.show = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.toast.show = false;
      this.cdr.detectChanges();
    }, 5000);
  }

  // Muestra el mensaje del backend (por ejemplo, el RAISERROR del procedimiento).
  showError(message: string, err: any) {
    console.error(message, err);
    this.showToast(`${message}: ${err?.error?.error || err?.error?.message || err?.message}`, 'danger');
  }

  ngOnInit() {
    this.getSuppliers();
    this.getSupplies();
    this.getPurchases();
  }

  getSuppliers() {
    this._purchaseService.getSuppliers().subscribe({
      next: (response: any) => {
        this.suppliers = response || [];
      },
    });
  }

  getSupplies() {
    this._purchaseService.getSupplies().subscribe({
      next: (response: any) => {
        this.supplies = response || [];
      },
    });
  }

  // openDetailsId: abre los detalles de esa compra al terminar de cargar (recién creada).
  getPurchases(openDetailsId: number | null = null) {
    this._purchaseService.getPurchases().subscribe({
      next: (response: any) => {
        this.purchases = response || [];

        // Refresca los totales de la compra que se está viendo.
        if (this.purchaseDetails) {
          this.purchaseDetails =
            this.purchases.find((p) => p.purchase_id === this.purchaseDetails.purchase_id) ||
            this.purchaseDetails;
        }
        if (openDetailsId) {
          const created = this.purchases.find((p) => p.purchase_id === openDetailsId);
          if (created) this.openDetailsModal(created);
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showError('Error al obtener compras', err);
      },
    });
  }

  // ========================= COMPRAS =========================

  savePurchase() {
    const payload = {
      purchase_id: this.selectedPurchase.purchase_id,
      supplier_id: this.selectedPurchase.supplier_id,
      // La fecha se maneja en UTC para que no cambie de día por la zona horaria.
      date: this.selectedPurchase.date ? this.selectedPurchase.date + 'T00:00:00Z' : null,
      iva: Number(this.selectedPurchase.iva),
    };

    if (payload.purchase_id) {
      this.updatePurchase(payload);
    } else {
      this.createPurchase(payload);
    }
  }

  createPurchase(purchase: any) {
    this._purchaseService.createPurchase(purchase).subscribe({
      next: (response: any) => {
        this.closeModal();
        this.getPurchases(response.generated_id);
        this.showToast('Compra creada correctamente, agregue los insumos', 'success');
      },
      error: (err) => {
        this.showError('Error al crear compra', err);
      },
    });
  }

  updatePurchase(purchase: any) {
    this._purchaseService.updatePurchase(purchase).subscribe({
      next: (response: any) => {
        this.getPurchases();
        this.closeModal();
        this.showToast('Compra actualizada correctamente', 'warning');
      },
      error: (err) => {
        this.showError('Error al actualizar compra', err);
      },
    });
  }

  confirmDelete(purchase_id: number) {
    this._purchaseService.deletePurchase(purchase_id).subscribe({
      next: (response: any) => {
        this.getPurchases();
        this.getSupplies();
        this.showToast('Compra eliminada correctamente', 'danger');
      },
      error: (err) => {
        this.showError('Error al eliminar compra', err);
      },
    });

    this.closeDeleteModal();
  }

  openModal(purchase: any) {
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
          date: new Date().toLocaleDateString('en-CA'), // yyyy-MM-dd de hoy
          iva: 13,
        };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedPurchase = null;
  }

  openDeleteModal(purchase: any) {
    this.purchaseToDelete = purchase;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.purchaseToDelete = null;
  }

  // ===================== DETALLES DE COMPRA =====================

  openDetailsModal(purchase: any) {
    this.purchaseDetails = purchase;
    this.details = [];
    this.resetDetailForm();
    this.isDetailsModalOpen = true;
    this.getPurchaseDetails();
  }

  closeDetailsModal() {
    this.isDetailsModalOpen = false;
    this.purchaseDetails = null;
    this.details = [];
    this.selectedDetail = null;
  }

  getPurchaseDetails() {
    this._purchaseService.getPurchaseDetails(this.purchaseDetails.purchase_id).subscribe({
      next: (response: any) => {
        this.details = response || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showError('Error al obtener detalles', err);
      },
    });
  }

  resetDetailForm() {
    this.selectedDetail = {
      detail_id: null,
      purchase_id: this.purchaseDetails?.purchase_id,
      supply_id: null,
      quantity: null,
      unit_price: null,
      discount: 0,
    };
  }

  // Precarga el precio del insumo seleccionado (se puede editar).
  onSupplyChange() {
    const supply = this.supplies.find((s) => s.supply_id === this.selectedDetail.supply_id);
    if (supply) {
      this.selectedDetail.unit_price = supply.price;
    }
  }

  editDetail(detail: any) {
    this.selectedDetail = { ...detail };
  }

  saveDetail() {
    const payload = {
      ...this.selectedDetail,
      quantity: Number(this.selectedDetail.quantity),
      unit_price: Number(this.selectedDetail.unit_price),
      discount: Number(this.selectedDetail.discount || 0),
    };

    const request = payload.detail_id
      ? this._purchaseService.updatePurchaseDetail(payload)
      : this._purchaseService.createPurchaseDetail(payload);

    request.subscribe({
      next: (response: any) => {
        this.afterDetailChange(
          payload.detail_id ? 'Insumo actualizado en la compra' : 'Insumo agregado a la compra',
          payload.detail_id ? 'warning' : 'success',
        );
      },
      error: (err) => {
        this.showError('Error al guardar el detalle', err);
      },
    });
  }

  openDeleteDetailModal(detail: any) {
    this.detailToDelete = detail;
    this.isDeleteDetailModalOpen = true;
  }

  closeDeleteDetailModal() {
    this.isDeleteDetailModalOpen = false;
    this.detailToDelete = null;
  }

  confirmDeleteDetail(detail_id: number) {
    this._purchaseService.deletePurchaseDetail(detail_id).subscribe({
      next: (response: any) => {
        this.afterDetailChange('Insumo eliminado de la compra', 'danger');
      },
      error: (err) => {
        this.showError('Error al eliminar el detalle', err);
      },
    });

    this.closeDeleteDetailModal();
  }

  // El trigger cambia los totales de la compra y el stock: se recargan.
  afterDetailChange(message: string, type: 'success' | 'danger' | 'warning') {
    this.resetDetailForm();
    this.getPurchaseDetails();
    this.getPurchases();
    this.getSupplies();
    this.showToast(message, type);
  }
}
