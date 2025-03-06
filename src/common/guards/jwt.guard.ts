import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    // private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
    //   context.getHandler(),
    //   context.getClass(),
    // ]);
    // if (isPublic) return true;

    // const request = context.switchToHttp().getRequest();
    // const headers = request?.headers;
    // const authorization = headers['authorization'] || headers['Authorization'];

    // const [, token] = authorization?.split(' ') || [];

    // const firebaseId = authenticated.uid;
    // const user = await this.usersService.getDetailById(null, {
    //   where: { id_firebase: firebaseId },
    // });

    // if (!user?.id) throw new VGSUnauthorizedException('unauthorized');

    // request['user'] = { uid: user.id };

    return true;
  }
}
