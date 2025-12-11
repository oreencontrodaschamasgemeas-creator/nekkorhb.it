import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
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
import { StreamIngestionService } from './stream-ingestion.service';
import { CreateStreamDto } from './dto/create-stream.dto';
import { UpdateStreamDto } from './dto/update-stream.dto';
import { StreamResponseDto } from './dto/stream-response.dto';

@ApiTags('CCTV')
@Controller('cctv')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CctvController {
  constructor(private readonly streamService: StreamIngestionService) {}

  @Post('streams')
  @ApiOperation({ summary: 'Create a new camera stream' })
  @ApiResponse({ status: 201, description: 'Stream created', type: StreamResponseDto })
  async createStream(@Body() createStreamDto: CreateStreamDto) {
    return this.streamService.create(createStreamDto);
  }

  @Get('streams')
  @ApiOperation({ summary: 'Get all camera streams' })
  @ApiResponse({ status: 200, description: 'List of streams', type: [StreamResponseDto] })
  async getAllStreams() {
    return this.streamService.findAll();
  }

  @Get('streams/:id')
  @ApiOperation({ summary: 'Get a camera stream by ID' })
  @ApiParam({ name: 'id', description: 'Stream ID' })
  @ApiResponse({ status: 200, description: 'Stream details', type: StreamResponseDto })
  async getStream(@Param('id') id: string) {
    return this.streamService.findOne(id);
  }

  @Get('devices/:deviceId/streams')
  @ApiOperation({ summary: 'Get streams for a device' })
  @ApiParam({ name: 'deviceId', description: 'Device ID' })
  @ApiResponse({ status: 200, description: 'List of streams', type: [StreamResponseDto] })
  async getDeviceStreams(@Param('deviceId') deviceId: string) {
    return this.streamService.findByDevice(deviceId);
  }

  @Patch('streams/:id')
  @ApiOperation({ summary: 'Update a camera stream' })
  @ApiParam({ name: 'id', description: 'Stream ID' })
  @ApiResponse({ status: 200, description: 'Stream updated', type: StreamResponseDto })
  async updateStream(
    @Param('id') id: string,
    @Body() updateStreamDto: UpdateStreamDto,
  ) {
    return this.streamService.update(id, updateStreamDto);
  }

  @Delete('streams/:id')
  @ApiOperation({ summary: 'Delete a camera stream' })
  @ApiParam({ name: 'id', description: 'Stream ID' })
  @ApiResponse({ status: 200, description: 'Stream deleted' })
  async deleteStream(@Param('id') id: string) {
    await this.streamService.delete(id);
    return { message: 'Stream deleted successfully' };
  }

  @Post('streams/:id/start')
  @ApiOperation({ summary: 'Start a camera stream' })
  @ApiParam({ name: 'id', description: 'Stream ID' })
  @ApiResponse({ status: 200, description: 'Stream starting', type: StreamResponseDto })
  async startStream(@Param('id') id: string) {
    return this.streamService.start(id);
  }

  @Post('streams/:id/stop')
  @ApiOperation({ summary: 'Stop a camera stream' })
  @ApiParam({ name: 'id', description: 'Stream ID' })
  @ApiResponse({ status: 200, description: 'Stream stopping', type: StreamResponseDto })
  async stopStream(@Param('id') id: string) {
    return this.streamService.stop(id);
  }

  @Get('streams/:id/health')
  @ApiOperation({ summary: 'Check stream health' })
  @ApiParam({ name: 'id', description: 'Stream ID' })
  @ApiResponse({ status: 200, description: 'Health status' })
  async checkHealth(@Param('id') id: string) {
    return this.streamService.healthCheck(id);
  }

  @Get('streams/:id/live-url')
  @ApiOperation({ summary: 'Get live stream URL' })
  @ApiParam({ name: 'id', description: 'Stream ID' })
  @ApiResponse({ status: 200, description: 'Live stream URLs' })
  async getLiveUrl(@Param('id') id: string) {
    const stream = await this.streamService.findOne(id);
    return {
      webrtcUrl: stream.webrtcUrl,
      hlsUrl: stream.hlsUrl,
      status: stream.status,
    };
  }
}
