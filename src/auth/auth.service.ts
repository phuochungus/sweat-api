import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private isTestMode: boolean;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    this.isTestMode = this.configService.get('environment') === 'test';
  }

  async verifyTokenAndGetUser(token: string): Promise<User> {
    try {
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
        // Verify the Firebase token in normal mode
        const decodedToken = await admin.auth().verifyIdToken(token);
        firebaseId = decodedToken.uid;
        
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

      return user;
    } catch (error) {
      console.error('Error verifying token:', error);
      throw new UnauthorizedException('Invalid token or authentication failed');
    }
  }
}