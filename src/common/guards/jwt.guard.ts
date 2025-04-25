import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { UserGender } from 'src/common/enums';

@Injectable()
export class JwtGuard implements CanActivate {
  private isTestMode: boolean;

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    const environment = this.configService.get('environment');
    this.isTestMode = environment === 'test';
    console.log(
      `JwtGuard initialized with environment: ${environment}, isTestMode: ${this.isTestMode}`,
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Bearer token is missing');
    }

    try {
      let userId: string;

      // Log token info for debugging
      console.log(
        `Token received: ${token.substring(0, 10)}... isTestMode: ${this.isTestMode}`,
      );

      // Special handling for test tokens
      if (this.isTestMode && token.startsWith('test_token_')) {
        console.log('Processing test token...');
        // In test mode, extract user firebaseId from the token
        const parts = token.split('_');
        const testUserId = parts[parts.length - 1];
        userId = `test_firebase_id_${testUserId}`;

        // For test users with no id suffix, use a default
        if (userId === 'test_firebase_id_') {
          userId = 'test_firebase_id';
        }

        console.log(`Test token parsed. Using firebaseId: ${userId}`);
      } else {
        // Normal firebase token verification
        console.log('Verifying Firebase token...');
        const decodedToken = await admin.auth().verifyIdToken(token);
        userId = decodedToken.uid;
        console.log(`Firebase token verified. UID: ${userId}`);
      }

      // Find user in our database based on Firebase ID
      let user = await this.userRepository.findOne({
        where: { firebaseId: userId },
      });

      if (!user) {
        console.log(
          `User not found with firebaseId: ${userId}. Creating a new user...`,
        );

        // For test mode, create a new user with test data
        if (this.isTestMode) {
          const userIdNumber = userId.includes('_')
            ? parseInt(userId.split('_').pop())
            : 1;
          user = this.userRepository.create({
            firebaseId: userId,
            fullname: `Test User ${userIdNumber}`,
            avatarUrl: 'https://example.com/avatar.jpg',
            coverUrl: 'https://example.com/cover.jpg',
            bio: 'Auto-created test user',
            birthday: new Date('1990-01-01'),
            gender: UserGender.MALE,
            friendCount: 0,
          });
        } else {
          // For production, get user details from Firebase if possible
          try {
            const firebaseUser = await admin.auth().getUser(userId);
            user = this.userRepository.create({
              firebaseId: userId,
              fullname: firebaseUser.displayName || 'New User',
              avatarUrl: firebaseUser.photoURL,
            });
          } catch (error) {
            // If Firebase user details can't be retrieved, create with minimal info
            user = this.userRepository.create({
              firebaseId: userId,
              fullname: 'New User',
            });
          }
        }

        await this.userRepository.save(user);
        console.log(`Created new user with ID: ${user.id}`);
      } else {
        console.log(`User found: ${user.id} (${user.firebaseId})`);
      }

      // Attach user to request for use in controllers
      request.user = user;
      return true;
    } catch (error) {
      console.error('Authentication error in JwtGuard:', error);
      throw new UnauthorizedException('Invalid token or session expired');
    }
  }
}
