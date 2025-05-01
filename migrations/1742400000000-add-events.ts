import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEvents1742400000000 implements MigrationInterface {
  name = 'AddEvents1742400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create event enum types
    await queryRunner.query(
      `CREATE TYPE "public"."event_privacy_enum" AS ENUM ('PUBLIC', 'FRIEND', 'PRIVATE')`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."event_participant_status_enum" AS ENUM ('GOING', 'INTERESTED', 'INVITED')`,
    );

    // Create event table
    await queryRunner.query(`
      CREATE TABLE "event" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "title" character varying NOT NULL,
        "description" text,
        "location" character varying,
        "startTime" TIMESTAMP WITH TIME ZONE NOT NULL,
        "endTime" TIMESTAMP WITH TIME ZONE,
        "creatorId" integer NOT NULL,
        "privacy" "public"."event_privacy_enum" NOT NULL DEFAULT 'PUBLIC',
        "coverImage" character varying,
        "participantCount" integer NOT NULL DEFAULT '0',
        "commentCount" integer NOT NULL DEFAULT '0',
        CONSTRAINT "PK_event" PRIMARY KEY ("id")
      )
    `);

    // Create event_participant table
    await queryRunner.query(`
      CREATE TABLE "event_participant" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "eventId" integer NOT NULL,
        "userId" integer NOT NULL,
        "status" "public"."event_participant_status_enum" NOT NULL DEFAULT 'GOING',
        CONSTRAINT "PK_event_participant" PRIMARY KEY ("id")
      )
    `);

    // Create event_media table
    await queryRunner.query(`
      CREATE TABLE "event_media" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "eventId" integer NOT NULL,
        "priority" integer NOT NULL,
        "url" character varying NOT NULL,
        "type" "public"."post_media_type_enum" NOT NULL,
        CONSTRAINT "PK_event_media" PRIMARY KEY ("id")
      )
    `);

    // Create event_comment table
    await queryRunner.query(`
      CREATE TABLE "event_comment" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "eventId" integer NOT NULL,
        "userId" integer NOT NULL,
        "text" character varying NOT NULL,
        "replyCommentId" integer,
        "replyCount" integer NOT NULL DEFAULT '0',
        "reactCount" integer NOT NULL DEFAULT '0',
        CONSTRAINT "PK_event_comment" PRIMARY KEY ("id")
      )
    `);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "event" ADD CONSTRAINT "FK_event_creator" 
      FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "event_participant" ADD CONSTRAINT "FK_event_participant_event" 
      FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "event_participant" ADD CONSTRAINT "FK_event_participant_user" 
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "event_media" ADD CONSTRAINT "FK_event_media_event" 
      FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "event_comment" ADD CONSTRAINT "FK_event_comment_event" 
      FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "event_comment" ADD CONSTRAINT "FK_event_comment_user" 
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "event_comment" ADD CONSTRAINT "FK_event_comment_parent" 
      FOREIGN KEY ("replyCommentId") REFERENCES "event_comment"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    await queryRunner.query(
      `ALTER TABLE "event_comment" DROP CONSTRAINT "FK_event_comment_parent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_comment" DROP CONSTRAINT "FK_event_comment_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_comment" DROP CONSTRAINT "FK_event_comment_event"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_media" DROP CONSTRAINT "FK_event_media_event"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_participant" DROP CONSTRAINT "FK_event_participant_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_participant" DROP CONSTRAINT "FK_event_participant_event"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" DROP CONSTRAINT "FK_event_creator"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE "event_comment"`);
    await queryRunner.query(`DROP TABLE "event_media"`);
    await queryRunner.query(`DROP TABLE "event_participant"`);
    await queryRunner.query(`DROP TABLE "event"`);

    // Drop enum types
    await queryRunner.query(
      `DROP TYPE "public"."event_participant_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."event_privacy_enum"`);
  }
}
