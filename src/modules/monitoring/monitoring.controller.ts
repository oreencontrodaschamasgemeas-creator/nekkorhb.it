import { Controller, Get, Post, Body, Query, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';
import { CreateMonitoringFeedDto } from './dto/create-monitoring-feed.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Scopes } from '../auth/decorators/scopes.decorator';
import { AuthScope } from '../auth/constants/scopes.constant';

@ApiTags('monitoring')
@Controller('monitoring')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Post()
  @Scopes(AuthScope.MONITORING_WRITE)
  @ApiOperation({ summary: 'Create a new monitoring feed entry' })
  @ApiResponse({ status: 201, description: 'Feed entry created successfully' })
  create(@Body() createMonitoringFeedDto: CreateMonitoringFeedDto) {
    return this.monitoringService.create(createMonitoringFeedDto);
  }

  @Get()
  @Scopes(AuthScope.MONITORING_READ)
  @ApiOperation({ summary: 'Get all monitoring feed entries' })
  @ApiResponse({ status: 200, description: 'List of monitoring feeds' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query('limit') limit?: number) {
    return this.monitoringService.findAll(limit || 100);
  }

  @Get('device/:deviceId')
  @Scopes(AuthScope.MONITORING_READ)
  @ApiOperation({ summary: 'Get monitoring feeds by device ID' })
  @ApiResponse({ status: 200, description: 'List of device monitoring feeds' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByDevice(@Param('deviceId') deviceId: string, @Query('limit') limit?: number) {
    return this.monitoringService.findByDevice(deviceId, limit || 50);
  }
}
