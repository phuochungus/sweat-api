import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestUtils } from '../helpers/test-utils';
import { FriendRequestStatus } from '../../../src/common/enums';

describe('FriendRequest (e2e)', () => {
  let app: INestApplication;
  let user1: any; // Sender
  let user2: any; // Receiver
  let friendRequest: any;
  
  beforeAll(async () => {
    // Create the test app
    app = await TestUtils.createTestApp();
    
    // Setup test users
    user1 = await TestUtils.createTestUser(app, { 
      fullname: 'Friend Request Sender',
      firebaseId: 'sender_firebase_id'
    });
    
    user2 = await TestUtils.createTestUser(app, { 
      fullname: 'Friend Request Receiver',
      firebaseId: 'receiver_firebase_id'
    });
  });
  
  afterAll(async () => {
    // Clean up the test data
    await TestUtils.cleanupDatabase(app);
    
    // Close the app
    await app.close();
  });
  
  describe('POST /friend-request', () => {
    it('should send a friend request', async () => {
      const newFriendRequest = {
        senderUserId: user1.id,
        receiverUserId: user2.id
      };
      
      const response = await request(app.getHttpServer())
        .post('/friend-request')
        .set('Authorization', `Bearer ${TestUtils.getMockAuthToken(user1.id)}`)
        .send(newFriendRequest)
        .expect(201);
      
      // The response might not include the created friend request directly
      // Let's check if a friend request exists between these users
      const checkResponse = await request(app.getHttpServer())
        .get('/friend-request')
        .query({ 
          senderUserId: user1.id,
          receiverUserId: user2.id
        })
        .set('Authorization', `Bearer ${TestUtils.getMockAuthToken(user1.id)}`)
        .expect(200);
      
      expect(checkResponse.body.data).toBeDefined();
      expect(Array.isArray(checkResponse.body.data)).toBe(true);
      expect(checkResponse.body.data.length).toBeGreaterThan(0);
      
      const foundRequest = checkResponse.body.data[0];
      expect(foundRequest.senderUserId).toBe(user1.id);
      expect(foundRequest.receiverUserId).toBe(user2.id);
      expect(foundRequest.status).toBe(FriendRequestStatus.PENDING);
      
      // Save for later tests
      friendRequest = foundRequest;
    });
    
    it('should not allow sending a friend request to yourself', async () => {
      const invalidRequest = {
        senderUserId: user1.id,
        receiverUserId: user1.id
      };
      
      await request(app.getHttpServer())
        .post('/friend-request')
        .set('Authorization', `Bearer ${TestUtils.getMockAuthToken(user1.id)}`)
        .send(invalidRequest)
        .expect(403);
    });
    
    it('should not allow sending a friend request as another user', async () => {
      // User2 attempts to create a request pretending to be from User3 to User1
      const user3 = await TestUtils.createTestUser(app, {
        fullname: 'Third User',
        firebaseId: 'third_firebase_id'
      });
      
      const invalidRequest = {
        senderUserId: user3.id,  // Pretending to be user3
        receiverUserId: user1.id
      };
      
      await request(app.getHttpServer())
        .post('/friend-request')
        .set('Authorization', `Bearer ${TestUtils.getMockAuthToken(user2.id)}`)  // But authenticated as user2
        .send(invalidRequest)
        .expect(403);
    });
  });
  
  describe('GET /friend-request', () => {
    it('should get all received friend requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/friend-request')
        .query({ receiverUserId: user2.id })
        .set('Authorization', `Bearer ${TestUtils.getMockAuthToken(user2.id)}`)
        .expect(200);
      
      expect(response.body).toBeDefined();
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Verify we can see the friend request sent earlier
      const foundRequest = response.body.data.find(req => req.id === friendRequest.id);
      expect(foundRequest).toBeDefined();
    });
    
    it('should get all sent friend requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/friend-request')
        .query({ senderUserId: user1.id })
        .set('Authorization', `Bearer ${TestUtils.getMockAuthToken(user1.id)}`)
        .expect(200);
      
      expect(response.body).toBeDefined();
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Verify we can see the friend request sent earlier
      const foundRequest = response.body.data.find(req => req.id === friendRequest.id);
      expect(foundRequest).toBeDefined();
    });
    
    it('should filter friend requests by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/friend-request')
        .query({ 
          receiverUserId: user2.id,
          status: FriendRequestStatus.PENDING
        })
        .set('Authorization', `Bearer ${TestUtils.getMockAuthToken(user2.id)}`)
        .expect(200);
      
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // All requests should have PENDING status
      response.body.data.forEach(req => {
        expect(req.status).toBe(FriendRequestStatus.PENDING);
      });
    });
  });
  
  describe('GET /friend-request/:id', () => {
    it('should get a friend request by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/friend-request/${friendRequest.id}`)
        .set('Authorization', `Bearer ${TestUtils.getMockAuthToken(user1.id)}`)
        .expect(200);
      
      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(friendRequest.id);
      expect(response.body.senderUserId).toBe(user1.id);
      expect(response.body.receiverUserId).toBe(user2.id);
    });
    
    it('should fail to get a non-existent friend request', async () => {
      await request(app.getHttpServer())
        .get('/friend-request/9999')
        .set('Authorization', `Bearer ${TestUtils.getMockAuthToken(user1.id)}`)
        .expect(404);
    });
  });
  
  describe('PATCH /friend-request/:id', () => {
    // We'll create a new friend request for each test case
    let requestToAccept: any;
    let requestToReject: any;
    
    beforeAll(async () => {
      // Create a user who will send requests to test user 2
      const user3 = await TestUtils.createTestUser(app, { 
        fullname: 'Another Request Sender',
        firebaseId: 'another_sender_id'
      });
      
      // Create a friend request to accept
      const dataSource = app.get('DataSource');
      const acceptRequestResult = await dataSource.query(`
        INSERT INTO "user_friend_request" (
          "senderUserId", "receiverUserId", "status"
        ) VALUES ($1, $2, $3) RETURNING *
      `, [user3.id, user2.id, FriendRequestStatus.PENDING]);
      
      requestToAccept = acceptRequestResult[0];
      
      // Create a friend request to reject
      const rejectRequestResult = await dataSource.query(`
        INSERT INTO "user_friend_request" (
          "senderUserId", "receiverUserId", "status"
        ) VALUES ($1, $2, $3) RETURNING *
      `, [user3.id, user1.id, FriendRequestStatus.PENDING]);
      
      requestToReject = rejectRequestResult[0];
    });
    
    it('should accept a friend request', async () => {
      await request(app.getHttpServer())
        .patch(`/friend-request/${requestToAccept.id}`)
        .set('Authorization', `Bearer ${TestUtils.getMockAuthToken(user2.id)}`)
        .send({ status: FriendRequestStatus.ACCEPTED })
        .expect(200);
      
      // Verify that the friend request no longer exists (it should be deleted after acceptance)
      await request(app.getHttpServer())
        .get(`/friend-request/${requestToAccept.id}`)
        .set('Authorization', `Bearer ${TestUtils.getMockAuthToken(user2.id)}`)
        .expect(404);
      
      // We should now be able to see this user as a friend
      // This would require checking the friends endpoint, but we'll skip that for now
    });
    
    it('should reject a friend request', async () => {
      await request(app.getHttpServer())
        .patch(`/friend-request/${requestToReject.id}`)
        .set('Authorization', `Bearer ${TestUtils.getMockAuthToken(user1.id)}`)
        .send({ status: FriendRequestStatus.REJECTED })
        .expect(200);
      
      // Verify that the friend request no longer exists (it should be deleted after rejection)
      await request(app.getHttpServer())
        .get(`/friend-request/${requestToReject.id}`)
        .set('Authorization', `Bearer ${TestUtils.getMockAuthToken(user1.id)}`)
        .expect(404);
    });
    
    it('should not allow non-recipient to update friend request', async () => {
      // Create a new friend request
      const dataSource = app.get('DataSource');
      const requestResult = await dataSource.query(`
        INSERT INTO "user_friend_request" (
          "senderUserId", "receiverUserId", "status"
        ) VALUES ($1, $2, $3) RETURNING *
      `, [user1.id, user2.id, FriendRequestStatus.PENDING]);
      
      const request = requestResult[0];
      
      // User1 (sender) tries to accept the request (should fail)
      await request(app.getHttpServer())
        .patch(`/friend-request/${request.id}`)
        .set('Authorization', `Bearer ${TestUtils.getMockAuthToken(user1.id)}`)
        .send({ status: FriendRequestStatus.ACCEPTED })
        .expect(403);
    });
  });
  
  describe('DELETE /friend-request/:id', () => {
    let requestToDelete: any;
    
    beforeEach(async () => {
      // Create a new friend request to delete in each test
      const dataSource = app.get('DataSource');
      const requestResult = await dataSource.query(`
        INSERT INTO "user_friend_request" (
          "senderUserId", "receiverUserId", "status"
        ) VALUES ($1, $2, $3) RETURNING *
      `, [user1.id, user2.id, FriendRequestStatus.PENDING]);
      
      requestToDelete = requestResult[0];
    });
    
    it('should delete a friend request', async () => {
      await request(app.getHttpServer())
        .delete(`/friend-request/${requestToDelete.id}`)
        .set('Authorization', `Bearer ${TestUtils.getMockAuthToken(user1.id)}`)
        .expect(200);
      
      // Verify the request is deleted
      await request(app.getHttpServer())
        .get(`/friend-request/${requestToDelete.id}`)
        .set('Authorization', `Bearer ${TestUtils.getMockAuthToken(user1.id)}`)
        .expect(404);
    });
  });
});