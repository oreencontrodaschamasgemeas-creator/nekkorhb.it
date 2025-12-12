import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { SensorsController } from './sensors.controller';
import { SensorIngestionService } from './sensor-ingestion.service';
import { SensorProcessor } from './processors/sensor.processor';
import { SensorEvent } from './entities/sensor-event.entity';
import { WebsocketModule } from '../websocket/websocket.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SensorEvent]),
    BullModule.registerQueue({
      name: 'sensor-processing',
    }),
    WebsocketModule,
    AlertsModule,
  ],
  controllers: [SensorsController],
  providers: [SensorIngestionService, SensorProcessor],
  exports: [SensorIngestionService],
})
export class SensorsModule {}
