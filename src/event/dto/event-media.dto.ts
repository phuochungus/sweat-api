import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { MediaType } from 'src/common/enums';

export class EventMediaDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty()
  @IsNumber()
  priority: number;

  @ApiProperty({ enum: MediaType })
  @IsEnum(MediaType)
  type: MediaType;
}
