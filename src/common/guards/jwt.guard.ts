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
    const uid = request.headers['x-uid'];
    if (!authorization) {
      return false;
    }
    const [_, token] = authorization?.split(' ');
    let user;
    console.log('token', token);
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
          firebaseId: firebase_id,
        },
      });
      if (!user) {
        user = this.userRepository.create({
          firebaseId: firebase_id,
        });
        await this.userRepository.save(user);
      }
    } else {
      user = await this.userRepository.findOne({
        where: {
          id: uid,
        },
      });
      if (!user) {
        user = this.userRepository.create({
          id: uid,
        });
        await this.userRepository.save(user);
      }
    }

    request.user = user;
    return true;
  }
}
