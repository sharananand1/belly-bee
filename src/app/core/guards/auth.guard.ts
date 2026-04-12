import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthTokenService } from '../auth-token.service';

export const authGuard: CanActivateFn = (route, state) => {
  const tokens = inject(AuthTokenService);
  const router = inject(Router);

  if (tokens.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
};
