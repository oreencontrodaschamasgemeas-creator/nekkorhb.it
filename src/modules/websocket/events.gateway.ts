import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { AuthScope } from '../auth/constants/scopes.constant';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly authService: AuthService) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        throw new UnauthorizedException('Missing access token');
      }
      const payload = await this.authService.verifyAccessToken(token, [AuthScope.REALTIME_CONNECT]);
      client.data.user = payload;
      console.log(`Client connected: ${client.id}`);
    } catch (error) {
      client.emit('error', 'Unauthorized');
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: any) {
    console.log('Received message:', data);
    return { event: 'message', data: { received: true, message: data } };
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const { room } = data;
    client.join(room);
    console.log(`Client ${client.id} joined room: ${room}`);
    return { event: 'subscribed', data: { room } };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const { room } = data;
    client.leave(room);
    console.log(`Client ${client.id} left room: ${room}`);
    return { event: 'unsubscribed', data: { room } };
  }

  sendToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  sendToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  private extractToken(client: Socket): string | undefined {
    const authHeader = client.handshake.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    if (typeof client.handshake.auth?.token === 'string') {
      return client.handshake.auth.token;
    }

    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string') {
      return queryToken;
    }

    if (Array.isArray(queryToken)) {
      return queryToken[0];
    }

    return undefined;
  }
}
