import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IUserFromRequest } from 'src/common/interface';

export const User = createParamDecorator(
  (data: 'uid', ctx: ExecutionContext): IUserFromRequest => {
    const request = ctx.switchToHttp().getRequest();

    const user = request.user;

    return data ? user?.[data] : user;
  },
);
