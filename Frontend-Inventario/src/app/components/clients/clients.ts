
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClientService } from '../../services/client.service';
import { ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-clients',
  imports: [CommonModule, FormsModule],
  templateUrl: './clients.html',
  styleUrl: './clients.css',
})
export class Clients {
  public clients: any[] = [];

  public isModalOpen = false;
  public selectedClient: any = null;

  public isDeleteModalOpen = false;
  public clientToDelete: any = null;

  public toast = {
    show: false,
    message: '',
    typeClass: 'bg-success',
  };

  public search: string = '';
  public currentUser;

  constructor(
    private _clientService: ClientService,
    private cdr: ChangeDetectorRef,
    private _auth: AuthService,
  ) {
    this.currentUser = this._auth.currentUser;
  }

  showToast(
    message: string,
    type: 'success' | 'danger' | 'info' | 'warning' = 'success'
  ) {
    this.toast.message = message;
    this.toast.typeClass = `bg-${type}`;
    this.toast.show = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.toast.show = false;
      this.cdr.detectChanges();
    }, 5000);
  }

  // Muestra el mensaje del backend.
  showError(message: string, err: any) {
    console.error(message, err);

    const errorMessage =
      err?.error?.error ||
      err?.error?.message ||
      err?.message ||
      'Error desconocido';

    this.showToast(`${message}: ${errorMessage}`, 'danger');
  }

  ngOnInit() {
    this.getClients();
  }

  getClients() {
    this._clientService.getClients().subscribe({
      next: (response: any) => {
        this.clients = response || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showError('Error al obtener clientes', err);
      },
    });
  }

  // Prepara los datos antes de enviarlos al backend.
  private prepareClientPayload(client: any) {
    const phone = Number(client.contact_phone);

    if (
      !Number.isInteger(phone) ||
      phone <= 0 ||
      phone > 99999999
    ) {
      this.showToast(
        'El teléfono debe ser un número positivo de máximo 8 dígitos.',
        'warning'
      );
      return null;
    }

    return {
      ...client,
      contact_phone: phone,
    };
  }

  createClient(client: any) {
    const payload = this.prepareClientPayload(client);

    if (!payload) return;

    this._clientService.createClient(payload).subscribe({
      next: (response: any) => {
        this.getClients();
        this.closeModal();
        this.showToast('Cliente creado correctamente', 'success');
      },
      error: (err) => {
        this.showError('Error al crear cliente', err);
      },
    });
  }

  updateClient(client: any) {
    const payload = this.prepareClientPayload(client);

    if (!payload) return;

    this._clientService.updateClient(payload).subscribe({
      next: (response: any) => {
        this.getClients();
        this.closeModal();
        this.showToast('Cliente actualizado correctamente', 'warning');
      },
      error: (err) => {
        this.showError('Error al actualizar cliente', err);
      },
    });
  }

  confirmDelete(client_id: number) {
    if (!client_id) return;

    this._clientService.deleteClient(client_id).subscribe({
      next: (response: any) => {
        this.getClients();
        this.closeDeleteModal();
        this.showToast('Cliente eliminado correctamente', 'success');
      },
      error: (err) => {
        this.showError('Error al eliminar cliente', err);
      },
    });
  }

  openModal(client: any) {
    this.selectedClient = client
      ? { ...client }
      : {
          client_id: null,
          name: '',
          contact_phone: null,
          contact_email: '',
        };

    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedClient = null;
  }

  openDeleteModal(client: any) {
    this.clientToDelete = client;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.clientToDelete = null;
  }
}
