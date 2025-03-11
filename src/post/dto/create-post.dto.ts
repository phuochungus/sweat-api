import { ApiProperty } from '@nestjs/swagger';
import { PostPrivacy } from 'src/common/enums';
import { PostMediaDto } from 'src/post/dto/post-media.dto';
import { PostTagDto } from 'src/post/dto/create-post-tag.dto';

export class CreatePostDto {
  @ApiProperty()
  text!: string;

  @ApiProperty({ enum: PostPrivacy })
  privacy!: PostPrivacy;

  @ApiProperty()
  user_id!: number;

  @ApiProperty({ type: [PostTagDto] })
  tags: PostTagDto[];

  @ApiProperty({
    type: [PostMediaDto],
  })
  postMedia: PostMediaDto[];
}
