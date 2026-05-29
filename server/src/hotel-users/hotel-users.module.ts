import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HotelUser } from './entities/hotel-user.entity.js';
import { HotelUsersService } from './hotel-users.service.js';
import { HotelUsersController } from './hotel-users.controller.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([HotelUser]), AuditLogModule],
  controllers: [HotelUsersController],
  providers: [HotelUsersService],
  exports: [HotelUsersService],
})
export class HotelUsersModule {}
