import { inject } from "@angular/core";
import { AuthService } from "../../services/auth.service";
import { Router, CanActivateFn } from "@angular/router";

export const adminGuard: CanActivateFn = () => {
    const router = inject(Router);
    const auth = inject(AuthService);

    const user = auth.getCurrentUser();

    if (auth.isAuthenticated() && user?.role === 1) {
        return true;
    }

    return router.createUrlTree(['/home']);
};
