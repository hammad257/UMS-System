import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { StrategyOptionsWithRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

const extractRefreshToken = (req: { headers?: { authorization?: string } }) => {
  const authHeader = req.headers?.authorization?.trim();
  if (!authHeader) {
    return null;
  }

  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader;
  }

  const token = authHeader.slice(7).trim();
  if (token.toLowerCase().startsWith('bearer ')) {
    return token.slice(7).trim();
  }

  return token;
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
    const options: StrategyOptionsWithRequest = {
      jwtFromRequest: extractRefreshToken,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') ?? '',
      passReqToCallback: true,
    };
    super(options);
  }

  async validate(req: Request) {
    const refreshToken = extractRefreshToken(req);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    // Check if this refresh token exists and is not expired
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: { select: { id: true, email: true, role: true, isActive: true } },
      },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!storedToken.user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return { ...storedToken.user, refreshToken };
  }
}
