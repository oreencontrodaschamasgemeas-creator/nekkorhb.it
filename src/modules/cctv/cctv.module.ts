import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { CctvController } from './cctv.controller';
import { StreamIngestionService } from './stream-ingestion.service';
import { StreamProcessor } from './processors/stream.processor';
import { CameraStream } from './entities/camera-stream.entity';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CameraStream]),
    BullModule.registerQueue({
      name: 'stream-processing',
    }),
    WebsocketModule,
  ],
  controllers: [CctvController],
  providers: [StreamIngestionService, StreamProcessor],
  exports: [StreamIngestionService],
})
export class CctvModule {}
