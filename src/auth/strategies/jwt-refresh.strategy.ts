import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash } from 'crypto';

const extractRefreshToken = (req: Request): string | null => {
  const fromBody =
    (req.body as { refreshToken?: string } | undefined)?.refreshToken ?? null;
  if (fromBody) return fromBody;

  const header = req.headers?.['x-refresh-token'];
  if (typeof header === 'string' && header.length > 0) return header;

  const auth = req.headers?.authorization;
  if (typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return null;
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
      ignoreExpiration: true, // we manage expiry from the DB row
      secretOrKey:
        configService.get<string>('JWT_REFRESH_SECRET') ??
        configService.get<string>('JWT_ACCESS_SECRET') ??
        'unused-refresh-tokens-are-opaque',
      passReqToCallback: true,
    } as never);
  }

  async validate(req: Request) {
    const refreshToken = extractRefreshToken(req);
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date() || stored.revokedAt) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = stored.user;
    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    return {
      id: user.id,
      email: user.email,
      tokenId: stored.id,
      tokenHash,
      refreshToken,
    };
  }
}
