import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('Frontend-Inventario');
  public currentUser;
  private checkSessionInterval: any;

  constructor(private _auth: AuthService, private router: Router) {
    this.currentUser = _auth.currentUser;
    this.checkSessionInterval = setInterval(() => {
      this.checkSession();
    }, 2000);
  }

  checkSession() {
    if (!this._auth.isAuthenticated()) {
      this._auth.logout();
      this.currentUser.set(null);
    }
  }

  logout() {
    this._auth.logout();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
