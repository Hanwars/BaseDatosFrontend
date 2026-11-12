
import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { SaleService } from '../../services/sale.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sales',
  imports: [CommonModule, FormsModule],
  templateUrl: './sales.html',
  styleUrl: './sales.css',
})
export class Sales implements OnInit {
  public sales: any[] = [];
  public clients: any[] = [];
  public supplies: any[] = [];

  // Encabezado (crear / editar venta)
  public isModalOpen = false;
  public selectedSale: any = null;

  public isDeleteModalOpen = false;
  public saleToDelete: any = null;

  // Detalles de la venta
  public isDetailsModalOpen = false;
  public saleDetails: any = null;
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
    private _saleService: SaleService,
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

  // Muestra el mensaje devuelto por el backend.
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
    this.getClients();
    this.getSupplies();
    this.getSales();
  }

  getClients(): void {
    this._saleService.getClients().subscribe({
      next: (response: any) => {
        this.clients = response || [];
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.showError('Error al obtener clientes', err);
      },
    });
  }

  getSupplies(): void {
    this._saleService.getSupplies().subscribe({
      next: (response: any) => {
        this.supplies = response || [];
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.showError('Error al obtener insumos', err);
      },
    });
  }

  // openDetailsId: permite abrir los detalles de una venta recién creada.
  getSales(openDetailsId: number | null = null): void {
    this._saleService.getSales().subscribe({
      next: (response: any) => {
        this.sales = response || [];

        // Actualizar los totales de la venta que se está visualizando.
        if (this.saleDetails) {
          this.saleDetails =
            this.sales.find(
              (sale) => sale.sale_id === this.saleDetails.sale_id,
            ) || this.saleDetails;
        }

        // Abrir automáticamente los detalles de una venta recién creada.
        if (openDetailsId) {
          const created = this.sales.find(
            (sale) => Number(sale.sale_id) === Number(openDetailsId),
          );

          if (created) {
            this.openDetailsModal(created);
          }
        }

        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.showError('Error al obtener ventas', err);
      },
    });
  }

  // ========================= VENTAS =========================

  openModal(sale: any): void {
    this.selectedSale = sale
      ? {
          sale_id: sale.sale_id,
          client_id: sale.client_id,
          date: sale.date?.substring(0, 10),
          iva: sale.iva,
        }
      : {
          sale_id: null,
          client_id: null,
          date: new Date().toLocaleDateString('en-CA'),
          iva: 13,
        };

    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedSale = null;
  }

  saveSale(): void {
    const payload = {
      sale_id: this.selectedSale.sale_id,
      client_id: Number(this.selectedSale.client_id),
      // La fecha se maneja en UTC para evitar cambios de día por zona horaria.
      date: this.selectedSale.date
        ? this.selectedSale.date + 'T00:00:00Z'
        : null,
      iva: Number(this.selectedSale.iva),
    };

    if (!payload.client_id) {
      this.showToast('Debes seleccionar un cliente', 'danger');
      return;
    }

    if (!payload.date || !Number.isFinite(payload.iva) || payload.iva < 0) {
      this.showToast('Verifica la fecha y el IVA de la venta', 'danger');
      return;
    }

    if (payload.sale_id) {
      this.updateSale(payload);
    } else {
      this.createSale(payload);
    }
  }

  createSale(sale: any): void {
    this._saleService.createSale(sale).subscribe({
      next: (response: any) => {
        const generatedId =
          response?.generated_id ??
          response?.sale_id ??
          response?.id ??
          null;

        this.closeModal();

        this.getSales(generatedId ? Number(generatedId) : null);

        this.showToast(
          'Venta creada correctamente, agregue los insumos',
          'success',
        );
      },
      error: (err: HttpErrorResponse) => {
        this.showError('Error al crear venta', err);
      },
    });
  }

  updateSale(sale: any): void {
    this._saleService.updateSale(sale).subscribe({
      next: () => {
        this.getSales();
        this.closeModal();

        this.showToast('Venta actualizada correctamente', 'warning');
      },
      error: (err: HttpErrorResponse) => {
        this.showError('Error al actualizar venta', err);
      },
    });
  }

  openDeleteModal(sale: any): void {
    this.saleToDelete = sale;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.saleToDelete = null;
  }

  confirmDelete(): void {
    if (!this.saleToDelete) {
      return;
    }

    const saleId = this.saleToDelete.sale_id;

    this._saleService.deleteSale(saleId).subscribe({
      next: () => {
        this.closeDeleteModal();

        this.getSales();
        this.getSupplies();

        this.showToast('Venta eliminada correctamente', 'danger');
      },
      error: (err: HttpErrorResponse) => {
        this.showError('Error al eliminar venta', err);
      },
    });
  }

  // ===================== DETALLES DE VENTA =====================

  openDetailsModal(sale: any): void {
    this.saleDetails = sale;
    this.details = [];
    this.selectedDetail = null;

    this.isDetailsModalOpen = true;

    this.loadDetails(sale.sale_id);
  }

  closeDetailsModal(): void {
    this.isDetailsModalOpen = false;
    this.saleDetails = null;
    this.details = [];
    this.selectedDetail = null;
  }

  loadDetails(saleId: number): void {
    this._saleService.getSaleDetails(saleId).subscribe({
      next: (response: any) => {
        this.details = response || [];
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.showError('Error al obtener detalles de la venta', err);
      },
    });
  }

  // Abrir formulario para agregar o editar un insumo.
  openDetailForm(detail: any = null): void {
    if (detail) {
      this.selectedDetail = { ...detail };
    } else {
      this.selectedDetail = {
        detail_id: null,
        sale_id: this.saleDetails?.sale_id,
        supply_id: null,
        quantity: 1,
        unit_price: 0,
        discount: 0,
      };
    }
  }

  // Precargar precio de venta del insumo seleccionado.
  onSupplyChange(): void {
    if (!this.selectedDetail?.supply_id) {
      return;
    }

    const supply = this.supplies.find(
      (s) => Number(s.supply_id) === Number(this.selectedDetail.supply_id),
    );

    if (supply) {
      this.selectedDetail.unit_price =
        supply.sale_price ?? supply.unit_price ?? supply.price ?? 0;
    }
  }

  saveDetail(): void {
    if (!this.selectedDetail || !this.saleDetails) {
      return;
    }

    const payload = {
      detail_id: this.selectedDetail.detail_id,
      sale_id: this.saleDetails.sale_id,
      supply_id: Number(this.selectedDetail.supply_id),
      quantity: Number(this.selectedDetail.quantity),
      unit_price: Number(this.selectedDetail.unit_price),
      discount: Number(this.selectedDetail.discount || 0),
    };

    // Validaciones básicas.
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
      ? this._saleService.updateSaleDetail(payload)
      : this._saleService.createSaleDetail(payload);

    request.subscribe({
      next: () => {
        this.selectedDetail = null;

        this.afterDetailChange(
          isEdit
            ? 'Insumo actualizado en la venta'
            : 'Insumo agregado a la venta',
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

  confirmDeleteDetail(): void {
    if (!this.detailToDelete) {
      return;
    }

    const detailId = this.detailToDelete.detail_id;

    this._saleService.deleteSaleDetail(detailId).subscribe({
      next: () => {
        this.closeDeleteDetailModal();

        this.afterDetailChange(
          'Insumo eliminado de la venta',
          'danger',
        );
      },
      error: (err: HttpErrorResponse) => {
        this.showError('Error al eliminar el detalle', err);
      },
    });
  }

  // ===================== ACTUALIZAR INFORMACIÓN =====================

  // Los triggers actualizan existencias y totales de la venta.
  // Por eso se vuelven a consultar los datos después de cada cambio.
  afterDetailChange(
    message: string,
    type: 'success' | 'danger' | 'warning',
  ): void {
    if (this.saleDetails?.sale_id) {
      this.loadDetails(this.saleDetails.sale_id);
    }

    this.getSales();
    this.getSupplies();

    this.showToast(message, type);
  }
}
