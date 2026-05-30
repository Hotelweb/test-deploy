import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CustomerSession, ChatMessage } from './entities/chat.entity.js';
import {
  InternalChatConversation,
  InternalChatMessage,
} from './entities/internal-chat.entity.js';
import { ChatService } from './chat.service.js';
import { ChatController } from './chat.controller.js';
import { InternalChatController } from './internal-chat.controller.js';
import { ChatGateway } from './chat.gateway.js';
import { TranslationService } from './translation.service.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';
import { InternalChatService } from './internal-chat.service.js';
import { HotelUser } from '../hotel-users/entities/hotel-user.entity.js';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      CustomerSession,
      ChatMessage,
      InternalChatConversation,
      InternalChatMessage,
      HotelUser,
    ]),
    AuditLogModule,
  ],
  controllers: [ChatController, InternalChatController],
  providers: [ChatService, ChatGateway, TranslationService, InternalChatService],
  exports: [ChatService, ChatGateway, TranslationService, InternalChatService],
})
export class ChatModule {}
