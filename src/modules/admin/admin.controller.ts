import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('admin')
@Controller('admin/settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new setting' })
  @ApiResponse({ status: 201, description: 'Setting created successfully' })
  @ApiResponse({ status: 409, description: 'Setting already exists' })
  create(@Body() createSettingDto: CreateSettingDto) {
    return this.adminService.create(createSettingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all settings' })
  @ApiResponse({ status: 200, description: 'List of all settings' })
  findAll() {
    return this.adminService.findAll();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a setting by key' })
  @ApiResponse({ status: 200, description: 'Setting found' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  findByKey(@Param('key') key: string) {
    return this.adminService.findByKey(key);
  }

  @Patch(':key')
  @ApiOperation({ summary: 'Update a setting' })
  @ApiResponse({ status: 200, description: 'Setting updated successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  update(@Param('key') key: string, @Body() updateSettingDto: UpdateSettingDto) {
    return this.adminService.update(key, updateSettingDto);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a setting' })
  @ApiResponse({ status: 200, description: 'Setting deleted successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found' })
  remove(@Param('key') key: string) {
    return this.adminService.remove(key);
  }
}
