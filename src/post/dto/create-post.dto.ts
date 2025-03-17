import { ApiProperty, PickType } from '@nestjs/swagger';
import { PostPrivacy } from 'src/common/enums';
import { PostMediaDto } from 'src/post/dto/post-media.dto';
import { PostTagDto } from 'src/post/dto/create-post-tag.dto';
import { Post } from 'src/entities';

export class CreatePostDto extends PickType(Post, [
  'text',
  'privacy',
  'userId',
]) {
  @ApiProperty({ type: [PostTagDto] })
  tags: PostTagDto[];

  @ApiProperty({
    type: [PostMediaDto],
  })
  postMedia: PostMediaDto[];
}
