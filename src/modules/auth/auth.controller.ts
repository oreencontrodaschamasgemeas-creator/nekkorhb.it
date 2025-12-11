import { Controller, Post, Body, Get, UseGuards, Request, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthorizeDto } from './dto/authorize.dto';
import { TokenRequestDto } from './dto/token-request.dto';
import { LogoutDto } from './dto/logout.dto';
import { IntrospectDto } from './dto/introspect.dto';
import { Scopes } from './decorators/scopes.decorator';
import { AuthScope } from './constants/scopes.constant';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Password grant login for first-party clients' })
  @ApiResponse({ status: 200, description: 'Token pair issued' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('authorize')
  @UseGuards(JwtAuthGuard)
  @Scopes(AuthScope.AUTH_AUTHORIZE)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Issue an authorization code for OAuth clients' })
  async authorize(@Body() authorizeDto: AuthorizeDto, @Request() req) {
    return this.authService.authorize(authorizeDto, req.user.userId);
  }

  @Post('token')
  @HttpCode(200)
  @ApiOperation({ summary: 'OAuth2 token endpoint (all grants)' })
  async token(@Body() tokenDto: TokenRequestDto) {
    return this.authService.token(tokenDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @Scopes(AuthScope.PROFILE_READ)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Revoke the active refresh token for the current user' })
  async logout(@Body() logoutDto: LogoutDto, @Request() req) {
    return this.authService.logout(req.user.userId, logoutDto);
  }

  @Post('introspect')
  @UseGuards(JwtAuthGuard)
  @Scopes(AuthScope.AUTH_INTROSPECT)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Introspect an access token' })
  async introspect(@Body() dto: IntrospectDto) {
    return this.authService.introspect(dto);
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  @Scopes(AuthScope.AUTH_METRICS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get aggregated authentication metrics' })
  async metrics() {
    return this.authService.getMetrics();
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @Scopes(AuthScope.PROFILE_READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }
}
