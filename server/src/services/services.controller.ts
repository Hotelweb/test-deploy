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
import { ServicesService } from './services.service.js';
import { CreateServiceDto } from './dto/create-service.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { TokenPayload } from '../auth/token.service.js';
import { assertHotelAccess } from '../auth/hotel-access.js';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // ----------------------------------------------------------------------
  // Public — used by the customer-facing hotel detail page
  // ----------------------------------------------------------------------

  @Get('hotel/:hotelId')
  @ApiOperation({
    summary: 'Public list of active services for a hotel',
    description:
      'Returns only active, non-deleted services. Each item includes the ' +
      'translation matching `lang` (with English / first-available fallback) ' +
      'plus the full translation set so the frontend can switch language ' +
      'without another round-trip.',
  })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Language code (vi, en, ja, zh, ko, th)',
  })
  @ApiResponse({ status: 200, description: 'List of services for the hotel' })
  findByHotel(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Query('lang') lang?: string,
  ) {
    return this.servicesService.findByHotel(hotelId, lang);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single service by ID (public)',
    description:
      'Used by the customer-facing service detail view to render markdown content.',
  })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiQuery({ name: 'lang', required: false })
  @ApiResponse({ status: 200, description: 'Service details' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('lang') lang?: string,
  ) {
    return this.servicesService.findOneView(id, lang);
  }

  // ----------------------------------------------------------------------
  // Admin — manage screen
  // ----------------------------------------------------------------------

  @Get('admin/hotel/:hotelId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all services (incl. inactive) for an admin',
    description:
      'System admins can list any hotel; hotel users can only list their own.',
  })
  @ApiParam({ name: 'hotelId', description: 'Hotel ID' })
  @ApiResponse({ status: 200, description: 'List of services' })
  @ApiResponse({ status: 401, description: 'Missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Cross-hotel access denied' })
  findByHotelForAdmin(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    assertHotelAccess(user, hotelId);
    return this.servicesService.findByHotelForAdmin(hotelId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a service for a hotel',
    description:
      'System admins or the hotel admin of the target hotel may create services. ' +
      'Translations are required (at least one language).',
  })
  @ApiResponse({ status: 201, description: 'Service created' })
  @ApiResponse({ status: 401, description: 'Missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Cross-hotel access denied' })
  create(@Body() dto: CreateServiceDto, @CurrentUser() user: TokenPayload) {
    assertHotelAccess(user, dto.hotel_id);
    return this.servicesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a service',
    description:
      'Replace any subset of fields. Including `translations` replaces the ' +
      'full translation set for that service.',
  })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiResponse({ status: 200, description: 'Service updated' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceDto,
    @CurrentUser() user: TokenPayload,
  ) {
    const target = await this.servicesService.findOne(id);
    assertHotelAccess(user, Number(target.hotel_id));
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete a service',
    description:
      'Marks the service as deleted and inactive. Hidden from public listings ' +
      'but preserved for audit/history.',
  })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiResponse({ status: 204, description: 'Service deleted' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    const target = await this.servicesService.findOne(id);
    assertHotelAccess(user, Number(target.hotel_id));
    return this.servicesService.softDelete(id);
  }
}
