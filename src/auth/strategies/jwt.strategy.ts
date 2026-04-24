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

 async validate(payload: JwtPayload) {
  const user = await this.prisma.user.findUnique({
    where: { id: payload.sub },
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
  });

  // ✅ FIX: handle null
  if (!user) {
    throw new UnauthorizedException('User not found');
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
  };
}
}
