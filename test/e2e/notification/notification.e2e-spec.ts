import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestUtils } from '../helpers/test-utils';
import { NotificationStatus } from '../../../src/common/enums';

describe('Notification (e2e)', () => {
  let app: INestApplication;
  let testUser: any;
  let testNotification: any;
  let testDeviceToken: string;

  beforeAll(async () => {
    // Create the test app
    app = await TestUtils.createTestApp();

    // Setup test user
    testUser = await TestUtils.createTestUser(app);

    // Create test notification directly in the database
    const dataSource = app.get('DataSource');
    const result = await dataSource.query(
      `
      INSERT INTO "user_notification" (
        "receiverUserId", "senderUserId", "text", "status", "type"
      ) VALUES ($1, $2, $3, $4, $5) RETURNING *
    `,
      [
        testUser.id,
        testUser.id, // Self-notification for testing
        'Test notification message',
        NotificationStatus.UNREAD,
        'TEST_NOTIFICATION',
      ],
    );

    testNotification = result[0];

    // Generate a test device token
    testDeviceToken = `test_device_token_${Date.now()}`;
  });

  afterAll(async () => {
    // Clean up the test data
    await TestUtils.cleanupDatabase(app);

    // Close the app
    await app.close();
  });

  describe('GET /user-notification', () => {
    it('should get all notifications for the authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/user-notification')
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);

      // Verify our test notification is in the result
      const foundNotification = response.body.data.find(
        (n) => n.id === testNotification.id,
      );
      expect(foundNotification).toBeDefined();
    });

    it('should filter notifications by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/user-notification')
        .query({ status: NotificationStatus.UNREAD })
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      // All returned notifications should have UNREAD status
      response.body.data.forEach((notification) => {
        expect(notification.status).toBe(NotificationStatus.UNREAD);
      });
    });

    it('should include unreadCount in response', async () => {
      const response = await request(app.getHttpServer())
        .get('/user-notification')
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.unreadCount).toBeDefined();
      expect(typeof response.body.unreadCount).toBe('number');
      expect(response.body.unreadCount).toBeGreaterThanOrEqual(1);
    });

    it('should support pagination', async () => {
      // Test page 1 with limit of 1
      const page1Response = await request(app.getHttpServer())
        .get('/user-notification')
        .query({ page: 1, take: 1 })
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(page1Response.body.data).toBeDefined();
      expect(Array.isArray(page1Response.body.data)).toBe(true);
      expect(page1Response.body.data.length).toBeLessThanOrEqual(1);

      // Meta object should include pagination info
      expect(page1Response.body.meta).toBeDefined();
      expect(page1Response.body.meta.itemCount).toBeDefined();
      expect(page1Response.body.meta.totalPages).toBeDefined();
    });
  });

  describe('PATCH /user-notification', () => {
    it('should batch update notification status', async () => {
      const updateDto = {
        ids: [testNotification.id],
        status: NotificationStatus.READ,
      };

      const response = await request(app.getHttpServer())
        .patch('/user-notification')
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .send(updateDto)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.updated).toBe(true);

      // Verify the notification status was changed
      const getResponse = await request(app.getHttpServer())
        .get('/user-notification')
        .query({ status: NotificationStatus.READ })
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      const updatedNotification = getResponse.body.data.find(
        (n) => n.id === testNotification.id,
      );
      expect(updatedNotification).toBeDefined();
      expect(updatedNotification.status).toBe(NotificationStatus.READ);
    });

    it('should not update notifications for other users', async () => {
      // Create another user
      const anotherUser = await TestUtils.createTestUser(app, {
        fullname: 'Another Notification User',
        firebaseId: 'another_notification_user_id',
      });

      // Create a notification for the other user
      const dataSource = app.get('DataSource');
      const result = await dataSource.query(
        `
        INSERT INTO "user_notification" (
          "receiverUserId", "senderUserId", "text", "status", "type"
        ) VALUES ($1, $2, $3, $4, $5) RETURNING *
      `,
        [
          anotherUser.id,
          testUser.id,
          'Notification for another user',
          NotificationStatus.UNREAD,
          'TEST_NOTIFICATION',
        ],
      );

      const otherUserNotification = result[0];

      // First user tries to update the other user's notification
      const updateDto = {
        ids: [otherUserNotification.id],
        status: NotificationStatus.READ,
      };

      await request(app.getHttpServer())
        .patch('/user-notification')
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .send(updateDto)
        .expect(200); // The API might return 200 even if no rows were actually updated

      // Verify the notification status was NOT changed (still UNREAD)
      const dataSource2 = app.get('DataSource');
      const checkResult = await dataSource2.query(
        `
        SELECT * FROM "user_notification" WHERE "id" = $1
      `,
        [otherUserNotification.id],
      );

      expect(checkResult[0].status).toBe(NotificationStatus.UNREAD);
    });
  });

  describe('POST /user-notification/device-token', () => {
    it('should register a device token for push notifications', async () => {
      const deviceTokenDto = {
        token: testDeviceToken,
      };

      const response = await request(app.getHttpServer())
        .post('/user-notification/device-token')
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .send(deviceTokenDto)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('registered successfully');
    });
  });

  describe('DELETE /user-notification/device-token', () => {
    it('should unregister a device token', async () => {
      const deviceTokenDto = {
        token: testDeviceToken,
      };

      const response = await request(app.getHttpServer())
        .delete('/user-notification/device-token')
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .send(deviceTokenDto)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('unregistered successfully');
    });
  });
});
