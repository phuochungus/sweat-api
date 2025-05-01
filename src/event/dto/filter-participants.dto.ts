import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ParticipantStatus } from 'src/common/enums';
import { GenericFilter } from 'src/common/generic/paginate';

export class FilterParticipantsDto extends GenericFilter {
  @ApiPropertyOptional({ enum: ParticipantStatus })
  @IsEnum(ParticipantStatus)
  @IsOptional()
  status?: ParticipantStatus;
}
