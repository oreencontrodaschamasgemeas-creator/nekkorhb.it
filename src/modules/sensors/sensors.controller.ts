import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SensorIngestionService } from './sensor-ingestion.service';
import { IngestEventDto } from './dto/ingest-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';

@ApiTags('Sensors')
@Controller('sensors')
export class SensorsController {
  constructor(private readonly sensorService: SensorIngestionService) {}

  @Post('events')
  @ApiOperation({ summary: 'Ingest a sensor event' })
  @ApiResponse({ status: 201, description: 'Event ingested' })
  async ingestEvent(@Body() ingestDto: IngestEventDto) {
    return this.sensorService.ingest(ingestDto);
  }

  @Get('events')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get sensor events with filters' })
  @ApiResponse({ status: 200, description: 'List of sensor events' })
  async getEvents(@Query() query: QueryEventsDto) {
    return this.sensorService.findAll(query);
  }

  @Get('events/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a sensor event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event details' })
  async getEvent(@Param('id') id: string) {
    return this.sensorService.findOne(id);
  }

  @Get('devices/:deviceId/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get sensor event history for a device' })
  @ApiParam({ name: 'deviceId', description: 'Device ID' })
  @ApiResponse({ status: 200, description: 'Event history' })
  async getHistory(
    @Param('deviceId') deviceId: string,
    @Query('hours') hours?: number,
  ) {
    return this.sensorService.getEventHistory(
      deviceId,
      hours ? parseInt(hours.toString(), 10) : 24,
    );
  }

  @Get('devices/:deviceId/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get sensor event statistics for a device' })
  @ApiParam({ name: 'deviceId', description: 'Device ID' })
  @ApiResponse({ status: 200, description: 'Event statistics' })
  async getStats(
    @Param('deviceId') deviceId: string,
    @Query('hours') hours?: number,
  ) {
    return this.sensorService.getEventStats(
      deviceId,
      hours ? parseInt(hours.toString(), 10) : 24,
    );
  }
}
