import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class PostMediaDto {
  @ApiProperty()
  @Transform(({ value }) =>
    value.replace(process.env.AWS_S3_PUBLIC_URL, process.env.AWS_S3_CDN_URL),
  )
  url!: string;

  @ApiProperty()
  priority!: number;

  @ApiProperty()
  type!: string;

  @ApiPropertyOptional()
  text?: string;
}
