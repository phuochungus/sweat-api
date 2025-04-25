import { MigrationInterface, QueryRunner } from 'typeorm';
import { faker } from '@faker-js/faker';
import {
  FriendRequestStatus,
  NotificationStatus,
  PostPrivacy,
  ReactType,
  UserGender,
} from '../src/common/enums';
import { SOCIAL } from '../src/notification/enum';

export class SeedAll1742205341178 implements MigrationInterface {
  name = 'SeedAll1742205341178';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🌱 Starting database seeding...');

    // Create test users (10 users)
    console.log('Creating test users...');
    const userIds = [];
    for (let i = 0; i < 10; i++) {
      const insertResult = await queryRunner.query(
        `
        INSERT INTO "user" (
          "fullname", 
          "avatarUrl", 
          "coverUrl", 
          "bio", 
          "birthday", 
          "gender", 
          "firebaseId",
          "friendCount"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        ) RETURNING id
      `,
        [
          faker.person.fullName(),
          faker.image.avatar(),
          faker.image.url(),
          faker.lorem.sentence(),
          faker.date.past({ years: 30 }).toISOString(),
          faker.helpers.enumValue(UserGender),
          faker.string.uuid(),
          0,
        ],
      );

      userIds.push(insertResult[0].id);

      // Create user settings
      await queryRunner.query(
        `
        INSERT INTO "user_setting" (
          "userId",
          "language",
          "notification"
        ) VALUES (
          $1, $2, $3
        )
      `,
        [insertResult[0].id, 'VN', true],
      );
    }

    // Create friend relationships (each user has 2-5 friends)
    console.log('Creating friend relationships...');
    for (const userId of userIds) {
      const friendCount = faker.number.int({ min: 2, max: 5 });
      const friendIds = faker.helpers.arrayElements(
        userIds.filter((id) => id !== userId),
        friendCount,
      );

      for (const friendId of friendIds) {
        // Create friendship (avoid duplicates)
        const existingFriendship = await queryRunner.query(
          `
          SELECT * FROM "user_friend"
          WHERE 
            ("userId1" = $1 AND "userId2" = $2) OR
            ("userId1" = $2 AND "userId2" = $1)
        `,
          [userId, friendId],
        );

        if (existingFriendship.length === 0) {
          await queryRunner.query(
            `
            INSERT INTO "user_friend" (
              "userId1", 
              "userId2"
            ) VALUES (
              $1, $2
            )
          `,
            [userId, friendId],
          );

          // Update friend count for both users
          await queryRunner.query(
            `
            UPDATE "user" SET "friendCount" = "friendCount" + 1
            WHERE "id" IN ($1, $2)
          `,
            [userId, friendId],
          );
        }
      }
    }

    // Create some friend requests
    console.log('Creating friend requests...');
    for (let i = 0; i < 5; i++) {
      const sender = faker.helpers.arrayElement(userIds);
      const receiver = faker.helpers.arrayElement(
        userIds.filter((id) => id !== sender),
      );

      // Check if they are already friends
      const existingFriendship = await queryRunner.query(
        `
        SELECT * FROM "user_friend"
        WHERE 
          ("userId1" = $1 AND "userId2" = $2) OR
          ("userId1" = $2 AND "userId2" = $1)
      `,
        [sender, receiver],
      );

      // Check if a request already exists
      const existingRequest = await queryRunner.query(
        `
        SELECT * FROM "user_friend_request"
        WHERE 
          ("senderUserId" = $1 AND "receiverUserId" = $2) OR
          ("senderUserId" = $2 AND "receiverUserId" = $1)
      `,
        [sender, receiver],
      );

      // Create request if they are not already friends and no request exists
      if (existingFriendship.length === 0 && existingRequest.length === 0) {
        await queryRunner.query(
          `
          INSERT INTO "user_friend_request" (
            "senderUserId", 
            "receiverUserId", 
            "status"
          ) VALUES (
            $1, $2, $3
          )
        `,
          [sender, receiver, FriendRequestStatus.PENDING],
        );

        // Create notification for friend request
        const senderUser = await queryRunner.query(
          `
          SELECT "fullname" FROM "user" WHERE "id" = $1
        `,
          [sender],
        );

        await queryRunner.query(
          `
          INSERT INTO "user_notification" (
            "receiverUserId",
            "senderUserId",
            "text",
            "status",
            "type"
          ) VALUES (
            $1, $2, $3, $4, $5
          )
        `,
          [
            receiver,
            sender,
            `<b>${senderUser[0].fullname}</b> đã gửi lời mời kết bạn.`,
            NotificationStatus.UNREAD,
            SOCIAL.CREATE_FRIEND_REQUEST,
          ],
        );
      }
    }

    // Create posts
    console.log('Creating posts...');
    const postIds = [];
    for (let i = 0; i < 20; i++) {
      const userId = faker.helpers.arrayElement(userIds);

      const insertResult = await queryRunner.query(
        `
        INSERT INTO "post" (
          "text",
          "privacy",
          "userId",
          "location"
        ) VALUES (
          $1, $2, $3, $4
        ) RETURNING id
      `,
        [
          faker.lorem.paragraph(),
          faker.helpers.enumValue(PostPrivacy),
          userId,
          faker.location.city(),
        ],
      );

      postIds.push(insertResult[0].id);

      // Add 1-3 media items to some posts
      if (faker.datatype.boolean()) {
        const mediaCount = faker.number.int({ min: 1, max: 3 });
        for (let j = 0; j < mediaCount; j++) {
          await queryRunner.query(
            `
            INSERT INTO "post_media" (
              "postId",
              "priority",
              "url",
              "type"
            ) VALUES (
              $1, $2, $3, $4
            )
          `,
            [insertResult[0].id, j, faker.image.url(), 'IMAGE'],
          );
        }

        // Update media count
        await queryRunner.query(
          `
          UPDATE "post" 
          SET "mediaCount" = $1
          WHERE "id" = $2
        `,
          [mediaCount, insertResult[0].id],
        );
      }
    }

    // Create comments
    console.log('Creating comments...');
    const commentIds = [];
    for (const postId of postIds) {
      const commentCount = faker.number.int({ min: 0, max: 5 });

      for (let i = 0; i < commentCount; i++) {
        const userId = faker.helpers.arrayElement(userIds);

        const insertResult = await queryRunner.query(
          `
          INSERT INTO "post_comment" (
            "userId",
            "postId",
            "text"
          ) VALUES (
            $1, $2, $3
          ) RETURNING id
        `,
          [userId, postId, faker.lorem.sentence()],
        );

        commentIds.push(insertResult[0].id);
      }

      // Update comment count
      await queryRunner.query(
        `
        UPDATE "post" 
        SET "commentCount" = $1
        WHERE "id" = $2
      `,
        [commentCount, postId],
      );

      // Create some replies
      for (const commentId of commentIds.slice(
        0,
        faker.number.int({ min: 0, max: commentIds.length }),
      )) {
        if (faker.datatype.boolean()) {
          const userId = faker.helpers.arrayElement(userIds);

          await queryRunner.query(
            `
            INSERT INTO "post_comment" (
              "userId",
              "postId",
              "text",
              "replyCommentId"
            ) VALUES (
              $1, $2, $3, $4
            )
          `,
            [userId, postId, faker.lorem.sentence(), commentId],
          );

          // Update reply count for parent comment
          await queryRunner.query(
            `
            UPDATE "post_comment" 
            SET "replyCount" = "replyCount" + 1
            WHERE "id" = $1
          `,
            [commentId],
          );

          // Update post comment count
          await queryRunner.query(
            `
            UPDATE "post" 
            SET "commentCount" = "commentCount" + 1
            WHERE "id" = $1
          `,
            [postId],
          );
        }
      }
    }

    // Create reactions
    console.log('Creating reactions...');
    for (const postId of postIds) {
      const reactCount = faker.number.int({ min: 0, max: 8 });
      const reactingUserIds = faker.helpers.arrayElements(userIds, reactCount);

      for (const userId of reactingUserIds) {
        await queryRunner.query(
          `
          INSERT INTO "post_react" (
            "userId",
            "postId",
            "type"
          ) VALUES (
            $1, $2, $3
          )
        `,
          [userId, postId, faker.helpers.enumValue(ReactType)],
        );
      }

      // Update react count
      await queryRunner.query(
        `
        UPDATE "post" 
        SET "reactCount" = $1
        WHERE "id" = $2
      `,
        [reactCount, postId],
      );
    }

    // Create some comment reactions
    for (const commentId of commentIds) {
      if (faker.datatype.boolean()) {
        const reactCount = faker.number.int({ min: 1, max: 3 });
        const reactingUserIds = faker.helpers.arrayElements(
          userIds,
          reactCount,
        );

        for (const userId of reactingUserIds) {
          await queryRunner.query(
            `
            INSERT INTO "post_react" (
              "userId",
              "commentId",
              "type"
            ) VALUES (
              $1, $2, $3
            )
          `,
            [userId, commentId, faker.helpers.enumValue(ReactType)],
          );
        }

        // Update comment react count
        await queryRunner.query(
          `
          UPDATE "post_comment" 
          SET "reactCount" = $1
          WHERE "id" = $2
        `,
          [reactCount, commentId],
        );
      }
    }

    console.log('✅ Database seeding completed successfully!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('⏪ Rolling back seeds...');

    // Delete in reverse order to avoid foreign key constraints
    await queryRunner.query(`DELETE FROM "post_react"`);
    await queryRunner.query(`DELETE FROM "post_comment"`);
    await queryRunner.query(`DELETE FROM "post_media"`);
    await queryRunner.query(`DELETE FROM "post"`);
    await queryRunner.query(`DELETE FROM "user_notification"`);
    await queryRunner.query(`DELETE FROM "user_friend_request"`);
    await queryRunner.query(`DELETE FROM "user_friend"`);
    await queryRunner.query(`DELETE FROM "user_setting"`);
    await queryRunner.query(`DELETE FROM "user"`);

    console.log('✅ Seed rollback completed successfully!');
  }
}
