import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateChatAssignmentDto {
  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsNumber()
  assigned_to_user_id?: number;

  @ApiPropertyOptional({ example: 'customer_care' })
  @IsOptional()
  @IsString()
  assigned_group?: string;
}

export class UpdateChatInternalNoteDto {
  @ApiPropertyOptional({ example: 'Guest prefers Vietnamese reply.' })
  @IsOptional()
  @IsString()
  internal_note?: string;
}
