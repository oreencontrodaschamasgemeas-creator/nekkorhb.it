import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AlertDetectionService } from './alert-detection.service';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { AlertType, AlertSeverity, AlertStatus } from './entities/alert.entity';

@ApiTags('Alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private readonly alertService: AlertDetectionService) {}

  @Get()
  @ApiOperation({ summary: 'Get alerts with filters' })
  @ApiQuery({ name: 'deviceId', required: false })
  @ApiQuery({ name: 'type', enum: AlertType, required: false })
  @ApiQuery({ name: 'severity', enum: AlertSeverity, required: false })
  @ApiQuery({ name: 'status', enum: AlertStatus, required: false })
  @ApiResponse({ status: 200, description: 'List of alerts' })
  async getAlerts(
    @Query('deviceId') deviceId?: string,
    @Query('type') type?: AlertType,
    @Query('severity') severity?: AlertSeverity,
    @Query('status') status?: AlertStatus,
  ) {
    return this.alertService.findAll({ deviceId, type, severity, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an alert by ID' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({ status: 200, description: 'Alert details' })
  async getAlert(@Param('id') id: string) {
    return this.alertService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an alert' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({ status: 200, description: 'Alert updated' })
  async updateAlert(
    @Param('id') id: string,
    @Body() updateDto: UpdateAlertDto,
  ) {
    if (updateDto.status === AlertStatus.ACKNOWLEDGED) {
      return this.alertService.acknowledge(id, 'current-user-id');
    } else if (updateDto.status === AlertStatus.RESOLVED) {
      return this.alertService.resolve(id);
    } else if (updateDto.status === AlertStatus.DISMISSED) {
      return this.alertService.dismiss(id);
    }
  }

  @Post(':id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge an alert' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged' })
  async acknowledgeAlert(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId || 'current-user-id';
    return this.alertService.acknowledge(id, userId);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Resolve an alert' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({ status: 200, description: 'Alert resolved' })
  async resolveAlert(@Param('id') id: string) {
    return this.alertService.resolve(id);
  }

  @Post(':id/dismiss')
  @ApiOperation({ summary: 'Dismiss an alert' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({ status: 200, description: 'Alert dismissed' })
  async dismissAlert(@Param('id') id: string) {
    return this.alertService.dismiss(id);
  }

  @Post(':id/link-incident')
  @ApiOperation({ summary: 'Link alert to an incident' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({ status: 200, description: 'Alert linked to incident' })
  async linkToIncident(
    @Param('id') id: string,
    @Body('incidentId') incidentId: string,
  ) {
    return this.alertService.linkToIncident(id, incidentId);
  }
}
