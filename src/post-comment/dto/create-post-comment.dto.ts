import { PickType } from '@nestjs/swagger';
import { PostComment } from 'src/entities';

export class CreatePostCommentDto extends PickType(PostComment, [
  'text',
  'postId',
  'replyCommentId',
]) {}
