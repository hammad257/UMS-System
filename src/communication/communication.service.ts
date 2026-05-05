import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AnnouncementAudience,
  AnnouncementStatus,
  Notification,
  NotificationType,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAnnouncementDto,
  CreateMessageDto,
  CreateNotificationDto,
  UpdateAnnouncementDto,
} from './dto/communication.dto';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

@Injectable()
export class CommunicationService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // Internal NotificationService API — called by other modules' services
  // ===========================================================================

  async createNotification(input: CreateNotificationInput): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
      },
    });
  }

  async createNotificationsForMany(
    inputs: CreateNotificationInput[],
  ): Promise<{ count: number }> {
    if (inputs.length === 0) return { count: 0 };
    const r = await this.prisma.notification.createMany({
      data: inputs.map((i) => ({
        userId: i.userId,
        type: i.type,
        title: i.title,
        message: i.message,
        link: i.link,
      })),
    });
    return r;
  }

  // ===========================================================================
  // /notifications (HTTP)
  // ===========================================================================

  async listForUser(
    userId: string,
    filters: { read?: boolean; type?: NotificationType; page?: number; pageSize?: number },
  ) {
    const page = Number(filters.page ?? 1);
    const pageSize = Number(filters.pageSize ?? 20);
    const skip = (page - 1) * pageSize;

    const where: Prisma.NotificationWhereInput = { userId };
    if (filters.read !== undefined) {
      where.readAt = filters.read ? { not: null } : null;
    }
    if (filters.type) where.type = filters.type;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      message: 'Notifications fetched',
      data: {
        items: items.map((n) => ({ ...n, read: n.readAt !== null })),
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      },
    };
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { message: 'Unread count', data: { count } };
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) {
      throw new ForbiddenException('Not your notification');
    }
    if (notification.readAt) {
      return { message: 'Already read', data: notification };
    }
    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
    return { message: 'Marked read', data: updated };
  }

  async markAllRead(userId: string) {
    const r = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { message: 'All notifications marked read', data: { count: r.count } };
  }

  async deleteNotification(userId: string, id: string) {
    const n = await this.prisma.notification.findUnique({ where: { id } });
    if (!n) throw new NotFoundException('Notification not found');
    if (n.userId !== userId) throw new ForbiddenException('Not your notification');
    await this.prisma.notification.delete({ where: { id } });
    return { message: 'Notification deleted', data: null };
  }

  async adminCreate(dto: CreateNotificationDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new BadRequestException('Recipient user not found');
    const created = await this.createNotification(dto);
    return { message: 'Notification created', data: created };
  }

  // ===========================================================================
  // /messages
  // ===========================================================================

  async createMessage(senderId: string, dto: CreateMessageDto) {
    if (dto.recipientId === senderId) {
      throw new BadRequestException('Cannot send a message to yourself');
    }
    const recipient = await this.prisma.user.findUnique({
      where: { id: dto.recipientId },
    });
    if (!recipient || recipient.deletedAt) {
      throw new BadRequestException('Recipient not found or inactive');
    }

    let threadId = dto.threadId;
    if (threadId) {
      const inThread = await this.prisma.message.findFirst({
        where: {
          threadId,
          OR: [{ senderId }, { recipientId: senderId }],
        },
      });
      if (!inThread) {
        throw new ForbiddenException('You are not a participant in this thread');
      }
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          senderId,
          recipientId: dto.recipientId,
          subject: dto.subject,
          body: dto.body,
          threadId: threadId ?? '',
        },
      });
      // First message: threadId = id (self-reference).
      if (!threadId) {
        await tx.message.update({
          where: { id: created.id },
          data: { threadId: created.id },
        });
        created.threadId = created.id;
      }
      return created;
    });

    // Trigger notification to recipient.
    await this.createNotification({
      userId: dto.recipientId,
      type: NotificationType.INFO,
      title: dto.subject,
      message: dto.body.slice(0, 200),
      link: `/messages/threads/${message.threadId}`,
    });

    return { message: 'Message sent', data: message };
  }

  async listThreads(userId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { recipientId: userId }],
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    const byThread = new Map<string, any>();
    for (const m of messages) {
      const entry = byThread.get(m.threadId) ?? {
        threadId: m.threadId,
        latest: m,
        unreadCount: 0,
      };
      if (entry.latest.createdAt < m.createdAt) entry.latest = m;
      if (m.recipientId === userId && !m.readAt) entry.unreadCount++;
      byThread.set(m.threadId, entry);
    }

    const senderIds = new Set<string>();
    for (const t of byThread.values()) {
      senderIds.add(t.latest.senderId);
      senderIds.add(t.latest.recipientId);
    }
    const users = await this.prisma.user.findMany({
      where: { id: { in: [...senderIds] } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    const result = [...byThread.values()].map((t) => ({
      ...t,
      sender: userMap.get(t.latest.senderId) ?? null,
      recipient: userMap.get(t.latest.recipientId) ?? null,
    }));
    return { message: 'Threads fetched', data: result };
  }

  async getThread(userId: string, threadId: string) {
    const messages = await this.prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
    });
    if (messages.length === 0) {
      throw new NotFoundException('Thread not found');
    }
    const isParticipant = messages.some(
      (m) => m.senderId === userId || m.recipientId === userId,
    );
    if (!isParticipant) {
      throw new ForbiddenException('Not a participant of this thread');
    }
    // Mark received messages as read.
    await this.prisma.message.updateMany({
      where: { threadId, recipientId: userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { message: 'Thread fetched', data: messages };
  }

  async deleteMessage(userId: string, id: string) {
    const m = await this.prisma.message.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Message not found');
    if (m.senderId !== userId) {
      throw new ForbiddenException('Only the sender can delete a message');
    }
    await this.prisma.message.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: 'Message deleted', data: null };
  }

  // ===========================================================================
  // /announcements
  // ===========================================================================

  audienceForRoles(roles: string[]): AnnouncementAudience[] {
    const set = new Set<AnnouncementAudience>([AnnouncementAudience.ALL]);
    for (const r of roles) {
      switch (r) {
        case 'STUDENT':
          set.add(AnnouncementAudience.STUDENTS);
          break;
        case 'TEACHER':
        case 'FACULTY':
          set.add(AnnouncementAudience.FACULTY);
          break;
        case 'HR':
          set.add(AnnouncementAudience.STAFF);
          set.add(AnnouncementAudience.FACULTY);
          break;
        case 'ADMIN':
        case 'SUPER_ADMIN':
        case 'DIRECTOR':
        case 'REGISTRAR':
        case 'FINANCE_OFFICER':
          set.add(AnnouncementAudience.STUDENTS);
          set.add(AnnouncementAudience.FACULTY);
          set.add(AnnouncementAudience.STAFF);
          break;
      }
    }
    return [...set];
  }

  async createAnnouncement(authorId: string, dto: CreateAnnouncementDto) {
    const announcement = await this.prisma.announcement.create({
      data: {
        title: dto.title,
        body: dto.body,
        audience: dto.audience,
        authorId,
        status: dto.status ?? AnnouncementStatus.DRAFT,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
    return { message: 'Announcement created', data: announcement };
  }

  async listAnnouncements(
    userRoles: string[],
    isAdmin: boolean,
    filters: { status?: AnnouncementStatus },
  ) {
    const userAudiences = this.audienceForRoles(userRoles);
    const where: Prisma.AnnouncementWhereInput = { deletedAt: null };
    if (!isAdmin) {
      where.status = AnnouncementStatus.PUBLISHED;
      where.audience = { hasSome: userAudiences };
    } else if (filters.status) {
      where.status = filters.status;
    }
    const announcements = await this.prisma.announcement.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return { message: 'Announcements fetched', data: announcements };
  }

  async getAnnouncement(id: string, userRoles: string[], isAdmin: boolean) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: { author: true },
    });
    if (!announcement || announcement.deletedAt) {
      throw new NotFoundException('Announcement not found');
    }
    if (!isAdmin) {
      if (announcement.status !== AnnouncementStatus.PUBLISHED) {
        throw new NotFoundException('Announcement not found');
      }
      const userAudiences = this.audienceForRoles(userRoles);
      const visible = announcement.audience.some((a) => userAudiences.includes(a));
      if (!visible) throw new ForbiddenException('Not in audience');
    }
    return { message: 'Announcement fetched', data: announcement };
  }

  async updateAnnouncement(id: string, dto: UpdateAnnouncementDto) {
    const exists = await this.prisma.announcement.findUnique({ where: { id } });
    if (!exists || exists.deletedAt) {
      throw new NotFoundException('Announcement not found');
    }
    const updated = await this.prisma.announcement.update({
      where: { id },
      data: {
        title: dto.title,
        body: dto.body,
        audience: dto.audience,
        status: dto.status,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
    return { message: 'Announcement updated', data: updated };
  }

  async publishAnnouncement(id: string) {
    const a = await this.prisma.announcement.findUnique({ where: { id } });
    if (!a || a.deletedAt) {
      throw new NotFoundException('Announcement not found');
    }
    const updated = await this.prisma.announcement.update({
      where: { id },
      data: { status: AnnouncementStatus.PUBLISHED, publishedAt: new Date() },
    });

    // Optional fanout (default OFF).
    if (process.env.ANNOUNCEMENT_NOTIFY_FANOUT === 'true') {
      const audienceUserIds = await this.resolveAudienceUserIds(updated.audience);
      await this.createNotificationsForMany(
        audienceUserIds.map((uid) => ({
          userId: uid,
          type: NotificationType.INFO,
          title: updated.title,
          message: updated.body.slice(0, 200),
          link: `/announcements/${updated.id}`,
        })),
      );
    }
    return { message: 'Announcement published', data: updated };
  }

  async archiveAnnouncement(id: string) {
    const exists = await this.prisma.announcement.findUnique({ where: { id } });
    if (!exists || exists.deletedAt) {
      throw new NotFoundException('Announcement not found');
    }
    const updated = await this.prisma.announcement.update({
      where: { id },
      data: { status: AnnouncementStatus.ARCHIVED },
    });
    return { message: 'Announcement archived', data: updated };
  }

  async deleteAnnouncement(id: string) {
    const exists = await this.prisma.announcement.findUnique({ where: { id } });
    if (!exists || exists.deletedAt) {
      throw new NotFoundException('Announcement not found');
    }
    await this.prisma.announcement.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: 'Announcement deleted', data: null };
  }

  // ===========================================================================
  // Audience → user-id resolution (used by fanout)
  // ===========================================================================

  private async resolveAudienceUserIds(
    audiences: AnnouncementAudience[],
  ): Promise<string[]> {
    if (audiences.includes(AnnouncementAudience.ALL)) {
      const users = await this.prisma.user.findMany({
        where: { status: 'ACTIVE', deletedAt: null },
        select: { id: true },
      });
      return users.map((u) => u.id);
    }

    const roleCodes: string[] = [];
    if (audiences.includes(AnnouncementAudience.STUDENTS)) roleCodes.push('STUDENT');
    if (audiences.includes(AnnouncementAudience.FACULTY)) roleCodes.push('FACULTY');
    if (audiences.includes(AnnouncementAudience.STAFF)) {
      roleCodes.push('ADMIN', 'SUPER_ADMIN', 'REGISTRAR', 'FINANCE_OFFICER');
    }

    const users = await this.prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        userRoles: { some: { role: { code: { in: roleCodes } } } },
      },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }
}
