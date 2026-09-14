import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.jwt;

    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'fallback-secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    // Authoritative check against the database
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    request['user'] = userWithoutPassword;

    return true;
  }
}
