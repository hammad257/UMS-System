import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

const Decimal = Prisma.Decimal;
type Decimal = InstanceType<typeof Prisma.Decimal>;

import { PrismaService } from '../prisma/prisma.service';
import {
  BulkGenerateInvoicesDto,
  CancelInvoiceDto,
  CreateFeeStructureDto,
  CreateInvoiceDto,
  CreatePaymentDto,
  GenerateInvoiceDto,
  UpdateFeeStructureDto,
  UpdateInvoiceDto,
  UpdatePaymentDto,
} from './dto/finance.dto';

export interface ComputedTotals {
  subtotal: string;
  total: string;
  paid: string;
  balance: string;
  status: 'cancelled' | 'paid' | 'partial' | 'overdue' | 'pending' | 'draft';
}

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private decimalToString(d: Decimal | number) {
    return new Decimal(d as any).toFixed(2);
  }

  private computeTotals(invoice: {
    items: { amount: Decimal | number }[];
    payments: { amount: Decimal | number }[];
    discount: Decimal | number;
    tax: Decimal | number;
    dueDate: Date;
    cancelledAt: Date | null;
    approvedAt: Date | null;
  }): ComputedTotals {
    const subtotal = invoice.items.reduce(
      (acc, i) => acc.plus(new Decimal(i.amount as any)),
      new Decimal(0),
    );
    const total = subtotal
      .minus(new Decimal(invoice.discount as any))
      .plus(new Decimal(invoice.tax as any));
    const paid = invoice.payments.reduce(
      (acc, p) => acc.plus(new Decimal(p.amount as any)),
      new Decimal(0),
    );
    const balance = total.minus(paid);

    let status: ComputedTotals['status'];
    if (invoice.cancelledAt) status = 'cancelled';
    else if (paid.gte(total) && total.gt(0)) status = 'paid';
    else if (paid.gt(0) && paid.lt(total)) status = 'partial';
    else if (paid.eq(0) && invoice.dueDate < new Date()) status = 'overdue';
    else status = 'pending';

    return {
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2),
      paid: paid.toFixed(2),
      balance: balance.toFixed(2),
      status,
    };
  }

  private async generateInvoiceNumber(
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const last = await tx.invoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });
    const lastSeq = last
      ? parseInt(last.invoiceNumber.slice(prefix.length), 10) || 0
      : 0;
    return `${prefix}${String(lastSeq + 1).padStart(4, '0')}`;
  }

  private withComputed<
    T extends {
      items: { amount: Decimal | number }[];
      payments: { amount: Decimal | number }[];
      discount: Decimal;
      tax: Decimal;
      dueDate: Date;
      cancelledAt: Date | null;
      approvedAt: Date | null;
    },
  >(invoice: T) {
    return { ...invoice, ...this.computeTotals(invoice) };
  }

  // ===========================================================================
  // FeeStructure
  // ===========================================================================

  async createStructure(dto: CreateFeeStructureDto) {
    const program = await this.prisma.program.findUnique({
      where: { id: dto.programId },
    });
    if (!program) throw new NotFoundException('Program not found');

    try {
      const structure = await this.prisma.feeStructure.create({
        data: {
          programId: dto.programId,
          name: dto.name,
          description: dto.description,
          appliesFromYear: dto.appliesFromYear,
          status: dto.status,
          items: {
            create: dto.items.map((i) => ({
              name: i.name,
              amount: new Decimal(i.amount),
              type: i.type,
              required: i.required ?? true,
              oneTime: i.oneTime ?? false,
            })),
          },
        },
        include: { items: true },
      });
      return { message: 'Fee structure created', data: structure };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(
          'A fee structure already exists for this program-year',
        );
      }
      throw e;
    }
  }

  async listStructures(filters: {
    programId?: string;
    status?: string;
    appliesFromYear?: number;
  }) {
    const where: Prisma.FeeStructureWhereInput = {};
    if (filters.programId) where.programId = filters.programId;
    if (filters.status) where.status = filters.status as any;
    if (filters.appliesFromYear) where.appliesFromYear = Number(filters.appliesFromYear);

    const list = await this.prisma.feeStructure.findMany({
      where,
      include: { program: true, _count: { select: { items: true } } },
      orderBy: { appliesFromYear: 'desc' },
    });
    return { message: 'Fee structures fetched', data: list };
  }

  async getStructure(id: string) {
    const s = await this.prisma.feeStructure.findUnique({
      where: { id },
      include: { items: true, program: true },
    });
    if (!s) throw new NotFoundException('Fee structure not found');
    return { message: 'Fee structure fetched', data: s };
  }

  async updateStructure(id: string, dto: UpdateFeeStructureDto) {
    const exists = await this.prisma.feeStructure.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Fee structure not found');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.feeStructure.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          appliesFromYear: dto.appliesFromYear,
          status: dto.status,
        },
      });
      if (dto.items) {
        await tx.feeItem.deleteMany({ where: { structureId: id } });
        await tx.feeItem.createMany({
          data: dto.items.map((i) => ({
            structureId: id,
            name: i.name,
            amount: new Decimal(i.amount),
            type: i.type,
            required: i.required ?? true,
            oneTime: i.oneTime ?? false,
          })),
        });
      }
      const refreshed = await tx.feeStructure.findUnique({
        where: { id },
        include: { items: true },
      });
      return { message: 'Fee structure updated', data: refreshed };
    });
  }

  async deleteStructure(id: string) {
    const exists = await this.prisma.feeStructure.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Fee structure not found');
    await this.prisma.feeStructure.delete({ where: { id } });
    return { message: 'Fee structure deleted', data: null };
  }

  // ===========================================================================
  // Invoice
  // ===========================================================================

  async createInvoice(dto: CreateInvoiceDto, userId?: string) {
    if (new Date(dto.dueDate) < new Date(dto.issueDate)) {
      throw new BadRequestException('dueDate must be on or after issueDate');
    }
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.$transaction(async (tx) => {
      const invoiceNumber = await this.generateInvoiceNumber(tx);
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          studentId: dto.studentId,
          semesterId: dto.semesterId,
          issueDate: new Date(dto.issueDate),
          dueDate: new Date(dto.dueDate),
          discount: new Decimal(dto.discount ?? 0),
          tax: new Decimal(dto.tax ?? 0),
          notes: dto.notes,
          createdById: userId,
          items: {
            create: dto.items.map((i) => ({
              name: i.name,
              amount: new Decimal(i.amount),
              type: i.type,
              notes: i.notes,
            })),
          },
        },
        include: { items: true, payments: true },
      });
      return {
        message: 'Invoice created',
        data: this.withComputed(invoice),
      };
    });
  }

  async listInvoices(filters: {
    studentId?: string;
    semesterId?: string;
    status?: string;
    dueFrom?: string;
    dueTo?: string;
  }) {
    const where: Prisma.InvoiceWhereInput = { deletedAt: null };
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.semesterId) where.semesterId = filters.semesterId;
    if (filters.dueFrom || filters.dueTo) {
      where.dueDate = {
        ...(filters.dueFrom ? { gte: new Date(filters.dueFrom) } : {}),
        ...(filters.dueTo ? { lte: new Date(filters.dueTo) } : {}),
      };
    }
    if (filters.status === 'cancelled') where.cancelledAt = { not: null };

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        items: true,
        payments: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
          },
        },
        semester: { select: { id: true, name: true, sequence: true } },
      },
      orderBy: { issueDate: 'desc' },
    });

    let result = invoices.map((i) => this.withComputed(i));
    if (filters.status && filters.status !== 'cancelled') {
      result = result.filter((i) => i.status === filters.status);
    }
    return { message: 'Invoices fetched', data: result };
  }

  async getInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
        student: true,
        semester: true,
      },
    });
    if (!invoice || invoice.deletedAt) {
      throw new NotFoundException('Invoice not found');
    }
    return { message: 'Invoice fetched', data: this.withComputed(invoice) };
  }

  async updateInvoice(id: string, dto: UpdateInvoiceDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { payments: true },
    });
    if (!invoice || invoice.deletedAt) {
      throw new NotFoundException('Invoice not found');
    }
    if (invoice.cancelledAt) {
      throw new ConflictException('Cannot edit a cancelled invoice');
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        discount: dto.discount !== undefined ? new Decimal(dto.discount) : undefined,
        tax: dto.tax !== undefined ? new Decimal(dto.tax) : undefined,
        notes: dto.notes,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: { items: true, payments: true },
    });
    return { message: 'Invoice updated', data: this.withComputed(updated) };
  }

  async deleteInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { _count: { select: { payments: true } } },
    });
    if (!invoice || invoice.deletedAt) {
      throw new NotFoundException('Invoice not found');
    }
    if (invoice._count.payments > 0) {
      throw new ConflictException(
        'Cannot delete an invoice with payments. Cancel it instead.',
      );
    }
    await this.prisma.invoice.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: 'Invoice deleted', data: null };
  }

  async cancelInvoice(id: string, dto: CancelInvoiceDto, userId?: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice || invoice.deletedAt) {
      throw new NotFoundException('Invoice not found');
    }
    if (invoice.cancelledAt) {
      throw new ConflictException('Invoice already cancelled');
    }
    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        cancelledAt: new Date(),
        cancelledById: userId,
        cancelReason: dto.reason,
      },
    });
    return { message: 'Invoice cancelled', data: updated };
  }

  async approveInvoice(id: string, userId?: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice || invoice.deletedAt) {
      throw new NotFoundException('Invoice not found');
    }
    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        approvedAt: invoice.approvedAt ?? new Date(),
        approvedById: invoice.approvedAt ? invoice.approvedById : userId,
      },
    });
    return { message: 'Invoice approved', data: updated };
  }

  // ===========================================================================
  // Generate from structure
  // ===========================================================================

  private async pickFeeStructure(
    tx: Prisma.TransactionClient | PrismaService,
    programId: string,
    referenceYear: number,
  ) {
    return tx.feeStructure.findFirst({
      where: {
        programId,
        status: 'ACTIVE',
        appliesFromYear: { lte: referenceYear },
      },
      include: { items: true },
      orderBy: { appliesFromYear: 'desc' },
    });
  }

  async generateInvoice(dto: GenerateInvoiceDto, userId?: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
    });
    if (!student || !student.programId) {
      throw new NotFoundException('Student not found or has no program');
    }
    const semester = await this.prisma.semester.findUnique({
      where: { id: dto.semesterId },
      include: { session: true },
    });
    if (!semester) throw new NotFoundException('Semester not found');

    return this.prisma.$transaction(async (tx) => {
      const yr = new Date(dto.issueDate).getFullYear();
      const structure = await this.pickFeeStructure(tx, student.programId!, yr);
      if (!structure) {
        throw new BadRequestException(
          'No active fee structure for student program-year',
        );
      }

      // Determine "first invoice" if includeOneTimeItems not given.
      const priorCount = await tx.invoice.count({
        where: { studentId: dto.studentId },
      });
      const isFirstInvoice = dto.includeOneTimeItems ?? priorCount === 0;
      const excludeSet = new Set(dto.excludeItemIds ?? []);

      const items = structure.items.filter((i) => {
        if (excludeSet.has(i.id)) return false;
        if (!i.required) return false;
        if (i.oneTime && !isFirstInvoice) return false;
        return true;
      });

      const invoiceNumber = await this.generateInvoiceNumber(tx);
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          studentId: dto.studentId,
          semesterId: dto.semesterId,
          issueDate: new Date(dto.issueDate),
          dueDate: new Date(dto.dueDate),
          discount: new Decimal(dto.discount ?? 0),
          tax: new Decimal(dto.tax ?? 0),
          createdById: userId,
          items: {
            create: items.map((i) => ({
              name: i.name,
              amount: i.amount,
              type: i.type,
            })),
          },
        },
        include: { items: true, payments: true },
      });
      return {
        message: 'Invoice generated from fee structure',
        data: this.withComputed(invoice),
      };
    });
  }

  async bulkGenerateInvoices(dto: BulkGenerateInvoicesDto, userId?: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: dto.batchId },
      select: { id: true, programId: true, startYear: true },
    });
    if (!batch) throw new NotFoundException('Batch not found');

    const skipExisting = dto.skipExisting ?? true;
    const errors: Array<{ studentId: string; reason: string }> = [];
    let created = 0;
    let skipped = 0;
    const createdInvoices: any[] = [];

    return this.prisma.$transaction(async (tx) => {
      const structure = await this.pickFeeStructure(
        tx,
        batch.programId,
        batch.startYear,
      );
      if (!structure) {
        throw new BadRequestException(
          'No active fee structure for batch program-year',
        );
      }

      const students = await tx.student.findMany({
        where: {
          batchId: dto.batchId,
          deletedAt: null,
          status: 'ACTIVE',
          enrollmentStatus: 'ACTIVE',
        },
      });

      for (const s of students) {
        try {
          if (skipExisting) {
            const existing = await tx.invoice.findFirst({
              where: { studentId: s.id, semesterId: dto.semesterId, deletedAt: null },
            });
            if (existing) {
              skipped++;
              continue;
            }
          }
          const priorCount = await tx.invoice.count({ where: { studentId: s.id } });
          const isFirstInvoice = dto.includeOneTimeItems ?? priorCount === 0;
          const items = structure.items.filter(
            (i) => i.required && (!i.oneTime || isFirstInvoice),
          );

          const invoiceNumber = await this.generateInvoiceNumber(tx);
          const invoice = await tx.invoice.create({
            data: {
              invoiceNumber,
              studentId: s.id,
              semesterId: dto.semesterId,
              issueDate: new Date(dto.issueDate),
              dueDate: new Date(dto.dueDate),
              createdById: userId,
              items: {
                create: items.map((i) => ({
                  name: i.name,
                  amount: i.amount,
                  type: i.type,
                })),
              },
            },
          });
          created++;
          createdInvoices.push(invoice);
        } catch (e) {
          errors.push({
            studentId: s.id,
            reason: (e as Error).message ?? 'unknown error',
          });
        }
      }

      return {
        message: 'Bulk invoice generation finished',
        data: { created, skipped, errors, invoices: createdInvoices },
      };
    });
  }

  // ===========================================================================
  // Payment
  // ===========================================================================

  async createPayment(dto: CreatePaymentDto, invoiceId: string, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice || invoice.deletedAt) {
      throw new NotFoundException('Invoice not found');
    }
    if (invoice.cancelledAt) {
      throw new ConflictException('Cannot pay a cancelled invoice');
    }
    if (new Date(dto.paidAt) > new Date()) {
      throw new BadRequestException('paidAt cannot be in the future');
    }

    const payment = await this.prisma.payment.create({
      data: {
        invoiceId,
        amount: new Decimal(dto.amount),
        method: dto.method,
        reference: dto.reference,
        paidAt: new Date(dto.paidAt),
        notes: dto.notes,
        recordedById: userId,
      },
    });
    return { message: 'Payment recorded', data: payment };
  }

  async listPayments(filters: {
    invoiceId?: string;
    studentId?: string;
    method?: string;
    paidFrom?: string;
    paidTo?: string;
  }) {
    const where: Prisma.PaymentWhereInput = {};
    if (filters.invoiceId) where.invoiceId = filters.invoiceId;
    if (filters.studentId) where.invoice = { studentId: filters.studentId };
    if (filters.method) where.method = filters.method as any;
    if (filters.paidFrom || filters.paidTo) {
      where.paidAt = {
        ...(filters.paidFrom ? { gte: new Date(filters.paidFrom) } : {}),
        ...(filters.paidTo ? { lte: new Date(filters.paidTo) } : {}),
      };
    }
    const payments = await this.prisma.payment.findMany({
      where,
      include: { invoice: { select: { id: true, invoiceNumber: true, studentId: true } } },
      orderBy: { paidAt: 'desc' },
    });
    return { message: 'Payments fetched', data: payments };
  }

  async getPayment(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { invoice: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return { message: 'Payment fetched', data: payment };
  }

  async updatePayment(id: string, dto: UpdatePaymentDto) {
    const exists = await this.prisma.payment.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Payment not found');
    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        reference: dto.reference,
        notes: dto.notes,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
      },
    });
    return { message: 'Payment updated', data: updated };
  }

  async deletePayment(id: string) {
    const exists = await this.prisma.payment.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Payment not found');
    await this.prisma.payment.delete({ where: { id } });
    return { message: 'Payment deleted', data: null };
  }
}
