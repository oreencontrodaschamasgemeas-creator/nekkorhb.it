import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { CreateAnnotationDto } from './dto/create-annotation.dto';
import { CreateEvidenceLinkDto } from './dto/create-evidence-link.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IncidentStatus } from './entities/incident.entity';

@ApiTags('incidents')
@Controller('incidents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new incident' })
  @ApiResponse({ status: 201, description: 'Incident created successfully' })
  create(@Body() createIncidentDto: CreateIncidentDto) {
    return this.incidentsService.create(createIncidentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all incidents with optional filters' })
  @ApiResponse({ status: 200, description: 'List of incidents' })
  @ApiQuery({ name: 'status', enum: IncidentStatus, required: false })
  @ApiQuery({ name: 'priority', type: String, required: false })
  @ApiQuery({ name: 'deviceId', type: String, required: false })
  findAll(
    @Query('status') status?: IncidentStatus,
    @Query('priority') priority?: string,
    @Query('deviceId') deviceId?: string,
  ) {
    return this.incidentsService.findAll({ status, priority, deviceId });
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get incident statistics' })
  @ApiResponse({ status: 200, description: 'Incident statistics' })
  getStats() {
    return this.incidentsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an incident by ID' })
  @ApiResponse({ status: 200, description: 'Incident found' })
  @ApiResponse({ status: 404, description: 'Incident not found' })
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an incident' })
  @ApiResponse({ status: 200, description: 'Incident updated successfully' })
  @ApiResponse({ status: 404, description: 'Incident not found' })
  @ApiResponse({ status: 400, description: 'Invalid state transition' })
  update(@Param('id') id: string, @Body() updateIncidentDto: UpdateIncidentDto) {
    return this.incidentsService.update(id, updateIncidentDto);
  }

  @Post(':id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge an incident' })
  @ApiResponse({ status: 200, description: 'Incident acknowledged' })
  @ApiResponse({ status: 404, description: 'Incident not found' })
  @ApiResponse({ status: 400, description: 'Incident already acknowledged' })
  acknowledge(@Param('id') id: string, @CurrentUser() user: any) {
    return this.incidentsService.acknowledge(id, user?.id);
  }

  @Post(':id/escalate')
  @ApiOperation({ summary: 'Check and escalate incident if SLA breached' })
  @ApiResponse({ status: 200, description: 'Incident escalation checked' })
  @ApiResponse({ status: 404, description: 'Incident not found' })
  escalate(@Param('id') id: string) {
    return this.incidentsService.checkAndEscalate(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an incident' })
  @ApiResponse({ status: 200, description: 'Incident deleted successfully' })
  @ApiResponse({ status: 404, description: 'Incident not found' })
  remove(@Param('id') id: string) {
    return this.incidentsService.remove(id);
  }

  // Annotations endpoints
  @Post(':id/annotations')
  @ApiOperation({ summary: 'Add an annotation to an incident' })
  @ApiResponse({ status: 201, description: 'Annotation created' })
  @ApiResponse({ status: 404, description: 'Incident not found' })
  createAnnotation(
    @Param('id') incidentId: string,
    @Body() createAnnotationDto: CreateAnnotationDto,
    @CurrentUser() user: any,
  ) {
    return this.incidentsService.createAnnotation(incidentId, createAnnotationDto, user?.id);
  }

  @Get(':id/annotations')
  @ApiOperation({ summary: 'Get all annotations for an incident' })
  @ApiResponse({ status: 200, description: 'List of annotations' })
  @ApiResponse({ status: 404, description: 'Incident not found' })
  getAnnotations(@Param('id') incidentId: string) {
    return this.incidentsService.getAnnotations(incidentId);
  }

  // Evidence links endpoints
  @Post(':id/evidence')
  @ApiOperation({ summary: 'Add evidence link to an incident' })
  @ApiResponse({ status: 201, description: 'Evidence link added' })
  @ApiResponse({ status: 404, description: 'Incident not found' })
  addEvidence(
    @Param('id') incidentId: string,
    @Body() createEvidenceLinkDto: CreateEvidenceLinkDto,
  ) {
    return this.incidentsService.addEvidenceLink(incidentId, createEvidenceLinkDto);
  }

  @Get(':id/evidence')
  @ApiOperation({ summary: 'Get all evidence links for an incident' })
  @ApiResponse({ status: 200, description: 'List of evidence links' })
  @ApiResponse({ status: 404, description: 'Incident not found' })
  getEvidence(@Param('id') incidentId: string) {
    return this.incidentsService.getEvidenceLinks(incidentId);
  }
}
