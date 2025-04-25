import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { getTestDataSource } from '../setup-e2e';
import * as jwt from 'jsonwebtoken';
import testConfig from '../../../src/config/test-configuration';

/**
 * Utility class for e2e testing
 */
export class TestUtils {
  private static dataSource: DataSource;

  /**
   * Create a test application
   */
  static async createTestApp(): Promise<INestApplication> {
    // Override NODE_ENV to ensure test config is used
    process.env.NODE_ENV = 'test';

    // Create and configure the testing module with our test configuration
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    await app.init();

    // Store a reference to the data source for reuse
    if (!this.dataSource || !this.dataSource.isInitialized) {
      try {
        this.dataSource = app.get(DataSource);
      } catch (error) {
        console.warn(
          'DataSource not available in app context, creating a new one',
        );
        this.dataSource = getTestDataSource();
        await this.dataSource.initialize();

        // Add the DataSource to the app as a custom provider so it can be injected
        app['applicationConfig'].setGlobalPrefix =
          app['applicationConfig'].getGlobalPrefix;
        app['applicationConfig'].globalProviders =
          app['applicationConfig'].globalProviders || new Map();
        app['applicationConfig'].globalProviders.set('DataSource', {
          instance: this.dataSource,
          token: 'DataSource',
        });
      }
    }

    return app;
  }

  /**
   * Mock Firebase authentication token
   * For testing purposes, using the format expected by the auth service
   */
  static getMockAuthToken(userId: number = 1): string {
    // The auth service expects tokens in the format "test_token_{userId}" for test mode
    return `test_token_${userId}`;
  }

  /**
   * Get the DataSource instance for direct database operations
   */
  static async getDataSource(app?: INestApplication): Promise<DataSource> {
    if (app) {
      try {
        return app.get(DataSource);
      } catch (error) {
        console.warn('DataSource not available in app context');
      }
    }

    if (!this.dataSource || !this.dataSource.isInitialized) {
      this.dataSource = getTestDataSource();
      await this.dataSource.initialize();
    }

    return this.dataSource;
  }

  /**
   * Clear test data after tests
   */
  static async cleanupDatabase(app: INestApplication): Promise<void> {
    const dataSource = await this.getDataSource(app);
    await dataSource.query('DELETE FROM "post_react"');
    await dataSource.query('DELETE FROM "post_comment"');
    await dataSource.query('DELETE FROM "post_media"');
    await dataSource.query('DELETE FROM "post"');
    await dataSource.query('DELETE FROM "user_notification"');
    await dataSource.query('DELETE FROM "user_friend_request"');
    await dataSource.query('DELETE FROM "user_friend"');
    await dataSource.query('DELETE FROM "user_setting"');
    // Don't delete users as we could have foreign key constraints
    // If needed, this should be the last deletion
    // await dataSource.query('DELETE FROM "user"');
  }

  /**
   * Create test data for a user
   */
  static async createTestUser(
    app: INestApplication,
    userData: any = {},
  ): Promise<any> {
    const dataSource = await this.getDataSource(app);

    // Generate a properly formatted firebaseId if not provided
    // This ensures the firebaseId matches what JwtGuard expects for test tokens
    if (!userData.firebaseId && userData.id) {
      userData.firebaseId = `test_firebase_id_${userData.id}`;
    } else if (!userData.firebaseId) {
      userData.firebaseId = 'test_firebase_id';
    }

    const defaultData = {
      fullname: 'Test User',
      avatarUrl: 'https://example.com/avatar.jpg',
      coverUrl: 'https://example.com/cover.jpg',
      bio: 'Test user bio',
      birthday: new Date('1990-01-01'),
      gender: 'MALE',
      firebaseId: userData.firebaseId,
      friendCount: 0,
    };

    const data = { ...defaultData, ...userData };

    const result = await dataSource.query(
      `
      INSERT INTO "user" (
        "fullname", "avatarUrl", "coverUrl", "bio", "birthday", "gender", "firebaseId", "friendCount"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      ) RETURNING *
    `,
      [
        data.fullname,
        data.avatarUrl,
        data.coverUrl,
        data.bio,
        data.birthday,
        data.gender,
        data.firebaseId,
        data.friendCount,
      ],
    );

    return result[0];
  }

  /**
   * Create a test post
   */
  static async createTestPost(
    app: INestApplication,
    postData: any = {},
  ): Promise<any> {
    const dataSource = await this.getDataSource(app);
    const defaultData = {
      text: 'Test post content',
      privacy: 'PUBLIC',
      userId: 1,
      location: 'Test Location',
    };

    const data = { ...defaultData, ...postData };

    const result = await dataSource.query(
      `
      INSERT INTO "post" (
        "text", "privacy", "userId", "location"
      ) VALUES (
        $1, $2, $3, $4
      ) RETURNING *
    `,
      [data.text, data.privacy, data.userId, data.location],
    );

    return result[0];
  }

  /**
   * Create a test comment
   */
  static async createTestComment(
    app: INestApplication,
    commentData: any = {},
  ): Promise<any> {
    const dataSource = await this.getDataSource(app);
    const defaultData = {
      userId: 1,
      postId: 1,
      text: 'Test comment',
      replyCommentId: null,
    };

    const data = { ...defaultData, ...commentData };

    const result = await dataSource.query(
      `
      INSERT INTO "post_comment" (
        "userId", "postId", "text", "replyCommentId"
      ) VALUES (
        $1, $2, $3, $4
      ) RETURNING *
    `,
      [data.userId, data.postId, data.text, data.replyCommentId],
    );

    return result[0];
  }
}
