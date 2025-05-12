import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { JwtGuard } from '../../src/common/guards';
import { UserService } from '../../src/user/user.service';
import { GetUserProfileDto } from '../../src/user/dto';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  const mockUser = {
    id: 1,
    fullname: 'Test User',
    avatarUrl: 'https://example.com/avatar.jpg',
    bio: 'Test bio',
    friendCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const mockUserService = {
    getUserProfile: jest.fn().mockImplementation((userId) => {
      if (userId === 1) {
        return mockUser;
      }
      throw new Error('User not found');
    }),
  };
  
  // Mock JwtGuard to always pass authentication
  const mockJwtGuard = {
    canActivate: jest.fn().mockImplementation(() => true),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtGuard)
      .useValue(mockJwtGuard)
      .overrideProvider(UserService)
      .useValue(mockUserService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users/1 (GET) - should return user profile', () => {
    return request(app.getHttpServer())
      .get('/users/1')
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe(mockUser.id);
        expect(res.body.fullname).toBe(mockUser.fullname);
        expect(res.body.avatarUrl).toBe(mockUser.avatarUrl);
        expect(res.body.bio).toBe(mockUser.bio);
        expect(res.body.friendCount).toBe(mockUser.friendCount);
      });
  });

  it('/users/999 (GET) - should return 404 for non-existent user', () => {
    mockUserService.getUserProfile.mockImplementationOnce(() => {
      throw { status: 404, message: 'User not found' };
    });
    
    return request(app.getHttpServer())
      .get('/users/999')
      .expect(404);
  });
});
