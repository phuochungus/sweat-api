import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreatePostMediaDto } from './dto/create-post-media.dto';
import { UpdatePostMediaDto } from './dto/update-post-media.dto';
import { S3Service } from 'src/aws/s3/s3.service';
import { Repository } from 'typeorm';
import { PostMedia } from 'src/entities/post-media.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PageDto, PageMetaDto } from 'src/common/dto';

@Injectable()
export class PostMediaService {
  constructor(
    @InjectRepository(PostMedia)
    private readonly postMediaRepository: Repository<PostMedia>,
  ) {}

  async create(createPostMediaDto: CreatePostMediaDto) {
    const post = await this.postMediaRepository.findOne({
      where: {
        id: createPostMediaDto.post_id,
      },
    });

    if (!post) {
      throw new BadRequestException({
        message: 'Post not found',
      });
    }
    const postMedia = await this.postMediaRepository.insert(createPostMediaDto);
    return postMedia;
  }

  async findAll({ postId }, { currentUserId }) {
    const [item, itemCount] = await this.postMediaRepository.findAndCount({
      where: {
        postId: postId,
      },
    });

    return new PageDto(
      item,
      new PageMetaDto({
        itemCount,
        pageOptionsDto: { page: 1, take: itemCount },
      }),
    );
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
