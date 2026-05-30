import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { TokenPayload } from '../auth/token.service.js';
import { FoodOrderService } from './food-order.service.js';
import { CreateMenuItemDto } from './dto/create-menu-item.dto.js';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto.js';
import { CreateFoodOrderDto } from './dto/create-food-order.dto.js';
import { UpdateFoodOrderStatusDto } from './dto/update-food-order-status.dto.js';
import { AssignFoodOrderDto } from './dto/assign-food-order.dto.js';
import type { FoodOrderStatus } from './entities/food-order.entity.js';
import { PaginationQueryDto } from '../common/pagination/pagination.dto.js';
import { ChatGateway } from '../chat/chat.gateway.js';
import { assertHotelAccess } from '../auth/hotel-access.js';
import { assertPermission } from '../auth/permissions.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';

@ApiTags('food-order')
@Controller('food-order')
export class FoodOrderController {
  constructor(
    private readonly foodOrderService: FoodOrderService,
    private readonly chatGateway: ChatGateway,
    private readonly auditLog: AuditLogService,
  ) {}

  // -------------------------------------------------------------------------
  // Public — guest menu & ordering
  // -------------------------------------------------------------------------

  @Get('menu/hotel/:hotelId')
  @ApiOperation({ summary: 'Public menu for guests' })
  @ApiParam({ name: 'hotelId' })
  @ApiQuery({ name: 'lang', required: false })
  getPublicMenu(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Query('lang') lang?: string,
  ) {
    return this.foodOrderService.getPublicMenu(hotelId, lang);
  }

  @Post('orders')
  @ApiOperation({ summary: 'Place a food/drink order (guest)' })
  @ApiResponse({ status: 201, description: 'Order created' })
  async createOrder(@Body() dto: CreateFoodOrderDto) {
    const order = await this.foodOrderService.createOrder(dto);
    this.chatGateway.emitOrderCreated(order);
    return order;
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order status (guest tracking)' })
  getOrder(@Param('id', ParseIntPipe) id: number) {
    return this.foodOrderService.getOrder(id);
  }

  // -------------------------------------------------------------------------
  // Admin — menu, orders, stats
  // -------------------------------------------------------------------------

  @Get('admin/menu/hotel/:hotelId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMenuAdmin(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    assertHotelAccess(user, hotelId);
    assertPermission(user, 'services:manage');
    return this.foodOrderService.getMenuForAdmin(hotelId);
  }

  @Post('admin/menu')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createMenuItem(
    @Body() dto: CreateMenuItemDto,
    @CurrentUser() user: TokenPayload,
  ) {
    assertHotelAccess(user, dto.hotel_id);
    assertPermission(user, 'services:manage');
    return this.foodOrderService.createMenuItem(dto);
  }

  @Patch('admin/menu/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateMenuItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMenuItemDto,
    @CurrentUser() user: TokenPayload,
  ) {
    const item = await this.foodOrderService.findMenuItem(id);
    assertHotelAccess(user, Number(item.hotel_id));
    assertPermission(user, 'services:manage');
    return this.foodOrderService.updateMenuItem(id, dto);
  }

  @Delete('admin/menu/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMenuItem(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    const item = await this.foodOrderService.findMenuItem(id);
    assertHotelAccess(user, Number(item.hotel_id));
    assertPermission(user, 'services:manage');
    return this.foodOrderService.deleteMenuItem(id);
  }

  @Get('admin/orders/hotel/:hotelId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'per_page', required: false, type: Number, example: 20 })
  getOrdersAdmin(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Query() pagination: PaginationQueryDto,
    @Query('status') status?: FoodOrderStatus,
    @CurrentUser() user?: TokenPayload,
  ) {
    assertHotelAccess(user!, hotelId);
    assertPermission(user!, 'orders:view');
    return this.foodOrderService.getOrdersForAdmin(hotelId, pagination, status);
  }

  @Patch('admin/orders/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFoodOrderStatusDto,
    @CurrentUser() user: TokenPayload,
  ) {
    const order = await this.foodOrderService.getOrder(id);
    assertHotelAccess(user, order.hotel_id);
    assertPermission(user, 'orders:update');
    const updated = await this.foodOrderService.updateOrderStatus(id, dto, user.sub);
    void this.auditLog.record({
      actor: user,
      hotelId: order.hotel_id,
      action: 'order.status_changed',
      targetType: 'food_order',
      targetId: id,
      metadata: { from: order.status, to: dto.status },
    });
    this.chatGateway.emitOrderStatusChanged(updated);
    return updated;
  }

  @Patch('admin/orders/:id/assignment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async assignOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignFoodOrderDto,
    @CurrentUser() user: TokenPayload,
  ) {
    const order = await this.foodOrderService.getOrder(id);
    assertHotelAccess(user, order.hotel_id);
    assertPermission(user, 'orders:update');
    const updated = await this.foodOrderService.assignOrder(id, dto);
    void this.auditLog.record({
      actor: user,
      hotelId: order.hotel_id,
      action: 'order.assigned',
      targetType: 'food_order',
      targetId: id,
      metadata: dto as Record<string, unknown>,
    });
    this.chatGateway.emitOrderStatusChanged(updated);
    return updated;
  }

  @Get('admin/stats/hotel/:hotelId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getStats(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    assertHotelAccess(user, hotelId);
    assertPermission(user, 'reports:view');
    return this.foodOrderService.getStats(hotelId);
  }

  @Get('admin/analytics/hotel/:hotelId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Food order analytics for admin dashboards',
    description:
      'Aggregated order trends for charts: best-selling items, top revenue items, peak ordering hours, status and category breakdowns.',
  })
  getAnalytics(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    assertHotelAccess(user, hotelId);
    assertPermission(user, 'reports:view');
    return this.foodOrderService.getAnalytics(hotelId);
  }

  @Get('admin/pending-count/hotel/:hotelId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getPendingCount(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    assertHotelAccess(user, hotelId);
    assertPermission(user, 'orders:view');
    return this.foodOrderService.countPending(hotelId);
  }
}
