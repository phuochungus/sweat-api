import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtGuard } from 'src/common/guards';
import { User } from 'src/common/decorators';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtGuard)
  @Post('/')
  async createUser(@User() user) {
    return user;
  }

  @UseGuards(JwtGuard)
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
}
