import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  RequireScopes,
} from '../auth/jwt-auth.guard.js';
import type { TokenPayload } from '../auth/token.service.js';
import { SendInternalMessageDto } from './dto/internal-chat.dto.js';
import { ChatGateway } from './chat.gateway.js';
import { InternalChatService } from './internal-chat.service.js';

@ApiTags('internal-chat')
@Controller('internal-chat')
@UseGuards(JwtAuthGuard)
@RequireScopes('system', 'hotel')
@ApiBearerAuth()
export class InternalChatController {
  constructor(
    private readonly internalChatService: InternalChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('conversations')
  @ApiOperation({ summary: 'List system-admin to hotel-admin conversations' })
  @ApiQuery({ name: 'hotel_id', required: false })
  listConversations(
    @CurrentUser() user: TokenPayload,
    @Query('hotel_id') hotelId?: string,
  ) {
    return this.internalChatService.listSummaries(
      user,
      hotelId ? Number(hotelId) : undefined,
    );
  }

  @Get('hotels/:hotelId/messages')
  @ApiOperation({ summary: 'Get internal messages for a hotel' })
  @ApiParam({ name: 'hotelId' })
  getMessages(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.internalChatService.getMessages(hotelId, user);
  }

  @Get('hotels/:hotelId/staff-conversations')
  @ApiOperation({ summary: 'List staff-to-staff internal conversations' })
  @ApiParam({ name: 'hotelId' })
  listStaffConversations(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.internalChatService.listStaffSummaries(hotelId, user);
  }

  @Get('hotels/:hotelId/staff/:peerUserId/messages')
  @ApiOperation({ summary: 'Get internal messages with a hotel staff member' })
  @ApiParam({ name: 'hotelId' })
  @ApiParam({ name: 'peerUserId' })
  getStaffMessages(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Param('peerUserId', ParseIntPipe) peerUserId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.internalChatService.getStaffMessages(hotelId, user, peerUserId);
  }

  @Post('hotels/:hotelId/messages')
  @ApiOperation({ summary: 'Send an internal message' })
  @ApiParam({ name: 'hotelId' })
  async sendMessage(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Body() dto: SendInternalMessageDto,
    @CurrentUser() user: TokenPayload,
  ) {
    const result = await this.internalChatService.sendMessage(
      hotelId,
      user,
      dto.message,
    );
    this.chatGateway.emitInternalMessage(hotelId, result);
    return result;
  }

  @Post('hotels/:hotelId/staff/:peerUserId/messages')
  @ApiOperation({ summary: 'Send an internal message to a hotel staff member' })
  @ApiParam({ name: 'hotelId' })
  @ApiParam({ name: 'peerUserId' })
  async sendStaffMessage(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Param('peerUserId', ParseIntPipe) peerUserId: number,
    @Body() dto: SendInternalMessageDto,
    @CurrentUser() user: TokenPayload,
  ) {
    const result = await this.internalChatService.sendStaffMessage(
      hotelId,
      user,
      peerUserId,
      dto.message,
    );
    this.chatGateway.emitInternalMessage(hotelId, result);
    return result;
  }

  @Post('hotels/:hotelId/read')
  @ApiOperation({ summary: 'Mark internal messages as read' })
  @ApiParam({ name: 'hotelId' })
  async markRead(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    const conversation = await this.internalChatService.markRead(hotelId, user);
    this.chatGateway.emitInternalConversationRead(hotelId, conversation);
    return conversation;
  }

  @Post('hotels/:hotelId/staff/:peerUserId/read')
  @ApiOperation({ summary: 'Mark staff-to-staff internal messages as read' })
  @ApiParam({ name: 'hotelId' })
  @ApiParam({ name: 'peerUserId' })
  async markStaffRead(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Param('peerUserId', ParseIntPipe) peerUserId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    const conversation = await this.internalChatService.markStaffRead(
      hotelId,
      user,
      peerUserId,
    );
    this.chatGateway.emitInternalConversationRead(hotelId, conversation);
    return conversation;
  }
}
