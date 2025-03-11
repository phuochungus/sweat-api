import { Test, TestingModule } from '@nestjs/testing';
import { UserFriendService } from './user-friend.service';

describe('UserFriendService', () => {
  let service: UserFriendService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserFriendService],
    }).compile();

    service = module.get<UserFriendService>(UserFriendService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
