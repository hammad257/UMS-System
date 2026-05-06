import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/permissions.decorator';
import { ModuleName } from '../common/guards/permissions.module.decorator';
import { CurrentUser } from '../common/guards/roles.decorator';
import type { AuthUser } from '../common/types';

import { CommunicationService } from './communication.service';
import {
  CreateAnnouncementDto,
  CreateMessageDto,
  CreateNotificationDto,
  UpdateAnnouncementDto,
} from './dto/communication.dto';
import { AnnouncementStatus, NotificationType } from '@prisma/client';

// ----------------------------------------------------------------------------
// /notifications
// ----------------------------------------------------------------------------

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: CommunicationService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('read') read?: string,
    @Query('type') type?: NotificationType,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const readFlag = read === undefined ? undefined : read === 'true';
    return this.service.listForUser(user.id, { read: readFlag, type, page, pageSize });
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.service.unreadCount(user.id);
  }

  @Post(':id/read')
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.markRead(user.id, id);
  }

  @Post('mark-all-read')
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.service.markAllRead(user.id);
  }

  @Post()
  @ModuleName('Communication')
  @Permissions('communication.notification.create')
  adminCreate(@Body() dto: CreateNotificationDto) {
    return this.service.adminCreate(dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.deleteNotification(user.id, id);
  }
}

// ----------------------------------------------------------------------------
// /messages
// ----------------------------------------------------------------------------

@ApiTags('Messages')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly service: CommunicationService) {}

  @Get('threads')
  listThreads(@CurrentUser() user: AuthUser) {
    return this.service.listThreads(user.id);
  }

  @Get('threads/:threadId')
  getThread(@CurrentUser() user: AuthUser, @Param('threadId') threadId: string) {
    return this.service.getThread(user.id, threadId);
  }

  @Post()
  @ModuleName('Communication')
  @Permissions('communication.message.create')
  send(@CurrentUser() user: AuthUser, @Body() dto: CreateMessageDto) {
    return this.service.createMessage(user.id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.deleteMessage(user.id, id);
  }
}

// ----------------------------------------------------------------------------
// /announcements
// ----------------------------------------------------------------------------

@ApiTags('Announcements')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly service: CommunicationService) {}

  private isAdmin(user: AuthUser): boolean {
    return (
      user?.roles?.some((r) =>
        ['ADMIN', 'SUPER_ADMIN', 'DIRECTOR'].includes(r),
      ) ?? false
    );
  }

  @Get()
  @ModuleName('Communication')
  @Permissions('communication.announcement.read')
  list(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: AnnouncementStatus,
  ) {
    return this.service.listAnnouncements(user.roles ?? [], this.isAdmin(user), { status });
  }

  @Get(':id')
  @ModuleName('Communication')
  @Permissions('communication.announcement.read')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.getAnnouncement(id, user.roles ?? [], this.isAdmin(user));
  }

  @Post()
  @ModuleName('Communication')
  @Permissions('communication.announcement.create')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAnnouncementDto) {
    return this.service.createAnnouncement(user.id, dto);
  }

  @Patch(':id')
  @ModuleName('Communication')
  @Permissions('communication.announcement.update')
  update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.service.updateAnnouncement(id, dto);
  }

  @Post(':id/publish')
  @ModuleName('Communication')
  @Permissions('communication.announcement.update')
  @ApiOperation({ summary: 'Publish announcement (optional fanout)' })
  publish(@Param('id') id: string) {
    return this.service.publishAnnouncement(id);
  }

  @Post(':id/archive')
  @ModuleName('Communication')
  @Permissions('communication.announcement.update')
  archive(@Param('id') id: string) {
    return this.service.archiveAnnouncement(id);
  }

  @Delete(':id')
  @ModuleName('Communication')
  @Permissions('communication.announcement.delete')
  remove(@Param('id') id: string) {
    return this.service.deleteAnnouncement(id);
  }
}
