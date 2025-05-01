import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestUtils } from '../helpers/test-utils';
import { EventPrivacy, ParticipantStatus } from '../../../src/common/enums';

describe('Event (e2e)', () => {
  let app: INestApplication;
  let testUser: any;
  let secondUser: any;
  let testEvent: any;

  beforeAll(async () => {
    // Create the test app
    app = await TestUtils.createTestApp();

    // Setup test users
    testUser = await TestUtils.createTestUser(app, {
      id: 300,
      fullname: 'Event Test User',
    });

    secondUser = await TestUtils.createTestUser(app, {
      id: 301,
      fullname: 'Event Participant User',
    });
  });

  beforeEach(async () => {
    // Ensure testEvent is initialized before each test
    testEvent = await TestUtils.createTestEvent(app, {
      title: 'Test Event',
      description: 'This is a test event description',
      location: 'Test Location',
      startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      endTime: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
      creatorId: testUser.id,
      privacy: EventPrivacy.PUBLIC,
    });
  });

  afterAll(async () => {
    // Clean up the test data
    await TestUtils.cleanupDatabase(app);
    await app.close();
  });

  describe('POST /events', () => {
    it('should create a new event', async () => {
      const newEvent = {
        title: 'Test Event',
        description: 'This is a test event description',
        location: 'Test Location',
        startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        endTime: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
        creatorId: testUser.id,
        privacy: EventPrivacy.PUBLIC,
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .send(newEvent)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.title).toBe(newEvent.title);
      expect(response.body.description).toBe(newEvent.description);
      expect(response.body.creatorId).toBe(testUser.id);

      // Save for later tests
      testEvent = response.body;
    });

    it('should create an event with cover image', async () => {
      const eventWithCover = {
        title: 'Event With Cover',
        description: 'This event has a cover image',
        location: 'Cover Image Test Location',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        creatorId: testUser.id,
        privacy: EventPrivacy.PUBLIC,
        coverImage: 'https://example.com/cover-image.jpg',
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .send(eventWithCover)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.title).toBe(eventWithCover.title);
      expect(response.body.coverImage).toBe(eventWithCover.coverImage);
    });
  });

  describe('GET /events', () => {
    it('should get all events', async () => {
      const response = await request(app.getHttpServer())
        .get('/events')
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2); // At least our 2 test events
    });

    it('should filter events by privacy', async () => {
      const response = await request(app.getHttpServer())
        .get('/events')
        .query({ privacy: EventPrivacy.PUBLIC })
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      // All returned events should be PUBLIC
      response.body.data.forEach((event) => {
        expect(event.privacy).toBe(EventPrivacy.PUBLIC);
      });
    });

    it('should filter events by location', async () => {
      const response = await request(app.getHttpServer())
        .get('/events')
        .query({ location: 'Test Location' })
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      // Found events should contain our location
      const foundEvent = response.body.data.find(
        (event) => event.id === testEvent.id,
      );
      expect(foundEvent).toBeDefined();
    });

    it('should filter events by date range', async () => {
      const tomorrow = new Date(Date.now() + 86400000);
      const nextWeek = new Date(Date.now() + 7 * 86400000);

      const response = await request(app.getHttpServer())
        .get('/events')
        .query({
          fromDate: tomorrow.toISOString(),
          toDate: nextWeek.toISOString(),
        })
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /events/feed', () => {
    it('should get the user event feed', async () => {
      const response = await request(app.getHttpServer())
        .get('/events/feed')
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      // Should include events created by the user
      expect(
        response.body.data.some((event) => event.creatorId === testUser.id),
      ).toBe(true);
    });
  });

  describe('GET /events/:id', () => {
    it('should get an event by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events/${testEvent.id}`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(testEvent.id);
      expect(response.body.title).toBe(testEvent.title);
      expect(response.body.creatorId).toBe(testUser.id);
    });

    it('should fail to get a non-existent event', async () => {
      await request(app.getHttpServer())
        .get('/events/9999')
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(404);
    });
  });

  describe('PATCH /events/:id', () => {
    it('should update an event', async () => {
      const updatedTitle = 'Updated Event Title';
      const updatedDescription = 'This is the updated event description';

      const response = await request(app.getHttpServer())
        .patch(`/events/${testEvent.id}`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .send({
          title: updatedTitle,
          description: updatedDescription,
        })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(testEvent.id);
      expect(response.body.title).toBe(updatedTitle);
      expect(response.body.description).toBe(updatedDescription);
    });

    it('should not allow non-creator to update event', async () => {
      await request(app.getHttpServer())
        .patch(`/events/${testEvent.id}`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(secondUser.id)}`,
        )
        .send({ title: 'Should not work' })
        .expect(403);
    });
  });

  describe('POST /events/:id/participants', () => {
    it('should join an event', async () => {
      const response = await request(app.getHttpServer())
        .post(`/events/${testEvent.id}/participants`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(secondUser.id)}`,
        )
        .send({ status: ParticipantStatus.GOING })
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.eventId).toBe(testEvent.id);
      expect(response.body.userId).toBe(secondUser.id);
      expect(response.body.status).toBe(ParticipantStatus.GOING);
    });

    it('should update participation status', async () => {
      await request(app.getHttpServer())
        .patch(`/events/${testEvent.id}/participants/${secondUser.id}`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(secondUser.id)}`,
        )
        .send({ status: ParticipantStatus.INTERESTED })
        .expect(200);

      // Verify the status was changed
      const response = await request(app.getHttpServer())
        .get(`/events/${testEvent.id}/participants`)
        .query({ status: ParticipantStatus.INTERESTED })
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(secondUser.id)}`,
        )
        .expect(200);

      const foundParticipant = response.body.data.find(
        (p) => p.userId === secondUser.id,
      );
      expect(foundParticipant).toBeDefined();
      expect(foundParticipant.status).toBe(ParticipantStatus.INTERESTED);
    });
  });

  describe('GET /events/:id/participants', () => {
    it('should get participants for an event', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events/${testEvent.id}/participants`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2); // Creator and the second user
    });

    it('should filter participants by status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events/${testEvent.id}/participants`)
        .query({ status: ParticipantStatus.INTERESTED })
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      // All returned participants should have INTERESTED status
      response.body.data.forEach((participant) => {
        expect(participant.status).toBe(ParticipantStatus.INTERESTED);
      });
    });
  });

  describe('DELETE /events/:id/participants/:userId', () => {
    it('should leave an event', async () => {
      await request(app.getHttpServer())
        .delete(`/events/${testEvent.id}/participants/${secondUser.id}`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(secondUser.id)}`,
        )
        .expect(200);

      // Verify the user is no longer in the participants list
      const response = await request(app.getHttpServer())
        .get(`/events/${testEvent.id}/participants`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      const foundParticipant = response.body.data.find(
        (p) => p.userId === secondUser.id,
      );
      expect(foundParticipant).toBeUndefined();
    });
  });

  describe('POST /event-comments', () => {
    let testComment: any;

    it('should create a new comment on an event', async () => {
      const newComment = {
        eventId: testEvent.id,
        text: 'This is a test comment on the event',
      };

      const response = await request(app.getHttpServer())
        .post('/event-comments')
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .send(newComment)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.eventId).toBe(newComment.eventId);
      expect(response.body.text).toBe(newComment.text);
      expect(response.body.userId).toBe(testUser.id);

      // Save for later tests
      testComment = response.body;
    });

    it('should create a reply to a comment', async () => {
      const replyComment = {
        eventId: testEvent.id,
        text: 'This is a reply to the test comment',
        replyCommentId: testComment.id,
      };

      const response = await request(app.getHttpServer())
        .post('/event-comments')
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(secondUser.id)}`,
        )
        .send(replyComment)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.eventId).toBe(replyComment.eventId);
      expect(response.body.text).toBe(replyComment.text);
      expect(response.body.userId).toBe(secondUser.id);
      expect(response.body.replyCommentId).toBe(testComment.id);
    });

    it('should get all comments for an event', async () => {
      const response = await request(app.getHttpServer())
        .get('/event-comments')
        .query({ eventId: testEvent.id })
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2); // At least our 2 test comments
    });

    it('should get top-level comments only', async () => {
      const response = await request(app.getHttpServer())
        .get('/event-comments')
        .query({
          eventId: testEvent.id,
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
        .get('/event-comments')
        .query({
          eventId: testEvent.id,
          replyCommentId: testComment.id,
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

    it('should update a comment', async () => {
      const updatedText = 'This is the updated comment text';

      const response = await request(app.getHttpServer())
        .patch(`/event-comments/${testComment.id}`)
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

    it('should delete a comment', async () => {
      await request(app.getHttpServer())
        .delete(`/event-comments/${testComment.id}`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      // Verify the comment is deleted
      await request(app.getHttpServer())
        .get(`/event-comments/${testComment.id}`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(404);
    });
  });

  describe('DELETE /events/:id', () => {
    it('should not allow non-creator to delete event', async () => {
      await request(app.getHttpServer())
        .delete(`/events/${testEvent.id}`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(secondUser.id)}`,
        )
        .expect(403);
    });

    it('should delete an event', async () => {
      await request(app.getHttpServer())
        .delete(`/events/${testEvent.id}`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(200);

      // Verify the event is deleted
      await request(app.getHttpServer())
        .get(`/events/${testEvent.id}`)
        .set(
          'Authorization',
          `Bearer ${TestUtils.getMockAuthToken(testUser.id)}`,
        )
        .expect(404);
    });
  });
});
