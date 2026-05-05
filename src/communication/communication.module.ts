import { Module } from '@nestjs/common';

import { CommunicationService } from './communication.service';
import {
  AnnouncementsController,
  MessagesController,
  NotificationsController,
} from './communication.controller';

@Module({
  controllers: [
    NotificationsController,
    MessagesController,
    AnnouncementsController,
  ],
  providers: [CommunicationService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
