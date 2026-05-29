import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CustomerSession, ChatMessage } from './entities/chat.entity.js';
import { ChatService } from './chat.service.js';
import { ChatController } from './chat.controller.js';
import { ChatGateway } from './chat.gateway.js';
import { TranslationService } from './translation.service.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([CustomerSession, ChatMessage]),
    AuditLogModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, TranslationService],
  exports: [ChatService, ChatGateway, TranslationService],
})
export class ChatModule {}
