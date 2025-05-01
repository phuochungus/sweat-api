import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EventCommentService } from './event-comment.service';
import {
  CreateEventCommentDto,
  UpdateEventCommentDto,
  FilterEventCommentDto,
} from './dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth, User } from 'src/common/decorators';
import { JwtGuard } from 'src/common/guards';
import { PageDto } from 'src/common/dto';

@ApiTags('event comments')
@Controller('event-comments')
@Auth()
@UseGuards(JwtGuard)
export class EventCommentController {
  constructor(private readonly eventCommentService: EventCommentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a comment on an event' })
  @ApiResponse({
    status: 201,
    description: 'The comment has been successfully created',
  })
  create(
    @User('id') currentUserId: number,
    @Body() createEventCommentDto: CreateEventCommentDto,
  ) {
    return this.eventCommentService.create(createEventCommentDto, {
      currentUserId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Find all comments with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns comments according to specified filters',
    type: PageDto,
  })
  findAll(
    @User('id') currentUserId: number,
    @Query() filterEventCommentDto: FilterEventCommentDto,
  ) {
    return this.eventCommentService.findAll(filterEventCommentDto, {
      currentUserId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one comment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the specified comment',
  })
  findOne(@Param('id') id: string) {
    return this.eventCommentService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiResponse({
    status: 200,
    description: 'The comment has been successfully updated',
  })
  update(
    @User('id') currentUserId: number,
    @Param('id') id: string,
    @Body() updateEventCommentDto: UpdateEventCommentDto,
  ) {
    return this.eventCommentService.update(+id, updateEventCommentDto, {
      currentUserId,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({
    status: 200,
    description: 'The comment has been successfully deleted',
  })
  remove(@User('id') currentUserId: number, @Param('id') id: string) {
    return this.eventCommentService.remove(+id, { currentUserId });
  }
}
