import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { RecordingsController } from './recordings.controller';
import { RecordingsService } from './recordings.service';
import { RecordingProcessor } from './processors/recording.processor';
import { Recording } from './entities/recording.entity';
import { CameraStream } from '../cctv/entities/camera-stream.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recording, CameraStream]),
    BullModule.registerQueue({
      name: 'recording-processing',
    }),
  ],
  controllers: [RecordingsController],
  providers: [RecordingsService, RecordingProcessor],
  exports: [RecordingsService],
})
export class RecordingsModule {}
