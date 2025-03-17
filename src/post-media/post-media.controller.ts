import { Controller, Post, Body, UseGuards, Param, Get } from '@nestjs/common';
import { S3Service } from 'src/aws/s3/s3.service';
import { Auth, User } from 'src/common/decorators';
import { JwtGuard } from 'src/common/guards';
import { CreatePostMediaDto } from 'src/post-media/dto/create-post-media.dto';
import { GenerateUploadLink } from 'src/post-media/dto/generate-link';
import { PostMediaService } from 'src/post-media/post-media.service';

@Auth()
@UseGuards(JwtGuard)
@Controller('post-media')
export class PostMediaController {
  constructor(
    private readonly s3Service: S3Service,
    private readonly postMediaService: PostMediaService,
  ) {}

  @Post('/upload/generate-link')
  async batchGeneratePresignedUrl(
    @User('id') userId: string,
    @Body() body: GenerateUploadLink,
  ) {
    return this.s3Service.batchGeneratePresignedUrl(
      body?.files.map((file) => ({ ...file, id: userId })),
    );
  }

  @Post('/')
  async createPostMedia(@Body() body: CreatePostMediaDto) {
    console.log(body);
    return this.postMediaService.create(body);
  }

  @Get('/post/:id')
  async getPostMedia(@User('id') userId: string, @Param('id') postId: string) {
    return this.postMediaService.findAll(
      {
        postId,
      },
      {
        currentUserId: userId,
      },
    );
  }
}
