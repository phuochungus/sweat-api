import {
  Controller, 
  Post, 
  Delete, 
  Param, 
  ParseIntPipe, 
  UseGuards
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth, User } from 'src/common/decorators';
import { JwtGuard } from 'src/common/guards';
import { PostReactService } from './post-react.service';

@ApiTags('reactions')
@Controller('reactions')
@Auth()
@UseGuards(JwtGuard)
export class PostReactController {
  constructor(private readonly postReactService: PostReactService) {}

  @Post('posts/:postId')
  @ApiOperation({ summary: 'React to a post' })
  @ApiResponse({
    status: 201,
    description: 'The reaction has been successfully created',
  })
  reactToPost(
    @User('id') userId: number,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.postReactService.reactToPost(userId, postId);
  }

  @Delete('posts/:postId')
  @ApiOperation({ summary: 'Remove reaction from a post' })
  @ApiResponse({
    status: 200,
    description: 'The reaction has been successfully removed',
  })
  removeReactionFromPost(
    @User('id') userId: number,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.postReactService.removeReactionFromPost(userId, postId);
  }

  @Post('comments/:commentId')
  @ApiOperation({ summary: 'React to a comment' })
  @ApiResponse({
    status: 201,
    description: 'The reaction has been successfully created',
  })
  reactToComment(
    @User('id') userId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    return this.postReactService.reactToComment(userId, commentId);
  }

  @Delete('comments/:commentId')
  @ApiOperation({ summary: 'Remove reaction from a comment' })
  @ApiResponse({
    status: 200,
    description: 'The reaction has been successfully removed',
  })
  removeReactionFromComment(
    @User('id') userId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    return this.postReactService.removeReactionFromComment(userId, commentId);
  }
}