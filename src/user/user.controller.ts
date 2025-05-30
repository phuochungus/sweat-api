import {
  Controller,
  Body,
  Patch,
  UseGuards,
  BadRequestException,
  Get,
  Param,
  Query,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { GetUserProfileDto, UpdateUserDto } from './dto';
import { JwtGuard } from 'src/common/guards';
import { Auth, Public, User } from 'src/common/decorators';
import { FilterFriendsDto } from 'src/friend/dto/filter-friend.dto';
import { FriendService } from 'src/friend/friend.service';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Auth()
@UseGuards(JwtGuard)
@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly friendService: FriendService,
  ) {}

  @Get('/')
  async getAllUsers(
    @User('id') currentUserId: string,
    @Query() filterDto: FilterFriendsDto,
  ) {
    return this.userService.findAll(filterDto, { currentUserId });
  }

  @Patch('/:id/profile')
  async updateUserProfile(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    if (!id) {
      throw new BadRequestException('Id is required');
    }
    if (isNaN(+id)) {
      throw new BadRequestException('Id must be a number');
    }
    return this.userService.update(+id, updateUserDto);
  }

  @Get('/login')
  async getUser(@User() user) {
    return this.userService.findOne(user.id);
  }

  @Get('/:id/friends')
  async getFriends(
    @User('id') currentUserId: string,
    @Param('id') userId: string,
    @Query() filterDto: FilterFriendsDto,
  ) {
    return this.friendService.getFriends(filterDto, {
      currentUserId,
      userId,
    });
  }

  @Delete('/:id/friend')
  async unfriend(
    @User('id') currentUserId: string,
    @Param('id', ParseIntPipe) userId: number,
  ) {
    return this.friendService.unfriend({
      currentUserId,
      userId,
    });
  }

  @Get('/:id/friend-suggestion')
  async getFriendSuggestions(@Param('id') userId: string) {
    if (!userId) {
      throw new BadRequestException('User Id is required');
    }
    if (isNaN(+userId)) {
      throw new BadRequestException('User Id must be a number');
    }
    return this.friendService.getSuggestions({ userId: +userId });
  }

  /**
   * Get a user's profile by Firebase ID
   *
   * Retrieves detailed information about a user by their Firebase ID, including personal details and friendship status if
   * requested by an authenticated user
   *
   * @param currentUserId - ID of the currently authenticated user
   * @param firebaseId - Firebase ID of the user whose profile is being requested
   * @returns The user profile information
   */
  @Get('/firebase-id/:firebaseId')
  @ApiOperation({ summary: 'Get user profile by Firebase ID' })
  @ApiParam({
    name: 'firebaseId',
    description: 'User Firebase ID',
    example: 'abc123def456',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: GetUserProfileDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfileByFirebaseId(
    @User('id') currentUserId: string,
    @Param('firebaseId') firebaseId: string,
  ) {
    if (!firebaseId) {
      throw new BadRequestException('Firebase ID is required');
    }
    return this.userService.getUserProfileByFirebaseId(
      firebaseId,
      currentUserId ? +currentUserId : undefined,
    );
  }

  /**
   * Get a user's profile by ID
   *
   * Retrieves detailed information about a user, including personal details and friendship status if
   * requested by an authenticated user
   *
   * @param currentUserId - ID of the currently authenticated user
   * @param userId - ID of the user whose profile is being requested
   * @returns The user profile information
   */
  @Get('/:id')
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiParam({ name: 'id', description: 'User ID', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: GetUserProfileDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfile(
    @User('id') currentUserId: string,
    @Param('id') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('User Id is required');
    }
    if (isNaN(+userId)) {
      throw new BadRequestException('User Id must be a number');
    }
    return this.userService.getUserProfile(
      +userId,
      currentUserId ? +currentUserId : undefined,
    );
  }

  /**
   * Delete a user's account (soft delete)
   *
   * Marks a user account as deleted by setting the deletedAt timestamp
   *
   * @param currentUserId - ID of the currently authenticated user
   * @param userId - ID of the user whose account is being deleted
   * @returns Confirmation message
   */
  @Delete('/')
  @ApiOperation({ summary: 'Delete user account' })
  @ApiResponse({
    status: 200,
    description: 'User account deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Cannot delete another user's account",
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@User('id') currentUserId: string) {
    return this.userService.softDelete(+currentUserId);
  }

  @Public()
  @Get('/:id/firebase-token')
  @ApiOperation({ summary: 'Generate Firebase ID token (development only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Token generated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden in production' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async generateFirebaseToken(@Param('id') userId: number) {
    const token = await this.userService.generateFirebaseToken(userId);
    return token;
  }
}
