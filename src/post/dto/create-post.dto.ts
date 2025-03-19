import { ApiProperty, PickType } from '@nestjs/swagger';
import { PostMediaDto } from 'src/post/dto/post-media.dto';
import { Post } from 'src/entities';

export class CreatePostDto extends PickType(Post, [
  'text',
  'privacy',
  'userId',
]) {
  @ApiProperty({
    type: [PostMediaDto],
  })
  postMedia: PostMediaDto[];
}
