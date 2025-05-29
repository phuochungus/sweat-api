import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PostValidationController } from './post-validation.controller';
import { PostValidationService } from 'src/post-validation/post-validation.service';

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [PostValidationController],
  providers: [PostValidationService],
  exports: [PostValidationService],
})
export class PostValidationModule {}
