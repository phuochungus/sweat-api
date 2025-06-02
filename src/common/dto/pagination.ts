import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, Max, Min } from 'class-validator';

export class PageOptionsDto {
  @ApiPropertyOptional({
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly page?: number = 1;

  @ApiPropertyOptional({
    default: 10,
    description: 'maximum number of items per page',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly take?: number = 10;
}

export interface PageMetaDtoParameters {
  pageOptionsDto?: PageOptionsDto;
  itemCount?: number;
}

export class PageMetaDto {
  @ApiProperty()
  readonly page: number;

  @ApiProperty()
  readonly take: number;

  @ApiProperty()
  readonly itemCount: number;

  @ApiProperty()
  readonly pageCount: number;

  @ApiProperty()
  readonly hasPreviousPage: boolean;

  @ApiProperty()
  readonly hasNextPage: boolean;

  constructor({ pageOptionsDto = {}, itemCount = 0 }: PageMetaDtoParameters) {
    this.page = pageOptionsDto?.page || 1;
    this.take = pageOptionsDto?.take || 10;
    this.itemCount = itemCount || 0;
    this.pageCount = Math.ceil(this.itemCount / this.take);
    this.hasPreviousPage = this.page > 1;
    this.hasNextPage = this.page < this.pageCount;
  }
}

export class PageDto<T> {
  @IsArray()
  @ApiProperty({ isArray: true })
  readonly data: T[];

  @ApiProperty({ type: () => PageMetaDto })
  readonly meta: PageMetaDto;

  constructor(data: T[], meta?: PageMetaDto) {
    this.data = data;
    this.meta = meta || new PageMetaDto({});
  }
}
