import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { ParticipantStatus } from 'src/common/enums';

export class EventParticipantDto {
  @ApiProperty({ description: 'Event ID' })
  @IsNumber()
  @IsNotEmpty()
  eventId: number;

  @ApiProperty({ description: 'User ID' })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ enum: ParticipantStatus, default: ParticipantStatus.GOING })
  @IsEnum(ParticipantStatus)
  status: ParticipantStatus;
}
