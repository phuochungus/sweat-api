import { GenericFilter } from 'src/common/generic/paginate';

export class FilterPostCommentDto extends GenericFilter {
  postId?: number;
  replyCommentId?: number;
}
