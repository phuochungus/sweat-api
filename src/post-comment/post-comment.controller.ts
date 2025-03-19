import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { PostCommentService } from './post-comment.service';
import { CreatePostCommentDto } from './dto/create-post-comment.dto';
import { FilterPostCommentDto } from 'src/post-comment/dto/filter-post-comment.dto';
import { Auth, User } from 'src/common/decorators';

@Auth()
@Controller('post-comment')
export class PostCommentController {
  constructor(private readonly postCommentService: PostCommentService) {}

  @Post()
  create(
    @Body() createPostCommentDto: CreatePostCommentDto,
    @User('id') userId: number,
  ) {
    return this.postCommentService.create(createPostCommentDto, {
      currentUserId: userId,
    });
  }

  @Get()
  findAll(@Query() query: FilterPostCommentDto) {
    return this.postCommentService.findAll(query);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postCommentService.remove(+id);
  }
}
