import {
  Controller,
  Get,
  Delete,
  Query,
  Param,
  UseGuards,
  Post,
  Body,
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
import { RecordingsService } from './recordings.service';
import { QueryRecordingsDto } from './dto/query-recordings.dto';

@ApiTags('Recordings')
@Controller('recordings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecordingsController {
  constructor(private readonly recordingsService: RecordingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get recordings with filters' })
  @ApiResponse({ status: 200, description: 'List of recordings' })
  async getRecordings(@Query() query: QueryRecordingsDto) {
    return this.recordingsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a recording by ID' })
  @ApiParam({ name: 'id', description: 'Recording ID' })
  @ApiResponse({ status: 200, description: 'Recording details' })
  async getRecording(@Param('id') id: string) {
    return this.recordingsService.findOne(id);
  }

  @Get(':id/playback-url')
  @ApiOperation({ summary: 'Get playback URL for a recording' })
  @ApiParam({ name: 'id', description: 'Recording ID' })
  @ApiQuery({ name: 'expiresIn', required: false, description: 'URL expiration in seconds' })
  @ApiResponse({ status: 200, description: 'Playback URL' })
  async getPlaybackUrl(
    @Param('id') id: string,
    @Query('expiresIn') expiresIn?: number,
  ) {
    const url = await this.recordingsService.getPlaybackUrl(
      id,
      expiresIn ? parseInt(expiresIn.toString(), 10) : 3600,
    );
    return { playbackUrl: url };
  }

  @Post(':id/link-incident')
  @ApiOperation({ summary: 'Link recording to an incident' })
  @ApiParam({ name: 'id', description: 'Recording ID' })
  @ApiResponse({ status: 200, description: 'Recording linked to incident' })
  async linkToIncident(
    @Param('id') id: string,
    @Body('incidentId') incidentId: string,
  ) {
    return this.recordingsService.linkToIncident(id, incidentId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a recording' })
  @ApiParam({ name: 'id', description: 'Recording ID' })
  @ApiResponse({ status: 200, description: 'Recording deleted' })
  async deleteRecording(@Param('id') id: string) {
    await this.recordingsService.delete(id);
    return { message: 'Recording deleted successfully' };
  }
}
