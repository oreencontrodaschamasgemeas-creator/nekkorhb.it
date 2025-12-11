import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessDeviceService } from './access-device.service';
import { RegisterAccessDeviceDto } from './dto/register-access-device.dto';
import { ValidateCredentialDto } from './dto/validate-credential.dto';
import { CreateAccessRuleDto } from './dto/create-access-rule.dto';
import { ValidationResponseDto } from './dto/validation-response.dto';
import { AccessDevice } from './entities/access-device.entity';
import { AccessRule } from './entities/access-rule.entity';

@ApiTags('access-device')
@Controller('access-device')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccessDeviceController {
  constructor(private readonly accessDeviceService: AccessDeviceService) {}

  // Device Management
  @Post('devices/register')
  @ApiOperation({ summary: 'Register a new access control device' })
  @ApiResponse({
    status: 201,
    description: 'Device registered successfully',
    type: AccessDevice,
  })
  async registerDevice(@Body() registerDto: RegisterAccessDeviceDto): Promise<AccessDevice> {
    return this.accessDeviceService.registerDevice(registerDto);
  }

  @Get('devices')
  @ApiOperation({ summary: 'Get all registered access control devices' })
  @ApiResponse({
    status: 200,
    description: 'List of devices',
    type: [AccessDevice],
  })
  async getAllDevices(): Promise<AccessDevice[]> {
    return this.accessDeviceService.getAllDevices();
  }

  @Get('devices/:deviceId')
  @ApiOperation({ summary: 'Get a specific access control device' })
  @ApiResponse({
    status: 200,
    description: 'Device details',
    type: AccessDevice,
  })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async getDevice(@Param('deviceId') deviceId: string): Promise<AccessDevice> {
    return this.accessDeviceService.getDevice(deviceId);
  }

  @Get('devices/zone/:zone')
  @ApiOperation({ summary: 'Get devices by zone' })
  @ApiResponse({
    status: 200,
    description: 'Devices in zone',
    type: [AccessDevice],
  })
  async getDevicesByZone(@Param('zone') zone: string): Promise<AccessDevice[]> {
    return this.accessDeviceService.getDevicesByZone(zone);
  }

  @Get('devices/status/online')
  @ApiOperation({ summary: 'Get all online devices' })
  @ApiResponse({
    status: 200,
    description: 'Online devices',
    type: [AccessDevice],
  })
  async getOnlineDevices(): Promise<AccessDevice[]> {
    return this.accessDeviceService.getOnlineDevices();
  }

  // Credential Validation
  @Post('validate')
  @ApiOperation({ summary: 'Validate credential and grant/deny access' })
  @ApiResponse({
    status: 200,
    description: 'Validation result',
    type: ValidationResponseDto,
  })
  async validateCredential(
    @Body() validateDto: ValidateCredentialDto,
  ): Promise<ValidationResponseDto> {
    return this.accessDeviceService.validateCredential(validateDto);
  }

  @Post('validate/async')
  @ApiOperation({
    summary: 'Validate credential asynchronously (returns job ID)',
  })
  @ApiResponse({
    status: 202,
    description: 'Validation job queued',
  })
  async validateCredentialAsync(
    @Body() validateDto: ValidateCredentialDto,
  ): Promise<{ jobId: string }> {
    return this.accessDeviceService.validateCredentialAsync(validateDto);
  }

  // Access Rules
  @Post('rules')
  @ApiOperation({ summary: 'Create an access rule' })
  @ApiResponse({
    status: 201,
    description: 'Rule created',
    type: AccessRule,
  })
  async createAccessRule(@Body() createDto: CreateAccessRuleDto): Promise<AccessRule> {
    return this.accessDeviceService.createAccessRule(createDto);
  }

  @Get('rules')
  @ApiOperation({ summary: 'Get all access rules' })
  @ApiResponse({
    status: 200,
    description: 'List of rules',
    type: [AccessRule],
  })
  async getAllAccessRules(): Promise<AccessRule[]> {
    // Get rules for current user - in production, extract from JWT
    return [];
  }

  @Get('rules/user/:userId')
  @ApiOperation({ summary: 'Get access rules for a user' })
  @ApiResponse({
    status: 200,
    description: 'User rules',
    type: [AccessRule],
  })
  async getAccessRulesForUser(@Param('userId') userId: string): Promise<AccessRule[]> {
    return this.accessDeviceService.getAccessRulesForUser(userId);
  }

  @Get('rules/:ruleId')
  @ApiOperation({ summary: 'Get a specific access rule' })
  @ApiResponse({
    status: 200,
    description: 'Rule details',
    type: AccessRule,
  })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  async getAccessRule(@Param('ruleId') ruleId: string): Promise<AccessRule> {
    return this.accessDeviceService.getAccessRule(ruleId);
  }

  @Patch('rules/:ruleId')
  @ApiOperation({ summary: 'Update an access rule' })
  @ApiResponse({
    status: 200,
    description: 'Rule updated',
    type: AccessRule,
  })
  async updateAccessRule(
    @Param('ruleId') ruleId: string,
    @Body() updateDto: Partial<CreateAccessRuleDto>,
  ): Promise<AccessRule> {
    return this.accessDeviceService.updateAccessRule(ruleId, updateDto);
  }

  @Delete('rules/:ruleId')
  @ApiOperation({ summary: 'Delete an access rule' })
  @ApiResponse({ status: 200, description: 'Rule deleted' })
  async deleteAccessRule(@Param('ruleId') ruleId: string): Promise<void> {
    return this.accessDeviceService.deleteAccessRule(ruleId);
  }

  @Post('rules/:ruleId/disable')
  @ApiOperation({ summary: 'Disable an access rule' })
  @ApiResponse({
    status: 200,
    description: 'Rule disabled',
    type: AccessRule,
  })
  async disableAccessRule(@Param('ruleId') ruleId: string): Promise<AccessRule> {
    return this.accessDeviceService.disableAccessRule(ruleId);
  }

  @Post('rules/:ruleId/enable')
  @ApiOperation({ summary: 'Enable an access rule' })
  @ApiResponse({
    status: 200,
    description: 'Rule enabled',
    type: AccessRule,
  })
  async enableAccessRule(@Param('ruleId') ruleId: string): Promise<AccessRule> {
    return this.accessDeviceService.enableAccessRule(ruleId);
  }
}
