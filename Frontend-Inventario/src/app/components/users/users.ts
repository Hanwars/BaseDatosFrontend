
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { UserService } from '../../services/user.service';
import { RoleService } from '../../services/role.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  public users: any[] = [];
  public roles: any[] = [];

  public search = '';

  public isModalOpen = false;
  public selectedUser: any = null;

  public isDeleteModalOpen = false;
  public userToDelete: any = null;

  public toast = {
    show: false,
    message: '',
    typeClass: 'bg-success',
  };

  public currentUser;

  // Conserva el rol original del usuario seleccionado
  private originalRoleId: number | null = null;

  constructor(
    private _userService: UserService,
    private _roleService: RoleService,
    private cdr: ChangeDetectorRef,
    private _auth: AuthService,
  ) {
    this.currentUser = this._auth.currentUser;
  }

  ngOnInit() {
    this.getUsers();
    this.getRoles();
  }

  // Comprobar si un identificador corresponde al usuario autenticado
  isCurrentUser(userId: number | string | null | undefined): boolean {
    const currentUserId = this.currentUser()?.id;

    return (
      userId != null &&
      currentUserId != null &&
      Number(userId) === Number(currentUserId)
    );
  }

  // Comprobar si se está editando la propia cuenta
  get isEditingOwnAccount(): boolean {
    return this.isCurrentUser(this.selectedUser?.user_id);
  }

  // Mostrar notificaciones
  showToast(
    message: string,
    type: 'success' | 'danger' | 'info' | 'warning' = 'success',
  ) {
    this.toast.message = message;
    this.toast.typeClass = `bg-${type}`;
    this.toast.show = true;

    this.cdr.detectChanges();

    setTimeout(() => {
      this.toast.show = false;
      this.cdr.detectChanges();
    }, 4500);
  }

  // Mostrar errores
  showError(message: string, err: any) {
    console.error(message, err);

    this.showToast(
      `${message}: ${
        err?.error?.error ||
        err?.error?.message ||
        err?.message ||
        'Error'
      }`,
      'danger',
    );
  }

  // Obtener usuarios
  getUsers() {
    this._userService.getUsers().subscribe({
      next: (res: any) => {
        this.users = res || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showError('Error al obtener usuarios', err);
      },
    });
  }

  // Obtener roles
  getRoles() {
    this._roleService.getRoles().subscribe({
      next: (res: any) => {
        this.roles = res || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showError('Error al obtener roles', err);
      },
    });
  }

  // Abrir modal de creación o edición
  openModal(user: any = null) {
    if (user) {
      this.selectedUser = {
        ...user,
        password: '',
      };

      this.originalRoleId =
        user.role_id != null ? Number(user.role_id) : null;

    } else {
      this.selectedUser = {
        user_id: null,
        name: '',
        email: '',
        password: '',
        role_id: 2,
      };

      this.originalRoleId = null;
    }

    this.isModalOpen = true;
  }

  // Cerrar modal de creación o edición
  closeModal() {
    this.isModalOpen = false;
    this.selectedUser = null;
    this.originalRoleId = null;
  }

  // Crear o actualizar usuario
  saveUser() {
    if (!this.selectedUser) {
      return;
    }

    // Validar nombre
    if (!this.selectedUser.name?.trim()) {
      this.showToast('El nombre es obligatorio.', 'warning');
      return;
    }

    // Validar rol
    if (
      this.selectedUser.role_id === null ||
      this.selectedUser.role_id === undefined
    ) {
      this.showToast('Debes seleccionar un rol.', 'warning');
      return;
    }

    // Validar contraseña al crear
    if (
      !this.selectedUser.user_id &&
      !this.selectedUser.password
    ) {
      this.showToast(
        'La contraseña es obligatoria al crear un usuario.',
        'warning',
      );
      return;
    }

    // Validar contraseña cuando se proporciona
    if (this.selectedUser.password) {
      const passwordLength = this.selectedUser.password.length;

      if (passwordLength < 8 || passwordLength > 100) {
        this.showToast(
          'La contraseña debe tener entre 8 y 100 caracteres.',
          'warning',
        );
        return;
      }
    }

    // Bloquear cualquier cambio de rol en la propia cuenta
    if (this.isEditingOwnAccount) {
      if (
        this.originalRoleId === null ||
        Number(this.selectedUser.role_id) !== this.originalRoleId
      ) {
        this.selectedUser.role_id = this.originalRoleId;

        this.showToast(
          'No puedes cambiar el rol de tu propia cuenta.',
          'warning',
        );

        return;
      }
    }

    // Preparar información para el backend
    const payload: any = {
      user_id: this.selectedUser.user_id,
      name: this.selectedUser.name.trim(),
      email: this.selectedUser.email?.trim() || null,

      // Conservar el rol original si se edita la propia cuenta
      role_id: this.isEditingOwnAccount
        ? this.originalRoleId
        : Number(this.selectedUser.role_id),
    };

    // Enviar contraseña únicamente si se proporcionó
    if (this.selectedUser.password) {
      payload.password = this.selectedUser.password;
    }

    // Actualizar usuario
    if (payload.user_id) {
      this._userService.updateUser(payload).subscribe({
        next: () => {
          this.closeModal();
          this.getUsers();

          this.showToast(
            'Usuario actualizado correctamente.',
            'warning',
          );
        },
        error: (err) => {
          this.showError('Error al actualizar usuario', err);
        },
      });

    } else {
      // Crear usuario
      this._userService.createUser(payload).subscribe({
        next: () => {
          this.closeModal();
          this.getUsers();

          this.showToast(
            'Usuario creado correctamente.',
            'success',
          );
        },
        error: (err) => {
          this.showError('Error al crear usuario', err);
        },
      });
    }
  }

  // Abrir modal de eliminación
  openDeleteModal(user: any) {
    if (this.isCurrentUser(user.user_id)) {
      this.showToast(
        'No puedes eliminar tu propia cuenta.',
        'warning',
      );
      return;
    }

    this.userToDelete = user;
    this.isDeleteModalOpen = true;
  }

  // Cerrar modal de eliminación
  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.userToDelete = null;
  }

  // Confirmar eliminación
  confirmDelete() {
    if (!this.userToDelete) {
      return;
    }

    // Impedir eliminar la propia cuenta
    if (this.isCurrentUser(this.userToDelete.user_id)) {
      this.showToast(
        'No puedes eliminar tu propia cuenta.',
        'warning',
      );

      this.closeDeleteModal();
      return;
    }

    this._userService.deleteUser(this.userToDelete.user_id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.getUsers();

        this.showToast(
          'Usuario eliminado correctamente.',
          'success',
        );
      },
      error: (err) => {
        this.showError('Error al eliminar usuario', err);
      },
    });
  }

  // Obtener nombre del rol
  roleName(roleId: number) {
    return this.roles.find(
      (r) => Number(r.role_id) === Number(roleId),
    )?.name || roleId;
  }
}
