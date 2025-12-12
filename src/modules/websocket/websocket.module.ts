import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { WebsocketGateway } from './websocket.gateway';

@Module({
  providers: [EventsGateway, WebsocketGateway],
  exports: [EventsGateway, WebsocketGateway],
})
export class WebsocketModule {}
