import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { StrategyOptionsWithoutRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string;
}

const extractAccessToken = (req: { headers?: { authorization?: string } }) => {
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
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const options: StrategyOptionsWithoutRequest = {
      // Extract JWT from Authorization: Bearer <token> header
      jwtFromRequest: extractAccessToken,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') ?? '',
    };
    super(options);
  }

  // Called automatically after token signature is verified
  // Return value is attached to request.user
  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or account deactivated');
    }

    return user; // → attached as req.user
  }
}
