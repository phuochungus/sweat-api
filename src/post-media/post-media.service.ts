import { Injectable } from '@nestjs/common';
import { CreatePostMediaDto } from './dto/create-post-media.dto';
import { UpdatePostMediaDto } from './dto/update-post-media.dto';
import { S3Service } from 'src/aws/s3/s3.service';

@Injectable()
export class PostMediaService {
  constructor(private readonly s3Service: S3Service) {}
  create(createPostMediaDto: CreatePostMediaDto) {
    return 'This action adds a new postMedia';
  }

  findAll() {
    return `This action returns all postMedia`;
  }

  findOne(id: number) {
    return `This action returns a #${id} postMedia`;
  }

  update(id: number, updatePostMediaDto: UpdatePostMediaDto) {
    return `This action updates a #${id} postMedia`;
  }

  remove(id: number) {
    return `This action removes a #${id} postMedia`;
  }
}
