import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IUserFromRequest } from 'src/common/interface';

export const User = createParamDecorator(
  (data: 'id', ctx: ExecutionContext): IUserFromRequest => {
    const request = ctx.switchToHttp().getRequest();

    const user = request.user;

    return data ? user?.[data] : user;
  },
);
