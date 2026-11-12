
import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { ReportService } from '../../services/report.service';
import { AuthService } from '../../services/auth.service';

type ReportTab = 'inventory' | 'sales' | 'discounts' | 'audit' | 'backup';

type SectionStatus = 'idle' | 'loaded' | 'unavailable' | 'error';

@Component({
  selector: 'app-reports',
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports implements OnInit {

  // ========================= PESTAÑAS =========================

  public activeTab: ReportTab = 'inventory';

  // ========================= DATOS =========================

  public inventory: any[] = [];
  public salesByClient: any[] = [];
  public discounts: any[] = [];
  public audit: any[] = [];
  public backups: any[] = [];

  // ========================= ESTADOS =========================

  public loading = false;

  public sectionState: Record<ReportTab, SectionStatus> = {
    inventory: 'idle',
    sales: 'idle',
    discounts: 'idle',
    audit: 'idle',
    backup: 'idle',
  };

  // ========================= TOAST =========================

  public toast = {
    show: false,
    message: '',
    typeClass: 'bg-success',
  };

  // ========================= USUARIO =========================

  public currentUser: any;

  // ========================= FILTROS =========================

  public auditTable = '';
  public auditOp = '';

  constructor(
    private _report: ReportService,
    private cdr: ChangeDetectorRef,
    private _auth: AuthService,
  ) {
    this.currentUser = this._auth.currentUser;
  }

  // ========================= INICIALIZACIÓN =========================

  ngOnInit(): void {
    this.loadInventory();
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
    }, 4500);
  }

  // ========================= UTILIDADES =========================

  private normalizeRows(response: any): any[] {

    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.rows)) {
      return response.rows;
    }

    if (Array.isArray(response?.items)) {
      return response.items;
    }

    return [];
  }

  private getErrorMessage(err: HttpErrorResponse): string {

    if (typeof err?.error === 'string') {
      return err.error;
    }

    return (
      err?.error?.error ||
      err?.error?.message ||
      err?.message ||
      'Error desconocido'
    );
  }

  private handleLoadError(
    tab: ReportTab,
    message: string,
    err: HttpErrorResponse,
  ): void {

    this.loading = false;

    if (err.status === 404 || err.status === 501) {

      this.sectionState[tab] = 'unavailable';

      this.showToast(
        `${message}: la funcionalidad aún no está disponible.`,
        'info',
      );

    } else {

      this.sectionState[tab] = 'error';

      this.showToast(
        `${message}: ${this.getErrorMessage(err)}`,
        'danger',
      );
    }

    this.cdr.detectChanges();
  }

  private startLoading(): void {
    this.loading = true;
    this.cdr.detectChanges();
  }

  private finishLoading(): void {
    this.loading = false;
    this.cdr.detectChanges();
  }

  // ========================= PESTAÑAS =========================

  setTab(tab: ReportTab): void {

    if (this.loading) {
      return;
    }

    // Auditoría y respaldos solamente para administradores.
    if (
      (tab === 'audit' || tab === 'backup') &&
      this.currentUser()?.role != 1
    ) {
      this.activeTab = 'inventory';

      this.showToast(
        'No tienes permisos para acceder a esta sección.',
        'danger',
      );

      return;
    }

    this.activeTab = tab;

    switch (tab) {

      case 'inventory':
        if (this.sectionState.inventory !== 'loaded') {
          this.loadInventory();
        }
        break;

      case 'sales':
        if (this.sectionState.sales !== 'loaded') {
          this.loadSales();
        }
        break;

      case 'discounts':
        if (this.sectionState.discounts !== 'loaded') {
          this.loadDiscounts();
        }
        break;

      case 'audit':
        if (this.sectionState.audit !== 'loaded') {
          this.loadAudit();
        }
        break;

      case 'backup':
        if (this.sectionState.backup !== 'loaded') {
          this.loadBackups();
        }
        break;
    }
  }

  // ========================= INVENTARIO =========================

  loadInventory(): void {

    if (this.loading) {
      return;
    }

    this.startLoading();

    this._report.getInventory().subscribe({

      next: (res: any) => {

        this.inventory = this.normalizeRows(res);

        this.sectionState.inventory = 'loaded';

        this.finishLoading();
      },

      error: (err: HttpErrorResponse) => {

        this.handleLoadError(
          'inventory',
          'Error al obtener el inventario',
          err,
        );
      },
    });
  }

  isLowStock(item: any): boolean {

    const status = String(item?.stock_status ?? '').toLowerCase();

    return status === 'stock bajo' || status === 'agotado';
  }

  getStockClass(item: any): string {

    const status = String(item?.stock_status ?? '').toLowerCase();

    if (status === 'agotado') {
      return 'bg-danger';
    }

    if (status === 'stock bajo') {
      return 'bg-warning text-dark';
    }

    return 'bg-success';
  }

  // ========================= VENTAS POR CLIENTE =========================

  loadSales(): void {

    if (this.loading) {
      return;
    }

    this.startLoading();

    this._report.getSalesByClient().subscribe({

      next: (res: any) => {

        this.salesByClient = this.normalizeRows(res);

        this.sectionState.sales = 'loaded';

        this.finishLoading();
      },

      error: (err: HttpErrorResponse) => {

        this.handleLoadError(
          'sales',
          'Error al obtener las ventas por cliente',
          err,
        );
      },
    });
  }

  // ========================= MOVIMIENTOS DE DESCUENTO =========================

  loadDiscounts(): void {

    if (this.loading) {
      return;
    }

    this.startLoading();

    this._report.getDiscountMovements().subscribe({

      next: (res: any) => {

        this.discounts = this.normalizeRows(res);

        this.sectionState.discounts = 'loaded';

        this.finishLoading();
      },

      error: (err: HttpErrorResponse) => {

        this.handleLoadError(
          'discounts',
          'Error al obtener los movimientos de descuento',
          err,
        );
      },
    });
  }

  // ========================= AUDITORÍA =========================

  loadAudit(): void {

    if (this.loading) {
      return;
    }

    if (this.currentUser()?.role != 1) {

      this.showToast(
        'No tienes permisos para consultar la auditoría.',
        'danger',
      );

      return;
    }

    this.startLoading();

    this._report.getAudit(
      100,
      this.auditTable || undefined,
      this.auditOp || undefined,
    ).subscribe({

      next: (res: any) => {

        this.audit = this.normalizeRows(res);

        this.sectionState.audit = 'loaded';

        this.finishLoading();
      },

      error: (err: HttpErrorResponse) => {

        this.handleLoadError(
          'audit',
          'Error al obtener la auditoría',
          err,
        );
      },
    });
  }

  // Identificar al usuario que realizó la operación.
  getAuditUser(row: any): string {

    const userId = row?.application_user_id;
    const sqlLogin = row?.sql_login;

    if (userId != null && sqlLogin) {
      return `Usuario #${userId} (${sqlLogin})`;
    }

    if (userId != null) {
      return `Usuario #${userId}`;
    }

    return sqlLogin || 'No identificado';
  }

  // Color según el tipo de operación.
  getAuditOperationClass(operation: string): string {

    switch (String(operation ?? '').toUpperCase()) {

      case 'INSERT':
        return 'bg-success';

      case 'UPDATE':
        return 'bg-warning text-dark';

      case 'DELETE':
        return 'bg-danger';

      case 'BACKUP':
        return 'bg-primary';

      case 'BACKUP_ERROR':
        return 'bg-danger';

      default:
        return 'bg-secondary';
    }
  }

  // Construir un detalle legible con los valores anteriores y nuevos.
  formatAuditDetail(row: any): string {

    const parts: string[] = [];

    if (row?.previous_values) {
      parts.push(`Anterior: ${row.previous_values}`);
    }

    if (row?.new_values) {
      parts.push(`Nuevo: ${row.new_values}`);
    }

    if (row?.password_changed === true) {
      parts.push('Se modificó la contraseña.');
    }

    return parts.length > 0 ? parts.join(' | ') : 'Sin detalles adicionales';
  }

  // ========================= RESPALDOS =========================

  loadBackups(): void {

    if (this.loading) {
      return;
    }

    if (this.currentUser()?.role != 1) {

      this.showToast(
        'No tienes permisos para consultar los respaldos.',
        'danger',
      );

      return;
    }

    this.startLoading();

    this._report.getBackups().subscribe({

      next: (res: any) => {

        this.backups = this.normalizeRows(res);

        this.sectionState.backup = 'loaded';

        this.finishLoading();
      },

      error: (err: HttpErrorResponse) => {

        this.handleLoadError(
          'backup',
          'Error al obtener el historial de respaldos',
          err,
        );
      },
    });
  }

  // Obtener estado del respaldo.
  getBackupStatus(backup: any): string {

    const status = backup?.status;

    if (status != null && status !== '') {
      return String(status).toUpperCase();
    }

    return backup?.details ? 'ERROR' : 'OK';
  }

  // Determinar si el respaldo fue exitoso.
  isBackupSuccessful(backup: any): boolean {
    return this.getBackupStatus(backup) === 'OK';
  }

  // Mostrar usuario del respaldo.
  getBackupUser(backup: any): string {

    const userId = backup?.application_user_id;
    const sqlLogin = backup?.sql_login;

    if (userId != null && sqlLogin) {
      return `Usuario #${userId} (${sqlLogin})`;
    }

    if (userId != null) {
      return `Usuario #${userId}`;
    }

    return sqlLogin || 'No identificado';
  }

  // Crear respaldo de la base de datos.
  createBackup(): void {

    if (this.loading) {
      return;
    }

    if (this.currentUser()?.role != 1) {

      this.showToast(
        'No tienes permisos para crear respaldos.',
        'danger',
      );

      return;
    }

    this.startLoading();

    this._report.createBackup().subscribe({

      next: (res: any) => {

        this.loading = false;

        this.sectionState.backup = 'idle';

        this.showToast(
          res?.message || 'Respaldo creado correctamente.',
          'success',
        );

        this.cdr.detectChanges();

        // Consultar de nuevo el historial.
        this.loadBackups();
      },

      error: (err: HttpErrorResponse) => {

        this.loading = false;

        this.showToast(
          'Error al crear respaldo: ' + this.getErrorMessage(err),
          'danger',
        );

        this.cdr.detectChanges();
      },
    });
  }
}
