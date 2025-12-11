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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
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
}
