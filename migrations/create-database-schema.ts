import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDatabaseSchema1742305341178 implements MigrationInterface {
  name = 'CreateDatabaseSchema1742305341178';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user table
    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "fullname" character varying,
        "avatarUrl" character varying,
        "coverUrl" character varying,
        "bio" character varying,
        "birthday" DATE,
        "gender" "public"."user_gender_enum",
        "firebaseId" character varying,
        "friendCount" integer NOT NULL DEFAULT '0',
        "deviceTokens" text,
        CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
      )
    `);

    // Create user_setting table
    await queryRunner.query(`
      CREATE TABLE "user_setting" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" integer NOT NULL,
        "language" "public"."user_setting_language_enum" NOT NULL DEFAULT 'VN',
        "notification" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_9fe2e7c7b8eb203462fae29c547" PRIMARY KEY ("id")
      )
    `);

    // Create user_friend table
    await queryRunner.query(`
      CREATE TABLE "user_friend" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId1" integer NOT NULL,
        "userId2" integer NOT NULL,
        CONSTRAINT "PK_f8f5f69094d7c633789388fb4ae" PRIMARY KEY ("id")
      )
    `);

    // Create user_friend_request table
    await queryRunner.query(`
      CREATE TABLE "user_friend_request" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "senderUserId" integer NOT NULL,
        "receiverUserId" integer NOT NULL,
        "status" "public"."user_friend_request_status_enum" NOT NULL DEFAULT 'PENDING',
        CONSTRAINT "PK_254e9d4a2a1b9f1b8e33c7a0b4c" PRIMARY KEY ("id")
      )
    `);

    // Create post table
    await queryRunner.query(`
      CREATE TABLE "post" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "text" character varying NOT NULL,
        "commentCount" integer NOT NULL DEFAULT '0',
        "reactCount" integer NOT NULL DEFAULT '0',
        "mediaCount" integer NOT NULL DEFAULT '0',
        "privacy" "public"."post_privacy_enum" NOT NULL,
        "userId" integer NOT NULL,
        "location" character varying,
        CONSTRAINT "PK_be5fda3aac270b134ff9c21cdee" PRIMARY KEY ("id")
      )
    `);

    // Create post_media table
    await queryRunner.query(`
      CREATE TABLE "post_media" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "postId" integer NOT NULL,
        "priority" integer NOT NULL,
        "url" character varying NOT NULL,
        "type" "public"."post_media_type_enum" NOT NULL,
        "text" character varying,
        CONSTRAINT "PK_d9c10e72d7b06499a3a1c33a37a" PRIMARY KEY ("id")
      )
    `);

    // Create post_comment table
    await queryRunner.query(`
      CREATE TABLE "post_comment" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" integer NOT NULL,
        "postId" integer NOT NULL,
        "text" character varying NOT NULL,
        "replyCommentId" integer,
        "replyCount" integer NOT NULL DEFAULT '0',
        "reactCount" integer NOT NULL DEFAULT '0',
        CONSTRAINT "PK_5a0fdc7a12292db1d69b5f76a8d" PRIMARY KEY ("id")
      )
    `);

    // Create post_react table
    await queryRunner.query(`
      CREATE TABLE "post_react" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "type" "public"."post_react_type_enum" NOT NULL,
        "userId" integer NOT NULL,
        "commentId" integer,
        "postId" integer,
        CONSTRAINT "PK_c5a7b2fc0b97ff9907a9d470f10" PRIMARY KEY ("id")
      )
    `);

    // Create user_notification table
    await queryRunner.query(`
      CREATE TABLE "user_notification" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "receiverUserId" integer NOT NULL,
        "senderUserId" integer,
        "postId" integer,
        "text" character varying NOT NULL,
        "status" "public"."user_notification_status_enum" NOT NULL DEFAULT 'UNREAD',
        "type" "public"."user_notification_type_enum" NOT NULL,
        CONSTRAINT "PK_55d2e1be91e26936d554afa6f46" PRIMARY KEY ("id")
      )
    `);

    // Create views_tracking table
    await queryRunner.query(`
      CREATE TABLE "views_tracking" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "postId" character varying NOT NULL,
        "userId" character varying NOT NULL,
        "viewedAt" TIMESTAMP,
        CONSTRAINT "PK_4c09d92a559f22295410a518bce" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "post_media" ADD CONSTRAINT "FK_3b7134b6640ccbcf02d34da4e15" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "post_comment" ADD CONSTRAINT "FK_86fe082a604dff18a1c10b8a96e" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "post_react" ADD CONSTRAINT "FK_b1d7fd78f242a561c35a346d6e3" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "post_react" ADD CONSTRAINT "FK_1d8bed45e67c89e3effddfdde2d" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "post_react" ADD CONSTRAINT "FK_88dcbca81e057100df31103dffc" FOREIGN KEY ("commentId") REFERENCES "post_comment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "user_notification" ADD CONSTRAINT "FK_f6bb5226d6d0811cbe2f513ab15" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "user_friend_request" ADD CONSTRAINT "FK_7e9048e9deba09441504b1a8692" FOREIGN KEY ("senderUserId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "user_friend_request" ADD CONSTRAINT "FK_add2c92597828d62fb36dac6d7c" FOREIGN KEY ("receiverUserId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints first
    await queryRunner.query(`ALTER TABLE "user_friend_request" DROP CONSTRAINT "FK_add2c92597828d62fb36dac6d7c"`);
    await queryRunner.query(`ALTER TABLE "user_friend_request" DROP CONSTRAINT "FK_7e9048e9deba09441504b1a8692"`);
    await queryRunner.query(`ALTER TABLE "user_notification" DROP CONSTRAINT "FK_f6bb5226d6d0811cbe2f513ab15"`);
    await queryRunner.query(`ALTER TABLE "post_react" DROP CONSTRAINT "FK_88dcbca81e057100df31103dffc"`);
    await queryRunner.query(`ALTER TABLE "post_react" DROP CONSTRAINT "FK_1d8bed45e67c89e3effddfdde2d"`);
    await queryRunner.query(`ALTER TABLE "post_react" DROP CONSTRAINT "FK_b1d7fd78f242a561c35a346d6e3"`);
    await queryRunner.query(`ALTER TABLE "post_comment" DROP CONSTRAINT "FK_86fe082a604dff18a1c10b8a96e"`);
    await queryRunner.query(`ALTER TABLE "post_media" DROP CONSTRAINT "FK_3b7134b6640ccbcf02d34da4e15"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "views_tracking"`);
    await queryRunner.query(`DROP TABLE "user_notification"`);
    await queryRunner.query(`DROP TABLE "post_react"`);
    await queryRunner.query(`DROP TABLE "post_comment"`);
    await queryRunner.query(`DROP TABLE "post_media"`);
    await queryRunner.query(`DROP TABLE "post"`);
    await queryRunner.query(`DROP TABLE "user_friend_request"`);
    await queryRunner.query(`DROP TABLE "user_friend"`);
    await queryRunner.query(`DROP TABLE "user_setting"`);
    await queryRunner.query(`DROP TABLE "user"`);
  }
}