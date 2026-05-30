import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendInternalMessageDto {
  @ApiProperty({ example: 'Khách sạn cần hỗ trợ cấu hình tài khoản.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message: string;
}
