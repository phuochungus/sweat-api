import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import configuration from 'src/config/configuration';
import { AwsModule } from 'src/aws/aws.module';
import { PostModule } from './post/post.module';
import { PostMediaModule } from './post-media/post-media.module';
import { UserModule } from './user/user.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskScheduleService } from './task-schedule/task-schedule.service';
import { UserSettingModule } from './user-setting/user-setting.module';

import { FriendModule } from './friend/friend.module';
import { FriendRequestModule } from 'src/friend-request/user-friend-request.module';
import { NotificationModule } from 'src/notification/user-notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
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
    UserModule,
    UserSettingModule,
    FriendRequestModule,
    NotificationModule,
    FriendModule,
  ],
  controllers: [AppController],
  providers: [AppService, TaskScheduleService],
})
export class AppModule {}
