import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FriendService } from './friend/friend.service';
import { DataSource } from 'typeorm';
import { FriendRequestStatus } from './common/enums';
import { User, UserFriend, UserFriendRequest } from './entities';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    console.log('Seeding friend relationships and friend requests...');
    
    const dataSource = app.get(DataSource);
    const friendService = app.get(FriendService);
    
    // Get all users from the database
    const allUsers = await dataSource
      .createQueryBuilder(User, 'u')
      .getMany();
    
    if (allUsers.length === 0) {
      console.error('No users found in the database. Please seed users first.');
      return;
    }
    
    console.log(`Found ${allUsers.length} users in the database`);
    
    // We'll create friend relationships and friend requests based on these parameters
    // Each user will be friends with approximately this percentage of other users
    const friendPercentage = 0.1;  // 10%
    // Each user will have pending friend requests with approximately this percentage of other users
    const requestPercentage = 0.05; // 5%
    // For mutual friends, ensure that users with similar indices have mutual connections
    // (e.g., users [1,2,3] all friends with each other creating mutual friend relationships)
    const mutualFriendGroupSize = 4; // Users will have mutual friends in groups of 4
    
    console.log('Creating friend relationships...');
    
    // Create friend relationships - First create mutual friend groups
    for (let i = 0; i < allUsers.length; i++) {
      const user = allUsers[i];
      
      // Create mutual friend groups (users grouped by index)
      const groupStart = Math.floor(i / mutualFriendGroupSize) * mutualFriendGroupSize;
      const groupEnd = Math.min(groupStart + mutualFriendGroupSize, allUsers.length);
      
      for (let j = groupStart; j < groupEnd; j++) {
        // Skip self
        if (i === j) continue;
        
        const friend = allUsers[j];
        
        // Check if friend relationship already exists
        const existingFriend = await dataSource
          .createQueryBuilder(UserFriend, 'uf')
          .where(
            '(uf.userId1 = :userId1 AND uf.userId2 = :userId2) OR (uf.userId1 = :userId2 AND uf.userId2 = :userId1)',
            { userId1: user.id, userId2: friend.id },
          )
          .getOne();
        
        if (!existingFriend) {
          await dataSource
            .createQueryBuilder()
            .insert()
            .into(UserFriend)
            .values({
              userId1: user.id,
              userId2: friend.id,
            })
            .execute();
          
          console.log(`Created mutual friend relationship between user ${user.id} and user ${friend.id}`);
        }
      }
    }
    
    // Now create some random friendships to reach the target friendship percentage
    for (let i = 0; i < allUsers.length; i++) {
      const user = allUsers[i];
      
      // Calculate how many friends this user should have based on the percentage
      const targetFriendCount = Math.floor((allUsers.length - 1) * friendPercentage);
      
      // Get current friend count
      const currentFriendCount = await dataSource
        .createQueryBuilder(UserFriend, 'uf')
        .where('uf.userId1 = :userId OR uf.userId2 = :userId', { userId: user.id })
        .getCount();
      
      // If we already have enough friends from the mutual groups, skip
      if (currentFriendCount >= targetFriendCount) {
        continue;
      }
      
      // Calculate how many additional friends we need
      const additionalFriendsNeeded = targetFriendCount - currentFriendCount;
      
      // Create additional random friendships
      const potentialFriends = allUsers.filter(potentialFriend => 
        potentialFriend.id !== user.id &&
        Math.floor(potentialFriend.id / mutualFriendGroupSize) !== Math.floor(user.id / mutualFriendGroupSize)
      );
      
      // Shuffle potential friends to randomize connections
      const shuffledPotentialFriends = potentialFriends.sort(() => 0.5 - Math.random());
      
      for (let f = 0; f < Math.min(additionalFriendsNeeded, shuffledPotentialFriends.length); f++) {
        const friend = shuffledPotentialFriends[f];
        
        // Check if friend relationship already exists
        const existingFriend = await dataSource
          .createQueryBuilder(UserFriend, 'uf')
          .where(
            '(uf.userId1 = :userId1 AND uf.userId2 = :userId2) OR (uf.userId1 = :userId2 AND uf.userId2 = :userId1)',
            { userId1: user.id, userId2: friend.id },
          )
          .getOne();
        
        if (!existingFriend) {
          await dataSource
            .createQueryBuilder()
            .insert()
            .into(UserFriend)
            .values({
              userId1: user.id,
              userId2: friend.id,
            })
            .execute();
          
          console.log(`Created random friend relationship between user ${user.id} and user ${friend.id}`);
        }
      }
    }
    
    // Create friend requests
    console.log('Creating friend requests...');
    
    for (let i = 0; i < allUsers.length; i++) {
      const sender = allUsers[i];
      
      // Calculate how many friend requests this user should send based on the percentage
      const requestCount = Math.floor((allUsers.length - 1) * requestPercentage);
      
      // Get users who are not friends with this user
      const nonFriends = await dataSource
        .createQueryBuilder(User, 'u')
        .where('u.id != :userId', { userId: sender.id })
        .andWhere(qb => {
          const subQuery = qb
            .subQuery()
            .select('1')
            .from(UserFriend, 'uf')
            .where(
              '(uf.userId1 = :userId1 AND uf.userId2 = u.id) OR (uf.userId1 = u.id AND uf.userId2 = :userId2)',
              { userId1: sender.id, userId2: sender.id }
            )
            .getQuery();
          return `NOT EXISTS ${subQuery}`;
        })
        .andWhere(qb => {
          const subQuery = qb
            .subQuery()
            .select('1')
            .from(UserFriendRequest, 'ufr')
            .where(
              '(ufr.senderUserId = :userId1 AND ufr.receiverUserId = u.id) OR (ufr.senderUserId = u.id AND ufr.receiverUserId = :userId2)',
              { userId1: sender.id, userId2: sender.id }
            )
            .getQuery();
          return `NOT EXISTS ${subQuery}`;
        })
        .limit(requestCount)
        .getMany();
      
      // Send friend requests
      for (const receiver of nonFriends) {
        await dataSource
          .createQueryBuilder()
          .insert()
          .into(UserFriendRequest)
          .values({
            senderUserId: sender.id,
            receiverUserId: receiver.id,
            status: FriendRequestStatus.PENDING,
          })
          .execute();
        
        console.log(`Created friend request from user ${sender.id} to user ${receiver.id}`);
      }
    }
    
    // Update friend count for all users
    await friendService.syncFriendCountForAllUser();
    console.log('Friend counts updated for all users');
    
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
