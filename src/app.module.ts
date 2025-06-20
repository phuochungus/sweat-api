import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import configuration from 'src/config/configuration';
import testConfiguration from 'src/config/test-configuration';
import { AwsModule } from 'src/aws/aws.module';
import { PostModule } from './post/post.module';
import { PostMediaModule } from './post-media/post-media.module';
import { UserModule } from './user/user.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UserSettingModule } from './user-setting/user-setting.module';
import { FriendModule } from './friend/friend.module';
import { FriendRequestModule } from 'src/friend-request/friend-request.module';
import { NotificationModule } from 'src/notification/notification.module';
import { PostCommentModule } from './post-comment/post-comment.module';
import { AuthModule } from './auth/auth.module';
import { PostReactModule } from './post-react/post-react.module';
import { HealthModule } from './health/health.module';
import { DataSource } from 'typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ImageProcessingModule } from './image-processing/image-processing.module';
import { VideoProcessingModule } from './video-processing/video-processing.module';
import { PostValidationModule } from './post-validation/post-validation.module';
import { CacheModule } from '@nestjs/cache-manager';
import { Keyv } from 'keyv';
import { createKeyv } from '@keyv/redis';
import { CacheableMemory } from 'cacheable';
import { FirestoreListenerService } from './firestore-listener/firestore-listener.service';
import { SeedService } from './seed/seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [
        process.env.NODE_ENV === 'test' ? testConfiguration : configuration,
      ],
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
            }),
            createKeyv(configService.get('redis')?.url),
          ],
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const config: TypeOrmModuleOptions = configService.get('database');
        if (!config) {
          throw new Error('Cannot start app without ORM config');
        }
        console.log(config);
        return config;
      },
      inject: [ConfigService],
    }),
    AwsModule,
    PostModule,
    PostMediaModule,
    PostReactModule,
    UserModule,
    UserSettingModule,
    FriendRequestModule,
    NotificationModule,
    FriendModule,
    PostCommentModule,
    HealthModule,
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const config = configService.get('redis');
        if (!config) {
          throw new Error('Cannot start app without Redis config');
        }
        return {
          connection: {
            host: config.host,
            port: config.port,
            password: config.password,
            username: config.username,
          },
        };
      },
      inject: [ConfigService],
    }),
    ImageProcessingModule,
    VideoProcessingModule,
    PostValidationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'DataSource',
      useFactory: (connection: DataSource) => connection,
      inject: [DataSource],
    },
    FirestoreListenerService,
    SeedService,
  ],
  exports: ['DataSource'],
})
export class AppModule {}
