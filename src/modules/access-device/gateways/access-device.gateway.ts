import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AccessDeviceService } from '../access-device.service';
import { ValidateCredentialDto } from '../dto/validate-credential.dto';
import { ValidationResponseDto } from '../dto/validation-response.dto';

@WebSocketGateway({
  namespace: '/access-device',
  cors: {
    origin: '*',
  },
})
export class AccessDeviceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AccessDeviceGateway.name);

  constructor(private accessDeviceService: AccessDeviceService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Access device client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Access device client disconnected: ${client.id}`);
  }

  @SubscribeMessage('validate-credential')
  async handleValidateCredential(
    @MessageBody() validateDto: ValidateCredentialDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const result = await this.accessDeviceService.validateCredential(validateDto);

      // Send result back to the requesting client
      client.emit('validation-result', result);

      // Broadcast to interested clients (device operators, security center)
      this.broadcastValidationEvent(result);
    } catch (error) {
      this.logger.error(`Validation error: ${error.message}`);
      client.emit('validation-error', {
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  @SubscribeMessage('subscribe-device')
  handleSubscribeDevice(
    @MessageBody() data: { deviceId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const room = `device:${data.deviceId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to device ${data.deviceId}`);
    client.emit('subscribed', { deviceId: data.deviceId });
  }

  @SubscribeMessage('unsubscribe-device')
  handleUnsubscribeDevice(
    @MessageBody() data: { deviceId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const room = `device:${data.deviceId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} unsubscribed from device ${data.deviceId}`);
    client.emit('unsubscribed', { deviceId: data.deviceId });
  }

  @SubscribeMessage('subscribe-zone')
  handleSubscribeZone(
    @MessageBody() data: { zone: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const room = `zone:${data.zone}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to zone ${data.zone}`);
    client.emit('subscribed-zone', { zone: data.zone });
  }

  @SubscribeMessage('subscribe-user')
  handleSubscribeUser(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const room = `user:${data.userId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to user ${data.userId}`);
    client.emit('subscribed-user', { userId: data.userId });
  }

  @SubscribeMessage('subscribe-denied-access')
  handleSubscribeDeniedAccess(@ConnectedSocket() client: Socket): void {
    const room = 'access:denied';
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to denied access events`);
    client.emit('subscribed-denied-access', {});
  }

  broadcastValidationEvent(result: ValidationResponseDto): void {
    // Broadcast to device room
    this.server.to(`device:${result.deviceId}`).emit('access-validation', result);

    // Broadcast to user room
    this.server.to(`user:${result.userId}`).emit('access-validation', result);

    // Broadcast to denied access room if access was denied
    if (result.decision === 'denied') {
      this.server.to('access:denied').emit('access-denied', result);
    }

    // Broadcast to all interested clients
    this.server.emit('access-event', result);
  }

  notifyDeviceOffline(deviceId: string, reason?: string): void {
    this.server.to(`device:${deviceId}`).emit('device-offline', {
      deviceId,
      timestamp: new Date(),
      reason,
    });
  }

  notifyDeviceOnline(deviceId: string): void {
    this.server.to(`device:${deviceId}`).emit('device-online', {
      deviceId,
      timestamp: new Date(),
    });
  }

  notifyDeviceTamper(deviceId: string): void {
    this.server.to(`device:${deviceId}`).emit('device-tampered', {
      deviceId,
      timestamp: new Date(),
    });

    // Also broadcast to denied access room
    this.server.to('access:denied').emit('tamper-detected', {
      deviceId,
      timestamp: new Date(),
    });
  }

  sendToDevice(deviceId: string, event: string, data: any): void {
    this.server.to(`device:${deviceId}`).emit(event, data);
  }

  sendToZone(zone: string, event: string, data: any): void {
    this.server.to(`zone:${zone}`).emit(event, data);
  }

  sendToUser(userId: string, event: string, data: any): void {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
