import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { auth } from 'firebase-admin';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.userRepository.update(id, updateUserDto);
    return this.userRepository.findOne({
      where: { id },
    });
  }

  /**
   * Generates a Firebase ID token for a user
   * This is primarily for development purposes
   * @param userId - The ID of the user to generate a token for
   * @returns A Firebase ID token
   */
  async generateFirebaseToken(userId: number): Promise<string> {
    let user: { firebaseId?: string } = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.firebaseId) {
      throw new BadRequestException('User not found or Firebase ID not set');
    }

    const customToken = await auth().createCustomToken(user.firebaseId);
    // Exchange custom token for ID token using Firebase Auth REST API
    const response = await fetch(
      `https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyCustomToken?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Firebase token exchange failed: ${JSON.stringify(errorData)}`,
      );
    }

    const data = await response.json();
    return data.idToken as string;
  }
}
