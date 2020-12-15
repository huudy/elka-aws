import { AuthenticationService } from './authentication.service';

export function appInitializer(authenticationService: AuthenticationService) {
  return () =>
    new Promise((resolve) => {
      console.log('From app initializer');

      // attempt to refresh token on app start up to auto authenticate
      authenticationService.refreshToken().subscribe().add(resolve);
    });
}
