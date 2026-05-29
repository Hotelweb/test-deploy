import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import type { FoodOrderStatus } from '../entities/food-order.entity.js';

export const FOOD_ORDER_STATUSES: FoodOrderStatus[] = [
  'new',
  'accepted',
  'preparing',
  'delivering',
  'completed',
  'cancelled',
  'rejected',
];

export class UpdateFoodOrderStatusDto {
  @ApiProperty({
    enum: [
      'new',
      'accepted',
      'preparing',
      'delivering',
      'completed',
      'cancelled',
      'rejected',
    ],
  })
  @IsIn(FOOD_ORDER_STATUSES)
  status: FoodOrderStatus;

  @ApiPropertyOptional({ description: 'Required when rejecting an order' })
  @IsOptional()
  @IsString()
  rejected_reason?: string;
}
