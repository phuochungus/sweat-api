import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization =
      request.headers['authorization'] || request.headers['Authorization'];
    const [_, token] = authorization.split(' ');
    let firebase_id = '';
    try {
      const { uid } = await admin.auth().verifyIdToken(token);
      firebase_id = uid;
    } catch (error) {
      return false;
    }
    const user = await this.userRepository.findOne({
      where: {
        firebase_id,
      },
    });
    if (!user) {
      await this.userRepository.insert({
        firebase_id,
      });
    }

    request.user = user;
    return true;
  }
}
