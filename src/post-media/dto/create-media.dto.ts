import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { MIME_TYPE } from 'src/common/enums';

export class mediasDto {
  @ApiPropertyOptional()
  mediaUrl?: string;

  @ApiPropertyOptional()
  priority?: number;

  @IsOptional()
  @IsEnum(MIME_TYPE)
  mimeType?: MIME_TYPE;

  @ApiPropertyOptional()
  fileName?: string;

  @ApiPropertyOptional()
  thumbnail?: string;
}
