import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization =
      request.headers['authorization'] || request.headers['Authorization'];
    const uid = request.headers['uid'] || request.headers['Uid'];
    const [_, token] = authorization.split(' ');
    let user;
    if (token != process.env.ADMIN_TOKEN) {
      let firebase_id = '';
      try {
        const { uid } = await admin.auth().verifyIdToken(token);
        firebase_id = uid;
      } catch (error) {
        return false;
      }
      user = await this.userRepository.findOne({
        where: {
          firebase_id,
        },
      });
      if (!user) {
        await this.userRepository.insert({});
      }
    } else {
      user = await this.userRepository.findOne({
        where: {
          id: uid,
        },
      });
      if (!user) return false;
    }

    request.user = user;
    return true;
  }
}
