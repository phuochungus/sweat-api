import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PostMedia } from 'src/entities';

export class PostMediaDto extends PickType(PostMedia, [
  'url',
  'priority',
  'type',
  'text',
] as const) {}
