import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  BadRequestException,
  Get,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtGuard } from 'src/common/guards';
import { Auth, User } from 'src/common/decorators';

@Auth()
@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch('/:id')
  async updateUser(
    @Body() updateUserDto: UpdateUserDto,
    @Param('id') id: string,
  ) {
    if (!id) {
      throw new BadRequestException('Id is required');
    }
    if (isNaN(+id)) {
      throw new BadRequestException('Id must be a number');
    }
    return this.userService.update(+id, updateUserDto);
  }

  @Get('/login')
  async getUser(@User() user) {
    return user;
  }
}
