import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VerifyTokenDto } from './dto/verify-token.dto';
import { AuthService } from 'src/auth/auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Firebase token and create or get user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Token verified and user retrieved successfully' 
  })
  async verifyToken(@Body() verifyTokenDto: VerifyTokenDto) {
    return this.authService.verifyTokenAndGetUser(verifyTokenDto.token);
  }
}