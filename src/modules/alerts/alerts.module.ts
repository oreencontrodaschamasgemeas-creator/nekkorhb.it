import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsController } from './alerts.controller';
import { AlertDetectionService } from './alert-detection.service';
import { Alert } from './entities/alert.entity';
import { SensorEvent } from '../sensors/entities/sensor-event.entity';
import { WebsocketModule } from '../websocket/websocket.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alert, SensorEvent]),
    WebsocketModule,
    NotificationsModule,
  ],
  controllers: [AlertsController],
  providers: [AlertDetectionService],
  exports: [AlertDetectionService],
})
export class AlertsModule {}
