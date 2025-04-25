import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities';
import * as admin from 'firebase-admin';

@Injectable()
export class PushNotificationService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async registerDeviceToken(
    userId: number,
    deviceToken: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Initialize deviceTokens array if it doesn't exist
    if (!user.deviceTokens) {
      user.deviceTokens = [];
    }

    // Check if the token already exists
    if (!user.deviceTokens.includes(deviceToken)) {
      user.deviceTokens.push(deviceToken);
      await this.userRepository.save(user);
    }
  }

  async unregisterDeviceToken(
    userId: number,
    deviceToken: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (user && user.deviceTokens) {
      user.deviceTokens = user.deviceTokens.filter(
        (token) => token !== deviceToken,
      );
      await this.userRepository.save(user);
    }
  }

  async sendNotification(
    userId: number,
    title: string,
    body: string,
    data: any = {},
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.deviceTokens || user.deviceTokens.length === 0) {
      return;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data,
      tokens: user.deviceTokens,
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`Successfully sent ${response.successCount} messages`);

      // Remove invalid tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(user.deviceTokens[idx]);
          }
        });

        if (failedTokens.length > 0) {
          user.deviceTokens = user.deviceTokens.filter(
            (token) => !failedTokens.includes(token),
          );
          await this.userRepository.save(user);
        }
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}
