import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { PostValidationService } from './post-validation.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('post-validation')
@Controller('post-validation')
export class PostValidationController {
  constructor(private readonly postValidationService: PostValidationService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a post with images or text-only content' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns validation scores for the post',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Post validation failed',
  })
  async validatePost(
    @Body()
    body: {
      imageUrl?: string | string[];
      caption?: string;
    },
  ) {
    const { imageUrl, caption } = body;
    const results = await this.postValidationService.validatePost(
      imageUrl,
      caption,
    );
    return { results };
  }

  @Post('validate-and-check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a post and check against minimum scores' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns validation scores if the post passes validation',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Post validation failed',
  })
  async validateAndCheck(
    @Body()
    body: {
      imageUrl?: string | string[];
      caption?: string;
    },
  ) {
    const { imageUrl, caption } = body;
    const results = await this.postValidationService.validateAndCheckPost(
      imageUrl,
      caption,
    );
    return {
      results,
      message: 'Post validation successful',
    };
  }
}
