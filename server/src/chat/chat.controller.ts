import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ChatService } from './chat.service.js';
import { CreateSessionDto, SendMessageDto } from './dto/create-session.dto.js';
import { ChatSessionStatus } from './entities/chat.entity.js';
import { TranslationService } from './translation.service.js';
import {
  CurrentUser,
  JwtAuthGuard,
  RequireScopes,
} from '../auth/jwt-auth.guard.js';
import type { TokenPayload } from '../auth/token.service.js';
import { assertHotelAccess } from '../auth/hotel-access.js';
import { ChatReadActor } from './socket-events.js';
import {
  UpdateChatAssignmentDto,
  UpdateChatInternalNoteDto,
} from './dto/update-chat-assignment.dto.js';
import { assertPermission } from '../auth/permissions.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly translationService: TranslationService,
    private readonly auditLog: AuditLogService,
  ) {}

  // -------------------------------------------------------------------------
  // Guest — no auth (customer on hotel page)
  // -------------------------------------------------------------------------

  @Post('sessions')
  @ApiOperation({ summary: 'Create a new chat session (customer starts chat)' })
  @ApiResponse({ status: 201, description: 'Chat session created' })
  createSession(@Body() dto: CreateSessionDto) {
    return this.chatService.createSession(dto);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get chat session by ID' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  getSession(@Param('id', ParseIntPipe) id: number) {
    return this.chatService.getSession(id);
  }

  @Get('sessions/token/:token')
  @ApiOperation({ summary: 'Get chat session by customer token' })
  @ApiParam({ name: 'token', description: 'Customer token UUID' })
  getSessionByToken(@Param('token') token: string) {
    return this.chatService.getSessionByToken(token);
  }

  @Get('sessions/:id/messages')
  @ApiOperation({ summary: 'Get messages for a chat session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  getMessages(@Param('id', ParseIntPipe) id: number) {
    return this.chatService.getMessages(id);
  }

  @Post('sessions/:id/messages/customer')
  @ApiOperation({ summary: 'Send a message as customer' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  sendCustomerMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendCustomerMessage(id, dto);
  }

  @Post('sessions/:id/read')
  @ApiOperation({ summary: 'Mark messages as read (customer)' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiQuery({ name: 'by', enum: ChatReadActor })
  markReadGuest(
    @Param('id', ParseIntPipe) id: number,
    @Query('by') by: ChatReadActor = ChatReadActor.Customer,
  ) {
    if (by !== ChatReadActor.Customer) {
      throw new ForbiddenException('Staff read requires authentication');
    }
    return this.chatService.markMessagesRead(id, by);
  }

  // -------------------------------------------------------------------------
  // Staff — JWT required
  // -------------------------------------------------------------------------

  @Post('sessions/:id/messages/staff')
  @UseGuards(JwtAuthGuard)
  @RequireScopes('system', 'hotel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a message as staff' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async sendStaffMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: TokenPayload,
  ) {
    const session = await this.chatService.getSession(id);
    assertHotelAccess(user, Number(session.hotel_id));
    assertPermission(user, 'chat:handle');
    return this.chatService.sendStaffMessage(id, user.sub, dto);
  }

  @Patch('sessions/:id/status')
  @UseGuards(JwtAuthGuard)
  @RequireScopes('system', 'hotel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update session status (active, booked, closed)' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: ChatSessionStatus },
    @CurrentUser() user: TokenPayload,
  ) {
    const session = await this.chatService.getSession(id);
    assertHotelAccess(user, Number(session.hotel_id));
    assertPermission(user, 'chat:handle');
    const updated = await this.chatService.updateSessionStatus(
      id,
      body.status,
      user.sub,
    );
    void this.auditLog.record({
      actor: user,
      hotelId: Number(session.hotel_id),
      action:
        body.status === ChatSessionStatus.RESOLVED ||
        body.status === ChatSessionStatus.CLOSED
          ? 'conversation.resolved'
          : 'conversation.status_changed',
      targetType: 'chat_session',
      targetId: id,
      metadata: { from: session.status, to: body.status },
    });
    return updated;
  }

  @Patch('sessions/:id/assignment')
  @UseGuards(JwtAuthGuard)
  @RequireScopes('system', 'hotel')
  @ApiBearerAuth()
  async updateAssignment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChatAssignmentDto,
    @CurrentUser() user: TokenPayload,
  ) {
    const session = await this.chatService.getSession(id);
    assertHotelAccess(user, Number(session.hotel_id));
    assertPermission(user, 'chat:handle');
    const updated = await this.chatService.assignSession(id, dto);
    void this.auditLog.record({
      actor: user,
      hotelId: Number(session.hotel_id),
      action: 'chat.assigned',
      targetType: 'chat_session',
      targetId: id,
      metadata: dto as Record<string, unknown>,
    });
    return updated;
  }

  @Patch('sessions/:id/internal-note')
  @UseGuards(JwtAuthGuard)
  @RequireScopes('system', 'hotel')
  @ApiBearerAuth()
  async updateInternalNote(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChatInternalNoteDto,
    @CurrentUser() user: TokenPayload,
  ) {
    const session = await this.chatService.getSession(id);
    assertHotelAccess(user, Number(session.hotel_id));
    assertPermission(user, 'chat:handle');
    return this.chatService.updateInternalNote(id, dto.internal_note);
  }

  @Post('sessions/:id/read/staff')
  @UseGuards(JwtAuthGuard)
  @RequireScopes('system', 'hotel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark messages as read (staff)' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async markReadStaff(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    const session = await this.chatService.getSession(id);
    assertHotelAccess(user, Number(session.hotel_id));
    assertPermission(user, 'chat:handle');
    return this.chatService.markMessagesRead(id, ChatReadActor.Staff);
  }

  @Get('hotel/:hotelId/sessions')
  @UseGuards(JwtAuthGuard)
  @RequireScopes('system', 'hotel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all chat sessions for a hotel' })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiResponse({ status: 401, description: 'Missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Cross-hotel access denied' })
  getHotelSessions(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    assertHotelAccess(user, hotelId);
    assertPermission(user, 'chat:handle');
    return this.chatService.getHotelSessions(hotelId);
  }

  @Post('translate')
  @UseGuards(JwtAuthGuard)
  @RequireScopes('system', 'hotel')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Quick on-demand translation (used for canned responses preview, etc.)',
  })
  async translate(
    @Body() body: { text: string; source: string; target: string },
  ) {
    const result = await this.translationService.translate(
      body.text,
      body.source,
      body.target,
    );
    return result;
  }
}
