import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Scopes } from '../auth/decorators/scopes.decorator';
import { AuthScope } from '../auth/constants/scopes.constant';

@ApiTags('incidents')
@Controller('incidents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @Scopes(AuthScope.INCIDENTS_WRITE)
  @ApiOperation({ summary: 'Create a new incident' })
  @ApiResponse({ status: 201, description: 'Incident created successfully' })
  create(@Body() createIncidentDto: CreateIncidentDto) {
    return this.incidentsService.create(createIncidentDto);
  }

  @Get()
  @Scopes(AuthScope.INCIDENTS_READ)
  @ApiOperation({ summary: 'Get all incidents' })
  @ApiResponse({ status: 200, description: 'List of all incidents' })
  findAll() {
    return this.incidentsService.findAll();
  }

  @Get(':id')
  @Scopes(AuthScope.INCIDENTS_READ)
  @ApiOperation({ summary: 'Get an incident by ID' })
  @ApiResponse({ status: 200, description: 'Incident found' })
  @ApiResponse({ status: 404, description: 'Incident not found' })
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id')
  @Scopes(AuthScope.INCIDENTS_WRITE)
  @ApiOperation({ summary: 'Update an incident' })
  @ApiResponse({ status: 200, description: 'Incident updated successfully' })
  @ApiResponse({ status: 404, description: 'Incident not found' })
  update(@Param('id') id: string, @Body() updateIncidentDto: UpdateIncidentDto) {
    return this.incidentsService.update(id, updateIncidentDto);
  }

  @Delete(':id')
  @Scopes(AuthScope.INCIDENTS_WRITE)
  @ApiOperation({ summary: 'Delete an incident' })
  @ApiResponse({ status: 200, description: 'Incident deleted successfully' })
  @ApiResponse({ status: 404, description: 'Incident not found' })
  remove(@Param('id') id: string) {
    return this.incidentsService.remove(id);
  }
}
