
import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
})
export class UserProfile implements OnInit {

  // ========================= PERFIL =========================

  public profile: any = null;

  public loadingProfile = false;
  public saving = false;

  // ========================= USUARIO AUTENTICADO =========================

  public currentUser: any;

  // ========================= TOAST =========================

  public toast = {
    show: false,
    message: '',
    typeClass: 'bg-success',
  };

  constructor(
    private _userService: UserService,
    private cdr: ChangeDetectorRef,
    private _auth: AuthService,
  ) {
    this.currentUser = this._auth.currentUser;
  }

  // ========================= INICIALIZACIÓN =========================

  ngOnInit(): void {
    this.getProfile();
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

  // ========================= ERRORES =========================

  private getErrorMessage(err: HttpErrorResponse): string {

    if (typeof err?.error === 'string') {
      return err.error;
    }

    return (
      err?.error?.error ||
      err?.error?.message ||
      err?.error?.message?.message ||
      err?.message ||
      'Error desconocido'
    );
  }

  // ========================= OBTENER PERFIL =========================

  getProfile(): void {

    if (this.loadingProfile) {
      return;
    }

    this.loadingProfile = true;

    this._userService.getProfile().subscribe({

      next: (response: any) => {

        this.profile = {
          user_id: response?.user_id ?? null,
          name: response?.name ?? '',
          email: response?.email ?? '',

          // Campos utilizados solamente para cambiar la contraseña.
          current_password: '',
          new_password: '',
          confirm_password: '',
        };

        this.loadingProfile = false;

        this.cdr.detectChanges();
      },

      error: (err: HttpErrorResponse) => {

        this.loadingProfile = false;
        this.profile = null;

        console.error('ERROR AL OBTENER PERFIL:', err);

        this.showToast(
          this.getErrorMessage(err) || 'Error al obtener el perfil',
          'danger',
        );

        this.cdr.detectChanges();
      },
    });
  }

  // ========================= VALIDACIONES DE CONTRASEÑA =========================

  // Si se escribe cualquiera de los campos de contraseña,
  // se considera que el usuario quiere cambiarla.
  get wantsPasswordChange(): boolean {

    if (!this.profile) {
      return false;
    }

    return (
      this.profile.current_password !== '' ||
      this.profile.new_password !== '' ||
      this.profile.confirm_password !== ''
    );
  }

  // Verifica que los tres campos estén completos.
  get passwordFieldsIncomplete(): boolean {

    if (!this.wantsPasswordChange) {
      return false;
    }

    return (
      !this.profile?.current_password ||
      !this.profile?.new_password ||
      !this.profile?.confirm_password
    );
  }

  // Verifica que la nueva contraseña y su confirmación coincidan.
  get passwordsMismatch(): boolean {

    if (!this.wantsPasswordChange) {
      return false;
    }

    if (
      !this.profile?.new_password ||
      !this.profile?.confirm_password
    ) {
      return false;
    }

    return this.profile.new_password !== this.profile.confirm_password;
  }

  // ========================= ACTUALIZAR PERFIL =========================

  updateProfile(): void {

    if (!this.profile || this.saving) {
      return;
    }

    const name = String(this.profile.name ?? '').trim();
    const email = String(this.profile.email ?? '').trim();

    // Validación de nombre.
    if (name.length < 3) {
      this.showToast(
        'El nombre debe tener al menos 3 caracteres.',
        'danger',
      );
      return;
    }

    if (name.length > 300) {
      this.showToast(
        'El nombre no puede superar los 300 caracteres.',
        'danger',
      );
      return;
    }

    // Validación del correo.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      this.showToast(
        'El formato del correo electrónico no es válido.',
        'danger',
      );
      return;
    }

    if (email.length > 150) {
      this.showToast(
        'El correo supera la longitud permitida.',
        'danger',
      );
      return;
    }

    // Validar los campos de contraseña.
    if (this.wantsPasswordChange) {

      if (this.passwordFieldsIncomplete) {
        this.showToast(
          'Debes completar los tres campos de contraseña.',
          'danger',
        );
        return;
      }

      if (this.passwordsMismatch) {
        this.showToast(
          'La nueva contraseña y su confirmación no coinciden.',
          'danger',
        );
        return;
      }

      if (
        this.profile.current_password.length > 100 ||
        this.profile.new_password.length > 100
      ) {
        this.showToast(
          'La contraseña no puede superar los 100 caracteres.',
          'danger',
        );
        return;
      }
    }

    // Construir el payload esperado por PUT /profile.
    const payload: any = {
      name,
      email,
    };

    // Solo enviar las contraseñas si el usuario desea cambiarlas.
    if (this.wantsPasswordChange) {

      payload.current_password = this.profile.current_password;
      payload.new_password = this.profile.new_password;

    }

    this.saving = true;

    // IMPORTANTE:
    // Se utiliza updateProfile(), no updateUser().
    this._userService.updateProfile(payload).subscribe({

      next: (response: any) => {

        this.saving = false;

        // Mantener los datos actualizados en el formulario.
        this.profile.name = name;
        this.profile.email = email;

        // Actualizar el nombre de usuario que aparece en el menú.
        const identity = {
          ...(this.currentUser?.() ?? {}),
          name,
        };

        if (typeof this.currentUser?.set === 'function') {
          this.currentUser.set(identity);
        }

        // Mantener sincronizada la identidad de la sesión.
        try {
          sessionStorage.setItem(
            'identity',
            JSON.stringify(identity),
          );
        } catch (storageError) {
          console.error('No se pudo actualizar la sesión local:', storageError);
        }

        // Limpiar los campos de contraseña.
        this.profile.current_password = '';
        this.profile.new_password = '';
        this.profile.confirm_password = '';

        this.showToast(
          response?.message || 'Perfil actualizado correctamente.',
          'success',
        );

        this.cdr.detectChanges();
      },

      error: (err: HttpErrorResponse) => {

        this.saving = false;

        console.error('ERROR AL ACTUALIZAR PERFIL:', err);

        this.showToast(
          this.getErrorMessage(err) || 'Error al actualizar el perfil.',
          'danger',
        );

        this.cdr.detectChanges();
      },
    });
  }
}
