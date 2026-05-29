import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../common/pagination/pagination.dto.js';
import { CreateFoodOrderDto } from './dto/create-food-order.dto.js';
import { CreateMenuItemDto } from './dto/create-menu-item.dto.js';
import { UpdateFoodOrderStatusDto } from './dto/update-food-order-status.dto.js';
import { AssignFoodOrderDto } from './dto/assign-food-order.dto.js';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto.js';
import type { FoodOrderStatus } from './entities/food-order.entity.js';
import type { MenuItem } from './entities/menu-item.entity.js';
import { FoodOrderStatsService } from './services/food-order-stats.service.js';
import { MenuManagementService } from './services/menu-management.service.js';
import { OrderManagementService } from './services/order-management.service.js';
import type {
  FoodOrderAnalytics,
  FoodOrderStats,
  FoodOrderView,
  MenuItemView,
} from './types/food-order.types.js';

export type {
  FoodOrderAnalytics,
  FoodOrderAnalyticsCategory,
  FoodOrderAnalyticsHour,
  FoodOrderAnalyticsItem,
  FoodOrderAnalyticsStatus,
  FoodOrderItemView,
  FoodOrderStats,
  FoodOrderView,
  MenuItemView,
} from './types/food-order.types.js';

@Injectable()
export class FoodOrderService {
  constructor(
    private readonly menuManagement: MenuManagementService,
    private readonly orderManagement: OrderManagementService,
    private readonly statsService: FoodOrderStatsService,
  ) {}

  getPublicMenu(hotelId: number, lang?: string): Promise<MenuItemView[]> {
    return this.menuManagement.getPublicMenu(hotelId, lang);
  }

  getMenuForAdmin(hotelId: number): Promise<MenuItemView[]> {
    return this.menuManagement.getMenuForAdmin(hotelId);
  }

  createMenuItem(dto: CreateMenuItemDto): Promise<MenuItemView> {
    return this.menuManagement.createMenuItem(dto);
  }

  updateMenuItem(id: number, dto: UpdateMenuItemDto): Promise<MenuItemView> {
    return this.menuManagement.updateMenuItem(id, dto);
  }

  deleteMenuItem(id: number): Promise<void> {
    return this.menuManagement.deleteMenuItem(id);
  }

  findMenuItem(id: number): Promise<MenuItem> {
    return this.menuManagement.findMenuItem(id);
  }

  createOrder(dto: CreateFoodOrderDto): Promise<FoodOrderView> {
    return this.orderManagement.createOrder(dto);
  }

  getOrdersForAdmin(
    hotelId: number,
    pagination: PaginationQueryDto,
    status?: FoodOrderStatus,
  ) {
    return this.orderManagement.getOrdersForAdmin(hotelId, pagination, status);
  }

  getOrder(id: number): Promise<FoodOrderView> {
    return this.orderManagement.getOrder(id);
  }

  updateOrderStatus(
    id: number,
    dto: UpdateFoodOrderStatusDto,
    handledBy?: number,
  ): Promise<FoodOrderView> {
    return this.orderManagement.updateOrderStatus(id, dto, handledBy);
  }

  assignOrder(id: number, dto: AssignFoodOrderDto): Promise<FoodOrderView> {
    return this.orderManagement.assignOrder(id, dto);
  }

  getStats(hotelId: number): Promise<FoodOrderStats> {
    return this.statsService.getStats(hotelId);
  }

  getAnalytics(hotelId: number): Promise<FoodOrderAnalytics> {
    return this.statsService.getAnalytics(hotelId);
  }

  countPending(hotelId: number): Promise<number> {
    return this.orderManagement.countPending(hotelId);
  }
}
