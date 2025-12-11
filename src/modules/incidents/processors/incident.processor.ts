import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('incidents')
export class IncidentProcessor {
  @Process('process-incident')
  async handleIncident(job: Job) {
    console.log('Processing incident:', job.data);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log('Incident processed:', job.data.incidentId);
    return { success: true, incidentId: job.data.incidentId };
  }
}
