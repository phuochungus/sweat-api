import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { UserGender } from 'src/common/enums';

export class UpdateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  fullname!: string;

  @ApiProperty()
  @IsNotEmpty()
  avatar!: string;

  @ApiProperty()
  @IsNotEmpty()
  gender!: UserGender;
}
