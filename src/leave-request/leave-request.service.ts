import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLeaveDto } from './dto/create-leave-request.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-request.dto';
import { LeaveStatus } from '@prisma/client';

@Injectable()
export class LeaveRequestService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLeaveDto) {
    return this.prisma.leaveRequest.create({
      data: {
        ...dto,
        fromDate: new Date(dto.fromDate),
        toDate: new Date(dto.toDate),
      },
    });
  }

  async findAll() {
    return this.prisma.leaveRequest.findMany({
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { userId },
    });
  }

  async updateStatus(id: string, status: LeaveStatus, remarks?: string, adminId?: string) {
    const existing = await this.prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!existing) throw new NotFoundException('Leave request not found');

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        remarks,
        reviewedBy: adminId,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.leaveRequest.delete({ where: { id } });
  }
}