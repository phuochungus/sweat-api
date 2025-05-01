import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsEnum, IsDate, IsString } from 'class-validator';
import { EventPrivacy } from 'src/common/enums';
import { GenericFilter } from 'src/common/generic/paginate';

export class FilterEventsDto extends GenericFilter {
  @ApiPropertyOptional({ description: 'Filter by creator user ID' })
  createdBy?: string;

  @ApiPropertyOptional({
    description: 'Filter by event privacy',
    enum: EventPrivacy,
  })
  @IsEnum(EventPrivacy)
  @IsOptional()
  privacy?: EventPrivacy;

  @ApiPropertyOptional({ description: 'Filter by location' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Filter events after this date' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fromDate?: Date;

  @ApiPropertyOptional({ description: 'Filter events before this date' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  toDate?: Date;

  @ApiPropertyOptional({
    description: 'Search query for event title/description',
  })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({
    description: 'Additional data to include (isParticipating)',
  })
  @IsString()
  @IsOptional()
  includes?: string;
}
