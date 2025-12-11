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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: any) {
    this.logger.debug('Received message:', data);
    return { event: 'message', data: { received: true, message: data } };
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const { room } = data;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);
    return { event: 'subscribed', data: { room } };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const { room } = data;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room: ${room}`);
    return { event: 'unsubscribed', data: { room } };
  }

  // Incident-specific methods
  @SubscribeMessage('subscribe-incidents')
  handleSubscribeIncidents(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const room = 'incidents';
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to incidents`);
    return { event: 'subscribed-incidents', data: { room } };
  }

  @SubscribeMessage('unsubscribe-incidents')
  handleUnsubscribeIncidents(@ConnectedSocket() client: Socket) {
    const room = 'incidents';
    client.leave(room);
    this.logger.log(`Client ${client.id} unsubscribed from incidents`);
    return { event: 'unsubscribed-incidents', data: { room } };
  }

  @SubscribeMessage('subscribe-incident')
  handleSubscribeIncident(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const { incidentId } = data;
    const room = `incident-${incidentId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to incident ${incidentId}`);
    return { event: 'subscribed-incident', data: { incidentId, room } };
  }

  @SubscribeMessage('unsubscribe-incident')
  handleUnsubscribeIncident(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const { incidentId } = data;
    const room = `incident-${incidentId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} unsubscribed from incident ${incidentId}`);
    return { event: 'unsubscribed-incident', data: { incidentId } };
  }

  // Incident update broadcasting
  broadcastIncidentCreated(incident: any) {
    this.server.to('incidents').emit('incident-created', {
      event: 'incident-created',
      data: incident,
    });
  }

  broadcastIncidentUpdated(incident: any) {
    this.server.to('incidents').emit('incident-updated', {
      event: 'incident-updated',
      data: incident,
    });
    this.server.to(`incident-${incident.id}`).emit('incident-updated', {
      event: 'incident-updated',
      data: incident,
    });
  }

  broadcastIncidentStatusChanged(incidentId: string, incident: any) {
    this.server.to('incidents').emit('incident-status-changed', {
      event: 'incident-status-changed',
      data: incident,
    });
    this.server.to(`incident-${incidentId}`).emit('incident-status-changed', {
      event: 'incident-status-changed',
      data: incident,
    });
  }

  broadcastIncidentEscalated(incidentId: string, incident: any) {
    this.server.to('incidents').emit('incident-escalated', {
      event: 'incident-escalated',
      data: incident,
    });
    this.server.to(`incident-${incidentId}`).emit('incident-escalated', {
      event: 'incident-escalated',
      data: incident,
    });
  }

  broadcastAnnotationAdded(incidentId: string, annotation: any) {
    this.server.to(`incident-${incidentId}`).emit('annotation-added', {
      event: 'annotation-added',
      data: annotation,
    });
  }

  broadcastEvidenceAdded(incidentId: string, evidence: any) {
    this.server.to(`incident-${incidentId}`).emit('evidence-added', {
      event: 'evidence-added',
      data: evidence,
    });
  }

  sendToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  sendToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }
}
