import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { MediaType } from 'src/common/enums';

export class CreatePostMediaDto {
  @ApiProperty()
  @IsNotEmpty()
  post_id!: number;

  @ApiProperty()
  @IsNotEmpty()
  priority!: number;

  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ value }) =>
    value.replace(process.env.AWS_S3_PUBLIC_URL, process.env.AWS_S3_CDN_URL),
  )
  url!: string;

  @ApiProperty({ enum: MediaType })
  @IsNotEmpty()
  type!: MediaType;
}
