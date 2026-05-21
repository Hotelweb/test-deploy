import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem } from './entities/menu-item.entity.js';
import { FoodOrder, FoodOrderItem } from './entities/food-order.entity.js';
import { FoodOrderService } from './food-order.service.js';
import { FoodOrderController } from './food-order.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { ChatModule } from '../chat/chat.module.js';
import { FoodOrderStatsService } from './services/food-order-stats.service.js';
import { MenuManagementService } from './services/menu-management.service.js';
import { OrderManagementService } from './services/order-management.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([MenuItem, FoodOrder, FoodOrderItem]),
    AuthModule,
    ChatModule,
  ],
  controllers: [FoodOrderController],
  providers: [
    FoodOrderService,
    MenuManagementService,
    OrderManagementService,
    FoodOrderStatsService,
  ],
  exports: [FoodOrderService],
})
export class FoodOrderModule {}
