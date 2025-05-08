import { ApiProperty, PickType } from '@nestjs/swagger';
import { PostMediaDto } from 'src/post/dto/post-media.dto';
import { Post } from 'src/entities';
import { IsArray } from 'class-validator';

export class CreatePostDto extends PickType(Post, [
  'text',
  'privacy',
  'userId',
]) {
  @IsArray()
  @ApiProperty({
    type: [PostMediaDto],
  })
  postMedia: PostMediaDto[];
}
