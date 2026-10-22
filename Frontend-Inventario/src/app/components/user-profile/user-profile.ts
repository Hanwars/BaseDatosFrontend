import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
})
export class UserProfile {
  public profile: any = null;

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

  ngOnInit() {
    this.getProfile();
  }

  getProfile() {
    this._userService.getProfile().subscribe({
      next: (response: any) => {
        this.profile = {
          ...response,
          current_password: '',
          new_password: '',
          confirm_password: '',
        };
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showToast(err.error?.error || 'Error al obtener el perfil', 'danger');
      },
    });
  }

  // La contraseña es opcional: si se escribe una nueva, se exige la actual y la confirmación.
  get wantsPasswordChange(): boolean {
    return !!this.profile?.new_password;
  }

  get passwordsMismatch(): boolean {
    return this.wantsPasswordChange && this.profile.new_password !== this.profile.confirm_password;
  }

  updateProfile() {
    const payload: any = {
      name: this.profile.name,
      email: this.profile.email,
    };
    if (this.wantsPasswordChange) {
      payload.current_password = this.profile.current_password;
      payload.new_password = this.profile.new_password;
    }

    this._userService.updateUser(payload).subscribe({
      next: (response: any) => {
        // Actualiza el nombre que muestra el menú (identity en sessionStorage).
        const identity = { ...this.currentUser(), name: this.profile.name };
        this.currentUser.set(identity as any);
        sessionStorage.setItem('identity', JSON.stringify(identity));

        this.profile.current_password = '';
        this.profile.new_password = '';
        this.profile.confirm_password = '';
        this.showToast('Perfil actualizado correctamente', 'success');
      },
      error: (err) => {
        console.error('ERROR AL ACTUALIZAR PERFIL:', err);
        this.showToast(err.error?.error || 'Error al actualizar el perfil', 'danger');
      },
    });
  }
}
