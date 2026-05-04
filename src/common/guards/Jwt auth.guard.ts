// Backward-compat shim. The canonical location is `./jwt-auth.guard`.
// Existing modules import from this filename (with the unfortunate space);
// keeping it as a re-export avoids breaking dozens of call sites.
export { JwtAuthGuard, JwtRefreshGuard } from './jwt-auth.guard';
