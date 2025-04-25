import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtGuard } from '../guards';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export function Auth() {
  return applyDecorators(
    UseGuards(JwtGuard),
    ApiBearerAuth('firebase-jwt'),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}
