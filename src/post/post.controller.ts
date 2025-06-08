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
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ApiResponse } from '@nestjs/swagger';
import { PageDto } from 'src/common/dto';
import { Auth, User } from 'src/common/decorators';
import { FilterPostsDto } from 'src/post/dto/filter-posts.dto';
import { JwtGuard } from 'src/common/guards';
import { FilterLikeDto } from 'src/post/dto/filter-like.dto';

@Controller('posts')
@Auth()
@UseGuards(JwtGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  create(@User('id') userId: number, @Body() createPostDto: CreatePostDto) {
    return this.postService.create(createPostDto, { currentUserId: userId });
  }

  @Get()
  @ApiResponse({ type: PageDto })
  async findAll(@User('id') user_id: number, @Query() q: FilterPostsDto) {
    return this.postService.findAll(q, { currentUserId: user_id });
  }

  @Get('feed')
  @ApiResponse({ type: PageDto })
  async getFeed(@User('id') userId: number, @Query() q: FilterPostsDto) {
    return this.postService.getFeed(userId, q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postService.update(+id, updatePostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postService.remove(+id);
  }

  @Post(':id/likes')
  async likePost(@User('id') userId: number, @Param('id') postId: number) {
    return this.postService.likePost(userId, postId);
  }

  @Delete(':id/likes')
  async unlikePost(@User('id') userId: number, @Param('id') postId: number) {
    return this.postService.unlikePost(userId, postId);
  }

  @Get(':id/likes')
  async getLikes(@Param('id') postId: number, @Query() q: FilterLikeDto) {
    return this.postService.getLikes({ postId, ...q });
  }
}
