import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// existing decorator
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// ✅ ADD THIS
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);