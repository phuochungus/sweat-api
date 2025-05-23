import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AuthService {
  private isTestMode: boolean;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.isTestMode = this.configService.get('environment') === 'test';
  }

  async verifyTokenAndGetUser(token: string): Promise<User> {
    try {
      // Check cache first
      const cachedUser = await this.cacheManager.get<User>(
        `auth_token:${token}`,
      );
      if (cachedUser) {
        console.log('Using cached user data for token');
        return cachedUser;
      }

      let firebaseId: string;
      let displayName: string;
      let photoURL: string;

      if (this.isTestMode && token.startsWith('test_token_')) {
        // In test mode, parse user info from the token for easier testing
        const parts = token.split('_');
        firebaseId = `test_firebase_id_${parts[parts.length - 1]}`;
        displayName = `Test User ${parts[parts.length - 1]}`;
        photoURL = null;
      } else {
        // Check if decoded token is in cache
        const cachedDecodedToken = await this.cacheManager.get(
          `decoded_token:${token}`,
        );
        if (cachedDecodedToken) {
          firebaseId = cachedDecodedToken as string;
        } else {
          // Verify the Firebase token
          const decodedToken = await admin.auth().verifyIdToken(token);
          firebaseId = decodedToken.uid;
          let exp = decodedToken.exp;
          let cachedKeyTTL = exp - Date.now() / 1000;

          // Cache the decoded token for future use (shorter TTL than the full user)
          await this.cacheManager.set(
            `decoded_token:${token}`,
            firebaseId,
            cachedKeyTTL * 1000,
          );
        }

        // Get user details from Firebase
        const firebaseUser = await admin.auth().getUser(firebaseId);
        displayName = firebaseUser.displayName || 'New User';
        photoURL = firebaseUser.photoURL;
      }

      // Find existing user or create a new one
      let user = await this.userRepository.findOne({
        where: { firebaseId },
      });

      if (!user) {
        // Create a new user if they don't exist yet
        user = this.userRepository.create({
          firebaseId,
          fullname: displayName,
          avatarUrl: photoURL,
        });

        await this.userRepository.save(user);
      }

      // Cache the user object
      await this.cacheManager.set(`auth_token:${token}`, user, 3600); // 1 hour cache
      await this.cacheManager.set(`user_id:${firebaseId}`, user, 3600); // Cache by firebase ID too

      return user;
    } catch (error) {
      console.error('Error verifying token:', error);
      throw new UnauthorizedException('Invalid token or authentication failed');
    }
  }

  async getUserByFirebaseId(firebaseId: string): Promise<User | null> {
    // Check cache first
    const cachedUser = await this.cacheManager.get<User>(
      `user_id:${firebaseId}`,
    );
    if (cachedUser) {
      return cachedUser;
    }

    // Fetch from database if not in cache
    const user = await this.userRepository.findOne({
      where: { firebaseId },
    });

    if (user) {
      // Cache the result
      await this.cacheManager.set(`user_id:${firebaseId}`, user, 3600); // 1 hour cache
    }

    return user;
  }
}
