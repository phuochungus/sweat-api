import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from 'src/config/configuration';
import { AwsModule } from 'src/aws/aws.module';
import { PostModule } from './post/post.module';
import { PostMediaModule } from './post-media/post-media.module';
import { UserModule } from './user/user.module';
import { UserFriendModule } from './user-friend/user-friend.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskScheduleService } from './task-schedule/task-schedule.service';
import { UserSettingModule } from './user-setting/user-setting.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const config = configService.get('database');
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
    UserFriendModule,
    UserSettingModule,
  ],
  controllers: [AppController],
  providers: [AppService, TaskScheduleService],
})
export class AppModule {}
