import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestUtils } from '../helpers/test-utils';

describe('PostComment (e2e)', () => {
  let app: INestApplication;
  let testUser: any;
  let testPost: any;
  let testComment: any;

  beforeAll(async () => {
    // Create the test app
    app = await TestUtils.createTestApp();

    // Setup test data
    testUser = await TestUtils.createTestUser(app);
    testPost = await TestUtils.createTestPost(app, { userId: testUser.id });
  });

  afterAll(async () => {
    // Clean up the test data
    await TestUtils.cleanupDatabase(app);

    // Close the app
    await app.close();
  });

  describe('POST /post-comments', () => {
    it('should create a new comment', async () => {
      const newComment = {
        postId: testPost.id,
        text: 'This is a test comment',
      };

      const response = await request(app.getHttpServer())
        .post('/post-comments')
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .send(newComment)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.postId).toBe(newComment.postId);
      expect(response.body.text).toBe(newComment.text);
      expect(response.body.userId).toBe(testUser.id);

      // Save for later tests
      testComment = response.body;
    });

    it('should create a reply to a comment', async () => {
      const replyComment = {
        postId: testPost.id,
        text: 'This is a test reply comment',
        replyCommentId: testComment.id,
      };

      const response = await request(app.getHttpServer())
        .post('/post-comments')
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .send(replyComment)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.postId).toBe(replyComment.postId);
      expect(response.body.text).toBe(replyComment.text);
      expect(response.body.userId).toBe(testUser.id);
      expect(response.body.replyCommentId).toBe(replyComment.replyCommentId);
    });

    it('should fail to create a comment for non-existent post', async () => {
      const invalidComment = {
        postId: 9999, // Non-existent post ID
        text: 'This comment should fail',
      };

      await request(app.getHttpServer())
        .post('/post-comments')
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .send(invalidComment)
        .expect(404);
    });
  });

  describe('GET /post-comments', () => {
    it('should get all comments for a post', async () => {
      const response = await request(app.getHttpServer())
        .get('/post-comments')
        .query({ postId: testPost.id })
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should get top-level comments only', async () => {
      const response = await request(app.getHttpServer())
        .get('/post-comments')
        .query({
          postId: testPost.id,
          replyCommentId: null, // Explicitly requesting top-level comments
        })
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      // All returned comments should be top-level (replyCommentId is null)
      response.body.data.forEach((comment) => {
        expect(comment.replyCommentId).toBeNull();
      });
    });

    it('should get replies for a comment', async () => {
      const response = await request(app.getHttpServer())
        .get('/post-comments')
        .query({
          postId: testPost.id,
          replyCommentId: testComment.id, // Get replies to our test comment
        })
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      // All returned comments should be replies to our test comment
      response.body.data.forEach((comment) => {
        expect(comment.replyCommentId).toBe(testComment.id);
      });
    });
  });

  describe('GET /post-comments/:id', () => {
    it('should get a comment by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/post-comments/${testComment.id}`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(testComment.id);
      expect(response.body.text).toBe(testComment.text);
      expect(response.body.postId).toBe(testComment.postId);
    });

    it('should fail to get a non-existent comment', async () => {
      await request(app.getHttpServer())
        .get('/post-comments/9999')
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(404);
    });
  });

  describe('PATCH /post-comments/:id', () => {
    it('should update a comment', async () => {
      const updatedText = 'This is the updated comment text';

      const response = await request(app.getHttpServer())
        .patch(`/post-comments/${testComment.id}`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .send({ text: updatedText })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(testComment.id);
      expect(response.body.text).toBe(updatedText);
    });

    it('should fail to update a comment by another user', async () => {
      const anotherUser = await TestUtils.createTestUser(app, {
        fullname: 'Another User',
        firebaseId: 'another_firebase_id',
      });

      await request(app.getHttpServer())
        .patch(`/post-comments/${testComment.id}`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(anotherUser.id)}`,
        )
        .send({ text: 'This should fail' })
        .expect(404); // API returns 404 for unauthorized updates
    });
  });

  describe('DELETE /post-comments/:id', () => {
    let commentToDelete: any;

    beforeEach(async () => {
      // Create a new comment to delete
      commentToDelete = await TestUtils.createTestComment(app, {
        userId: testUser.id,
        postId: testPost.id,
        text: 'Comment to be deleted',
      });
    });

    it('should delete a comment', async () => {
      await request(app.getHttpServer())
        .delete(`/post-comments/${commentToDelete.id}`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      // Verify the comment is deleted
      await request(app.getHttpServer())
        .get(`/post-comments/${commentToDelete.id}`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(404);
    });

    it('should fail to delete a comment by another user', async () => {
      const anotherUser = await TestUtils.createTestUser(app, {
        fullname: 'Yet Another User',
        firebaseId: 'yet_another_firebase_id',
      });

      await request(app.getHttpServer())
        .delete(`/post-comments/${testComment.id}`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(anotherUser.id)}`,
        )
        .expect(404); // API returns 404 for unauthorized deletions
    });
  });
});
