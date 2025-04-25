import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostCommentService } from './post-comment.service';
import {
  CreatePostCommentDto,
  UpdatePostCommentDto,
  FilterPostCommentDto,
} from './dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth, User } from 'src/common/decorators';
import { JwtGuard } from 'src/common/guards';
import { PageDto } from 'src/common/dto';

@ApiTags('comments')
@Controller('post-comments')
@Auth()
@UseGuards(JwtGuard)
export class PostCommentController {
  constructor(private readonly postCommentService: PostCommentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a comment on a post' })
  @ApiResponse({
    status: 201,
    description: 'The comment has been successfully created',
  })
  create(
    @User('id') currentUserId: number,
    @Body() createPostCommentDto: CreatePostCommentDto,
  ) {
    return this.postCommentService.create(createPostCommentDto, {
      currentUserId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Find all comments with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns comments according to specified filters',
    type: PageDto,
  })
  findAll(
    @User('id') currentUserId: number,
    @Query() filterPostCommentDto: FilterPostCommentDto,
  ) {
    return this.postCommentService.findAll(filterPostCommentDto, {
      currentUserId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one comment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the specified comment',
  })
  findOne(@Param('id') id: string) {
    return this.postCommentService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiResponse({
    status: 200,
    description: 'The comment has been successfully updated',
  })
  update(
    @User('id') currentUserId: number,
    @Param('id') id: string,
    @Body() updatePostCommentDto: UpdatePostCommentDto,
  ) {
    return this.postCommentService.update(+id, updatePostCommentDto, {
      currentUserId,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({
    status: 200,
    description: 'The comment has been successfully deleted',
  })
  remove(@User('id') currentUserId: number, @Param('id') id: string) {
    return this.postCommentService.remove(+id, { currentUserId });
  }
}
