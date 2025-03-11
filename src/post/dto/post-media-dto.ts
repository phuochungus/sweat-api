import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PostMediaDto {
  @ApiProperty()
  url!: string;

  @ApiProperty()
  priority!: number;

  @ApiProperty()
  type!: string;

  @ApiPropertyOptional()
  text?: string;
}
