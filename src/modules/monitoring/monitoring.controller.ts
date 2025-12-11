import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';
import { CreateMonitoringFeedDto } from './dto/create-monitoring-feed.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('monitoring')
@Controller('monitoring')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new monitoring feed entry' })
  @ApiResponse({ status: 201, description: 'Feed entry created successfully' })
  create(@Body() createMonitoringFeedDto: CreateMonitoringFeedDto) {
    return this.monitoringService.create(createMonitoringFeedDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all monitoring feed entries' })
  @ApiResponse({ status: 200, description: 'List of monitoring feeds' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query('limit') limit?: number) {
    return this.monitoringService.findAll(limit || 100);
  }

  @Get('device/:deviceId')
  @ApiOperation({ summary: 'Get monitoring feeds by device ID' })
  @ApiResponse({ status: 200, description: 'List of device monitoring feeds' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByDevice(@Query('deviceId') deviceId: string, @Query('limit') limit?: number) {
    return this.monitoringService.findByDevice(deviceId, limit || 50);
  }
}
