import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { Incident } from './entities/incident.entity';
import { IncidentProcessor } from './processors/incident.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Incident]),
    BullModule.registerQueue({
      name: 'incidents',
    }),
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService, IncidentProcessor],
  exports: [IncidentsService],
})
export class IncidentsModule {}
