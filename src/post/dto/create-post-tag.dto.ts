import { PickType } from '@nestjs/swagger';
import { PostTag } from 'src/entities';

export class PostTagDto extends PickType(PostTag, ['userId'] as const) {}
