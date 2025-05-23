import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { DataSource } from 'typeorm';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/common/decorators';

@Injectable()
export class JwtGuard implements CanActivate {
  private isTestMode: boolean;

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectDataSource() private dataSource: DataSource,
    private reflector: Reflector,
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
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

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

      const decodedToken = await admin.auth().verifyIdToken(token);
      const firebaseId = decodedToken.uid;
      let user = await this.dataSource
        .getRepository(User)
        .createQueryBuilder('user')
        .where('user.firebaseId = :firebaseId', { firebaseId })
        .getOne();
      if (!user) {
        // create a new user if not found
        await this.dataSource.getRepository(User).insert({
          firebaseId: firebaseId,
          fullname: decodedToken.name,
          avatarUrl: decodedToken.picture,
        });
        user = await this.dataSource
          .getRepository(User)
          .createQueryBuilder('user')
          .where('user.firebaseId = :firebaseId', { firebaseId })
          .getOne();
      }
      await this.cacheManager.set(
        `auth_token:${token}`,
        { id: user.id, firebaseId: user.firebaseId },
        decodedToken.exp * 1000 - Date.now(),
      );

      request.user = user;
      return true;
    } catch (error) {
      console.error('Authentication error in JwtGuard:', error);
      throw new UnauthorizedException('Invalid token or session expired');
    }
  }
}
