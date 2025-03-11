import { Controller, Post, Body, Get } from '@nestjs/common';
import { S3Service } from 'src/aws/s3/s3.service';
import { User } from 'src/common/decorators';
import { CreatePostMediaDto } from 'src/post-media/dto/create-post-media.dto';
import { GenerateUploadLink } from 'src/post-media/dto/generate-link';
import { PostMediaService } from 'src/post-media/post-media.service';

@Controller('post-media')
export class PostMediaController {
  constructor(
    private readonly s3Service: S3Service,
    private readonly postMediaService: PostMediaService,
  ) {}

  @Post('/upload/generate-link')
  async batchGeneratePresignedUrl(
    @User('uid') userId: string,
    @Body() body: GenerateUploadLink,
  ) {
    return this.s3Service.batchGeneratePresignedUrl(
      body?.files.map((file) => ({ ...file, id: userId })),
    );
  }
}
