import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Role } from '../types';
import { Request } from 'express';

export const ROLES_KEY = 'roles';

// @Roles(Role.STUDENT, Role.FACULTY) — attaches role metadata to a route handler
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// @CurrentUser() — injects the full req.user object
// @CurrentUser('id') — injects req.user.id only
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: Record<string, unknown> }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
