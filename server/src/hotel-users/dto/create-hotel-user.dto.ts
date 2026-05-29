import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { HotelStaffRole } from '../entities/hotel-user.entity.js';

export class CreateHotelUserDto {
  @ApiProperty({ example: 1, description: 'Hotel ID this admin belongs to' })
  @IsNumber()
  hotel_id: number;

  @ApiProperty({ example: 'admin@hotel.vn' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsString()
  avatar_url?: string;

  @ApiPropertyOptional({
    enum: HotelStaffRole,
    example: HotelStaffRole.RECEPTION,
  })
  @IsOptional()
  @IsEnum(HotelStaffRole)
  role?: HotelStaffRole;
}
