import { PartialType } from '@nestjs/swagger';
import { CreatePostMediaDto } from './create-post-media.dto';

export class UpdatePostMediaDto extends PartialType(CreatePostMediaDto) {}
