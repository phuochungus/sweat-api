import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { UserGender } from 'src/common/enums';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class JwtGuard implements CanActivate {
  private isTestMode: boolean;

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly authService: AuthService,
  ) {
    const environment = this.configService.get('environment');
    this.isTestMode = environment === 'test';
    console.log(
      `JwtGuard initialized with environment: ${environment}, isTestMode: ${this.isTestMode}`,
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Bearer token is missing');
    }

    try {
      // Check cache first for the token
      const cachedUser = await this.cacheManager.get<User>(
        `auth_token:${token}`,
      );

      if (cachedUser) {
        request.user = cachedUser;
        return true;
      }

      // If not in cache, use the auth service to verify and get user
      const user = await this.authService.verifyTokenAndGetUser(token);
      request.user = user;
      return true;
    } catch (error) {
      console.error('Authentication error in JwtGuard:', error);
      throw new UnauthorizedException('Invalid token or session expired');
    }
  }
}
