import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsDate,
  IsNumber,
} from 'class-validator';
import { EventPrivacy } from 'src/common/enums';
import { Type } from 'class-transformer';
import { EventMediaDto } from './event-media.dto';

export class CreateEventDto {
  @ApiProperty({ description: 'Event title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Event description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Event location' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Event start time' })
  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @ApiPropertyOptional({ description: 'Event end time' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endTime?: Date;

  @ApiProperty({ description: 'Creator user ID' })
  @IsNumber()
  creatorId: number;

  @ApiProperty({ enum: EventPrivacy, default: EventPrivacy.PUBLIC })
  @IsEnum(EventPrivacy)
  privacy: EventPrivacy;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiPropertyOptional({
    type: [EventMediaDto],
    description: 'Event media attachments',
  })
  @IsOptional()
  media?: EventMediaDto[];
}
