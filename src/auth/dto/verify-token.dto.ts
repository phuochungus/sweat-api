import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyTokenDto {
  @ApiProperty({
    description: 'Firebase authentication token',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOTczZWUzM2I...'
  })
  @IsNotEmpty()
  @IsString()
  token: string;
}