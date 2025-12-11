import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('notifications')
export class NotificationProcessor {
  @Process('send-notification')
  async handleNotification(job: Job) {
    console.log('Sending notification:', job.data);

    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log('Notification sent:', job.data.notificationId);
    return { success: true, notificationId: job.data.notificationId };
  }
}
