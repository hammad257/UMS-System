import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash } from 'crypto';

// ✅ helper function (you were missing this)
const extractRefreshToken = (req: Request): string | null => {
  const authHeader = req.headers?.authorization;
  if (!authHeader) return null;

  if (!authHeader.startsWith('Bearer ')) return null;

  return authHeader.replace('Bearer', '').trim();
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: extractRefreshToken,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    }as any);
  }

  // ✅ MUST be inside class
  async validate(req: Request) {
    const refreshToken = extractRefreshToken(req);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    const refreshTokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        OR: [{ token: refreshTokenHash }, { token: refreshToken }],
      },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // ✅ fix undefined issue
    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = storedToken.user;

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // ✅ extract roles
    const roles = user.roles.map((r) => r.role.name);

    // ✅ extract permissions
    const permissions = user.roles.flatMap((r) =>
      r.role.permissions.map((p) => p.permission.name),
    );

    return {
      id: user.id,
      email: user.email,
      roles,
      permissions,
      refreshToken,
    };
  }
}