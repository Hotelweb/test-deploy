import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AssignFoodOrderDto {
  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsNumber()
  assigned_to_user_id?: number;

  @ApiPropertyOptional({ example: 'kitchen' })
  @IsOptional()
  @IsString()
  assigned_group?: string;
}
