import { Inject, Injectable } from '@nestjs/common';
import { CreatePostMediaDto } from './dto/create-post-media.dto';
import { UpdatePostMediaDto } from './dto/update-post-media.dto';
import { S3Service } from 'src/aws/s3/s3.service';
import { Repository } from 'typeorm';
import { PostMedia } from 'src/entities/post-media.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PostMediaService {
  constructor(
    @InjectRepository(PostMedia)
    private readonly postMediaRepository: Repository<PostMedia>,
  ) {}

  async create(createPostMediaDto: CreatePostMediaDto) {
    let { url } = createPostMediaDto;
    url = url.replace(
      'sweatstorage.s3.ap-southeast-1.amazonaws.com',
      'd9r09nvm11mhg.cloudfront.net', //CDN
    );

    const postMedia = await this.postMediaRepository.insert({
      ...createPostMediaDto,
      url,
    });
    return postMedia;
  }

  async findAll() {
    return await this.postMediaRepository.findAndCount();
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
