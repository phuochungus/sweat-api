import { PickType } from '@nestjs/swagger';
import { PostMedia } from 'src/entities';

export class PostMediaDto extends PickType(PostMedia, [
  'url',
  'priority',
  'type',
  'text',
  'videoThumbnail',
] as const) {}
