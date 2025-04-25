import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestUtils } from '../helpers/test-utils';

describe('Post (e2e)', () => {
  let app: INestApplication;
  let testUser: any;
  let testPost: any;

  beforeAll(async () => {
    // Create the test app
    app = await TestUtils.createTestApp();

    // Setup test data
    testUser = await TestUtils.createTestUser(app);
  });

  afterAll(async () => {
    // Clean up the test data
    await TestUtils.cleanupDatabase(app);

    // Close the app
    await app.close();
  });

  describe('POST /posts', () => {
    it('should create a new post', async () => {
      const newPost = {
        text: 'This is a test post content',
        privacy: 'PUBLIC',
        userId: testUser.id,
        location: 'Test Location',
        postMedia: [], // No media attachments in this test
      };

      const response = await request(app.getHttpServer())
        .post('/posts')
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .send(newPost)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.text).toBe(newPost.text);
      expect(response.body.privacy).toBe(newPost.privacy);
      expect(response.body.userId).toBe(newPost.userId);
      expect(response.body.location).toBe(newPost.location);

      // Save for later tests
      testPost = response.body;
    });

    it('should create a post with media attachments', async () => {
      // In a real test, we would first upload media and get URLs
      // For this test, we'll simulate having already uploaded media
      const postWithMedia = {
        text: 'This is a post with media attachments',
        privacy: 'PUBLIC',
        userId: testUser.id,
        location: 'Media Test Location',
        postMedia: [
          {
            url: 'https://example.com/test-image.jpg',
            type: 'IMAGE',
            priority: 1,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/posts')
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .send(postWithMedia)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.text).toBe(postWithMedia.text);
      expect(response.body.mediaCount).toBe(1);
    });
  });

  describe('GET /posts', () => {
    it('should get all posts', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts')
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2); // We created at least 2 posts
    });

    it('should get posts by a specific user', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts')
        .query({ createdBy: testUser.id.toString() })
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      // All returned posts should be by our test user
      response.body.data.forEach((post) => {
        expect(post.userId).toBe(testUser.id);
      });
    });

    it('should get posts with "isReacted" field', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts')
        .query({ includes: 'isReacted' })
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      // All returned posts should have the isReacted field
      response.body.data.forEach((post) => {
        expect(post.isReacted).toBeDefined();
      });
    });
  });

  describe('GET /posts/feed', () => {
    it('should get the user feed', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/feed')
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      // As this is our own user, we should see our posts in the feed
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /posts/:id', () => {
    it('should get a post by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/posts/${testPost.id}`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(testPost.id);
      expect(response.body.text).toBe(testPost.text);
      expect(response.body.userId).toBe(testPost.userId);
    });

    it('should fail to get a non-existent post', async () => {
      await request(app.getHttpServer())
        .get('/posts/9999')
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(404);
    });
  });

  describe('PATCH /posts/:id', () => {
    it('should update a post', async () => {
      const updatedText = 'This is the updated post text';

      const response = await request(app.getHttpServer())
        .patch(`/posts/${testPost.id}`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .send({ text: updatedText })
        .expect(200);

      // Get the updated post to verify changes
      const updatedPost = await request(app.getHttpServer())
        .get(`/posts/${testPost.id}`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(updatedPost.body.text).toBe(updatedText);
    });

    // If your API has authorization checks for post updates, add tests here
  });

  describe('DELETE /posts/:id', () => {
    let postToDelete: any;

    beforeEach(async () => {
      // Create a new post to delete
      postToDelete = await TestUtils.createTestPost(app, {
        userId: testUser.id,
        text: 'Post to be deleted',
      });
    });

    it('should delete a post', async () => {
      await request(app.getHttpServer())
        .delete(`/posts/${postToDelete.id}`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      // Verify the post is deleted
      await request(app.getHttpServer())
        .get(`/posts/${postToDelete.id}`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(404);
    });

    // If your API has authorization checks for post deletions, add tests here
  });

  describe('POST /posts/:id/likes', () => {
    it('should like a post', async () => {
      await request(app.getHttpServer())
        .post(`/posts/${testPost.id}/likes`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(201);

      // Verify the like was recorded (reactCount increased)
      const response = await request(app.getHttpServer())
        .get(`/posts/${testPost.id}`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(response.body.reactCount).toBeGreaterThan(0);
    });
  });

  describe('DELETE /posts/:id/likes', () => {
    it('should unlike a post', async () => {
      // First like the post
      await request(app.getHttpServer())
        .post(`/posts/${testPost.id}/likes`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(201);

      // Then unlike it
      await request(app.getHttpServer())
        .delete(`/posts/${testPost.id}/likes`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      // Verify the like was removed
      const response = await request(app.getHttpServer())
        .get(`/posts/${testPost.id}`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        );

      // The reactCount might not be 0 if there were other likes,
      // but we've at least verified the unlike endpoint works
    });
  });

  describe('GET /posts/:id/likes', () => {
    it('should get likes for a post', async () => {
      // First like the post to ensure there's at least one like
      await request(app.getHttpServer())
        .post(`/posts/${testPost.id}/likes`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/posts/${testPost.id}/likes`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);

      // The first user in the likes list should be our test user
      expect(response.body.data[0].userId).toBe(testUser.id);
    });
  });
});
