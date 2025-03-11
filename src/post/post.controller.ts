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
import { DataSource } from 'typeorm';
import { ApiResponse } from '@nestjs/swagger';
import { PageDto } from 'src/common/dto';
import { Auth, User } from 'src/common/decorators';
import { FilterPostsDto } from 'src/post/dto/filter-posts.dto';
import { JwtGuard } from 'src/common/guards';

@Controller('post')
@Auth()
@UseGuards(JwtGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    return this.postService.create(createPostDto);
  }

  @Get()
  @ApiResponse({ type: PageDto })
  async findAll(@User('uid') user_id: number, @Query() q: FilterPostsDto) {
    return this.postService.findAll(q, { currentUserId: user_id });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postService.update(+id, updatePostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postService.remove(+id);
  }
}
