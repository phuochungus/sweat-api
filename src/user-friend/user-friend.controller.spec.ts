import { Test, TestingModule } from '@nestjs/testing';
import { UserFriendController } from './user-friend.controller';
import { UserFriendService } from './user-friend.service';

describe('UserFriendController', () => {
  let controller: UserFriendController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserFriendController],
      providers: [UserFriendService],
    }).compile();

    controller = module.get<UserFriendController>(UserFriendController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
