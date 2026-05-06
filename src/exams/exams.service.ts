import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExamStatus, Prisma } from '@prisma/client';

const Decimal = Prisma.Decimal;
type Decimal = InstanceType<typeof Prisma.Decimal>;

import { PrismaService } from '../prisma/prisma.service';
import {
  CreateExamDto,
  CreateExamTypeDto,
  CreateGradingSchemeDto,
  MarkExamDto,
  SetActiveSchemeDto,
  UpdateExamDto,
  UpdateExamTypeDto,
  UpdateGradingSchemeDto,
  UpdateMarkDto,
} from './dto/exams.dto';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // ExamType
  // ===========================================================================

  async createExamType(dto: CreateExamTypeDto) {
    try {
      const examType = await this.prisma.examType.create({ data: dto });
      return { message: 'Exam type created', data: examType };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Exam type name already exists');
      }
      throw e;
    }
  }

  async listExamTypes() {
    const types = await this.prisma.examType.findMany({
      orderBy: { name: 'asc' },
    });
    const weightTotal = types
      .filter((t) => t.status === 'ACTIVE')
      .reduce((acc, t) => acc + t.weight, 0);
    return {
      message: 'Exam types fetched',
      data: types,
      meta: {
        weightTotal,
        warning: weightTotal !== 100 ? `Active weights total ${weightTotal} (expected 100)` : null,
      },
    };
  }

  async getExamType(id: string) {
    const t = await this.prisma.examType.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Exam type not found');
    return { message: 'Exam type fetched', data: t };
  }

  async updateExamType(id: string, dto: UpdateExamTypeDto) {
    const exists = await this.prisma.examType.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Exam type not found');
    const updated = await this.prisma.examType.update({ where: { id }, data: dto });
    return { message: 'Exam type updated', data: updated };
  }

  async deleteExamType(id: string) {
    const t = await this.prisma.examType.findUnique({
      where: { id },
      include: { _count: { select: { exams: true } } },
    });
    if (!t) throw new NotFoundException('Exam type not found');
    if (t._count.exams > 0) {
      throw new ConflictException('Cannot delete: exam type is in use');
    }
    await this.prisma.examType.delete({ where: { id } });
    return { message: 'Exam type deleted', data: null };
  }

  // ===========================================================================
  // Exam
  // ===========================================================================

  async createExam(dto: CreateExamDto) {
    const [offering, examType] = await Promise.all([
      this.prisma.offering.findUnique({ where: { id: dto.offeringId } }),
      this.prisma.examType.findUnique({ where: { id: dto.examTypeId } }),
    ]);
    if (!offering) throw new NotFoundException('Offering not found');
    if (!examType) throw new NotFoundException('Exam type not found');

    const exam = await this.prisma.exam.create({
      data: {
        offeringId: dto.offeringId,
        examTypeId: dto.examTypeId,
        name: dto.name,
        date: new Date(dto.date),
        totalMarks: dto.totalMarks,
        status: dto.status,
        notes: dto.notes,
      },
    });
    return { message: 'Exam created', data: exam };
  }

  async listExams(filters: {
    offeringId?: string;
    examTypeId?: string;
    status?: ExamStatus;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const where: Prisma.ExamWhereInput = {};
    if (filters.offeringId) where.offeringId = filters.offeringId;
    if (filters.examTypeId) where.examTypeId = filters.examTypeId;
    if (filters.status) where.status = filters.status;
    if (filters.dateFrom || filters.dateTo) {
      where.date = {
        ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
        ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
      };
    }

    const exams = await this.prisma.exam.findMany({
      where,
      include: {
        examType: true,
        offering: { include: { course: true, batch: true } },
        _count: { select: { marks: true } },
      },
      orderBy: { date: 'desc' },
    });
    return { message: 'Exams fetched', data: exams };
  }

  async getExam(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        examType: true,
        offering: { include: { course: true, batch: true } },
        marks: true,
      },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    return { message: 'Exam fetched', data: exam };
  }

  async updateExam(id: string, dto: UpdateExamDto) {
    const existing = await this.prisma.exam.findUnique({
      where: { id },
      include: { marks: true },
    });
    if (!existing) throw new NotFoundException('Exam not found');

    if (dto.totalMarks !== undefined && existing.marks.length > 0) {
      const max = existing.marks.reduce(
        (acc, m) => (Number(m.obtained) > acc ? Number(m.obtained) : acc),
        0,
      );
      if (dto.totalMarks < max) {
        throw new BadRequestException(
          `Cannot reduce totalMarks below the current max obtained (${max})`,
        );
      }
    }

    const updated = await this.prisma.exam.update({
      where: { id },
      data: {
        offeringId: dto.offeringId,
        examTypeId: dto.examTypeId,
        name: dto.name,
        date: dto.date ? new Date(dto.date) : undefined,
        totalMarks: dto.totalMarks,
        status: dto.status,
        notes: dto.notes,
      },
    });
    return { message: 'Exam updated', data: updated };
  }

  async deleteExam(id: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Exam not found');
    await this.prisma.exam.delete({ where: { id } });
    return { message: 'Exam deleted', data: null };
  }

  // ===========================================================================
  // Marks
  // ===========================================================================

  async getMarksRoster(examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        offering: { select: { id: true, batchId: true } },
        marks: true,
      },
    });
    if (!exam) throw new NotFoundException('Exam not found');

    const students = await this.prisma.student.findMany({
      where: { batchId: exam.offering.batchId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        regNo: true,
        admissionNumber: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    const byStudent = new Map(exam.marks.map((m) => [m.studentId, m]));
    const totalMarks = exam.totalMarks;
    const rows = students.map((s) => {
      const m = byStudent.get(s.id);
      const obtained = m ? Number(m.obtained) : null;
      const percent = obtained !== null ? Number(((obtained / totalMarks) * 100).toFixed(2)) : null;
      return { student: s, mark: m ?? null, percent };
    });

    return { message: 'Exam marks roster fetched', data: { exam, rows } };
  }

  async submitMarks(examId: string, dto: MarkExamDto, userId?: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found');
    if (exam.status === ExamStatus.CANCELLED) {
      throw new ConflictException('Cannot enter marks for a CANCELLED exam');
    }
    for (const m of dto.marks) {
      if (m.obtained > exam.totalMarks) {
        throw new BadRequestException({
          message: 'Obtained exceeds totalMarks',
          fields: { obtained: `Cannot exceed totalMarks (${exam.totalMarks})` },
          studentId: m.studentId,
        });
      }
    }

    return this.prisma.$transaction(async (tx) => {
      for (const entry of dto.marks) {
        await tx.marks.upsert({
          where: { examId_studentId: { examId, studentId: entry.studentId } },
          create: {
            examId,
            studentId: entry.studentId,
            obtained: new Decimal(entry.obtained),
            remarks: entry.remarks,
            enteredBy: userId,
          },
          update: {
            obtained: new Decimal(entry.obtained),
            remarks: entry.remarks,
            enteredBy: userId,
            enteredAt: new Date(),
          },
        });
      }
      const updated = await tx.exam.update({
        where: { id: examId },
        data: { status: dto.newExamStatus ?? ExamStatus.COMPLETED },
        include: { marks: true },
      });
      return { message: 'Marks submitted', data: updated };
    });
  }

  async updateSingleMark(examId: string, markId: string, dto: UpdateMarkDto) {
    const m = await this.prisma.marks.findUnique({ where: { id: markId } });
    if (!m || m.examId !== examId) {
      throw new NotFoundException('Mark not found for this exam');
    }
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (dto.obtained !== undefined && exam && dto.obtained > exam.totalMarks) {
      throw new BadRequestException({
        fields: { obtained: `Cannot exceed totalMarks (${exam.totalMarks})` },
      });
    }
    const updated = await this.prisma.marks.update({
      where: { id: markId },
      data: {
        obtained: dto.obtained !== undefined ? new Decimal(dto.obtained) : undefined,
        remarks: dto.remarks,
      },
    });
    return { message: 'Mark updated', data: updated };
  }

  // ===========================================================================
  // GradingScheme
  // ===========================================================================

  private validateTiers(tiers: { letter: string; min: number; gpa: number }[]) {
    if (tiers.length < 2) {
      throw new BadRequestException('Grading scheme must have at least 2 tiers');
    }
    const minSet = new Set<number>();
    const letterSet = new Set<string>();
    for (const t of tiers) {
      if (minSet.has(t.min)) {
        throw new BadRequestException(`Duplicate tier min ${t.min}`);
      }
      if (letterSet.has(t.letter)) {
        throw new BadRequestException(`Duplicate tier letter ${t.letter}`);
      }
      if (t.min < 0 || t.min > 100) {
        throw new BadRequestException(`Tier min ${t.min} out of range`);
      }
      minSet.add(t.min);
      letterSet.add(t.letter);
    }
    const hasZero = tiers.some((t) => t.min === 0);
    if (!hasZero) {
      throw new BadRequestException('Grading scheme must include a tier with min=0');
    }
  }

  async createScheme(dto: CreateGradingSchemeDto) {
    this.validateTiers(dto.tiers);
    return this.prisma.$transaction(async (tx) => {
      const existingCount = await tx.gradingScheme.count();
      const isFirst = existingCount === 0;
      const scheme = await tx.gradingScheme.create({
        data: {
          name: dto.name,
          description: dto.description,
          isDefault: isFirst,
          tiers: {
            create: dto.tiers.map((t) => ({
              letter: t.letter,
              min: new Decimal(t.min),
              gpa: new Decimal(t.gpa),
            })),
          },
        },
        include: { tiers: true },
      });
      return { message: 'Grading scheme created', data: scheme };
    });
  }

  async listSchemes() {
    const schemes = await this.prisma.gradingScheme.findMany({
      include: { tiers: { orderBy: { min: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return { message: 'Grading schemes fetched', data: schemes };
  }

  async getActiveScheme() {
    const scheme = await this.prisma.gradingScheme.findFirst({
      where: { isDefault: true },
      include: { tiers: { orderBy: { min: 'desc' } } },
    });
    if (!scheme) throw new NotFoundException('No active grading scheme');
    return { message: 'Active grading scheme', data: scheme };
  }

  async getScheme(id: string) {
    const scheme = await this.prisma.gradingScheme.findUnique({
      where: { id },
      include: { tiers: { orderBy: { min: 'desc' } } },
    });
    if (!scheme) throw new NotFoundException('Grading scheme not found');
    return { message: 'Grading scheme fetched', data: scheme };
  }

  async updateScheme(id: string, dto: UpdateGradingSchemeDto) {
    const existing = await this.prisma.gradingScheme.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Grading scheme not found');
    if (dto.tiers) this.validateTiers(dto.tiers);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.gradingScheme.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
        },
      });
      if (dto.tiers) {
        await tx.gradingTier.deleteMany({ where: { schemeId: id } });
        await tx.gradingTier.createMany({
          data: dto.tiers.map((t) => ({
            schemeId: id,
            letter: t.letter,
            min: new Decimal(t.min),
            gpa: new Decimal(t.gpa),
          })),
        });
      }
      const refreshed = await tx.gradingScheme.findUnique({
        where: { id },
        include: { tiers: { orderBy: { min: 'desc' } } },
      });
      return { message: 'Grading scheme updated', data: refreshed };
    });
  }

  async setActiveScheme(dto: SetActiveSchemeDto) {
    const scheme = await this.prisma.gradingScheme.findUnique({
      where: { id: dto.schemeId },
    });
    if (!scheme) throw new NotFoundException('Grading scheme not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.gradingScheme.updateMany({ data: { isDefault: false } });
      const active = await tx.gradingScheme.update({
        where: { id: dto.schemeId },
        data: { isDefault: true },
        include: { tiers: { orderBy: { min: 'desc' } } },
      });
      return { message: 'Active grading scheme updated', data: active };
    });
  }

  async deleteScheme(id: string) {
    const scheme = await this.prisma.gradingScheme.findUnique({ where: { id } });
    if (!scheme) throw new NotFoundException('Grading scheme not found');
    if (scheme.isDefault) {
      throw new ConflictException('Cannot delete the active default scheme');
    }
    await this.prisma.gradingScheme.delete({ where: { id } });
    return { message: 'Grading scheme deleted', data: null };
  }

  // ===========================================================================
  // Results — computed
  // ===========================================================================

  private async resolveScheme() {
    const scheme = await this.prisma.gradingScheme.findFirst({
      where: { isDefault: true },
      include: { tiers: { orderBy: { min: 'desc' } } },
    });
    return scheme;
  }

  private resolveLetter(
    weightedTotal: number | null,
    tiers: { letter: string; min: Decimal; gpa: Decimal }[],
  ): { letter: string | null; gpa: number | null } {
    if (weightedTotal === null) return { letter: null, gpa: null };
    for (const t of tiers) {
      if (weightedTotal >= Number(t.min)) {
        return { letter: t.letter, gpa: Number(t.gpa) };
      }
    }
    return { letter: null, gpa: null };
  }

  private computeWeightedTotal(args: {
    completedExams: { id: string; totalMarks: number; examTypeId: string; weight: number }[];
    marksByStudent: Map<string, Map<string, number>>;
    studentId: string;
    allActiveWeightSum: number;
    anyScheduled: boolean;
  }) {
    const { completedExams, marksByStudent, studentId, allActiveWeightSum, anyScheduled } = args;
    const studentMarks = marksByStudent.get(studentId) ?? new Map<string, number>();
    const presentTypeWeights = new Map<string, number>();
    let contribution = 0;
    for (const exam of completedExams) {
      const obtained = studentMarks.get(exam.id);
      if (obtained === undefined) continue;
      const percent = (obtained / exam.totalMarks) * 100;
      const c = (percent * exam.weight) / 100;
      contribution += c;
      presentTypeWeights.set(exam.examTypeId, exam.weight);
    }
    const actualWeightSum = [...presentTypeWeights.values()].reduce((a, b) => a + b, 0);
    if (actualWeightSum === 0) {
      return { weightedTotal: null, isPartial: true };
    }
    const weightedTotal = Number(((contribution * (100 / actualWeightSum))).toFixed(2));
    const isPartial = anyScheduled || actualWeightSum < allActiveWeightSum;
    return { weightedTotal, isPartial };
  }

  async offeringResults(offeringId: string) {
    const offering = await this.prisma.offering.findUnique({
      where: { id: offeringId },
      include: { course: true, batch: true },
    });
    if (!offering) throw new NotFoundException('Offering not found');

    const exams = await this.prisma.exam.findMany({
      where: { offeringId },
      include: { examType: true, marks: true },
    });
    const completed = exams.filter((e) => e.status === ExamStatus.COMPLETED);
    const anyScheduled = exams.some((e) => e.status === ExamStatus.SCHEDULED);

    // index marks: studentId → examId → obtained
    const marksByStudent = new Map<string, Map<string, number>>();
    for (const e of completed) {
      for (const m of e.marks) {
        if (!marksByStudent.has(m.studentId)) {
          marksByStudent.set(m.studentId, new Map());
        }
        marksByStudent.get(m.studentId)!.set(e.id, Number(m.obtained));
      }
    }

    const activeTypes = await this.prisma.examType.findMany({
      where: { status: 'ACTIVE' },
    });
    const allActiveWeightSum = activeTypes.reduce((acc, t) => acc + t.weight, 0);

    const completedByExam = completed.map((e) => ({
      id: e.id,
      totalMarks: e.totalMarks,
      examTypeId: e.examTypeId,
      weight: e.examType.weight,
    }));

    const students = await this.prisma.student.findMany({
      where: { batchId: offering.batchId, deletedAt: null },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    const scheme = await this.resolveScheme();

    const rows = students.map((s) => {
      const studentMarks = marksByStudent.get(s.id) ?? new Map<string, number>();
      const marksOut: Record<string, unknown> = {};
      for (const e of completed) {
        const obtained = studentMarks.get(e.id);
        if (obtained !== undefined) {
          marksOut[e.id] = {
            obtained,
            percent: Number(((obtained / e.totalMarks) * 100).toFixed(2)),
          };
        }
      }
      const { weightedTotal, isPartial } = this.computeWeightedTotal({
        completedExams: completedByExam,
        marksByStudent,
        studentId: s.id,
        allActiveWeightSum,
        anyScheduled,
      });
      const { letter, gpa } = scheme?.tiers
        ? this.resolveLetter(weightedTotal, scheme.tiers)
        : { letter: null, gpa: null };
      return {
        student: {
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          admissionNumber: s.admissionNumber,
          regNo: s.regNo,
        },
        marks: marksOut,
        weightedTotal,
        letter,
        gpa,
        isPartial,
      };
    });

    return {
      message: 'Offering results computed',
      data: {
        offering,
        exams: exams.map((e) => ({
          id: e.id,
          name: e.name,
          examTypeId: e.examTypeId,
          totalMarks: e.totalMarks,
          status: e.status,
        })),
        rows,
        schemeUsed: scheme,
      },
    };
  }

  async studentOfferingResult(studentId: string, offeringId: string) {
    const offering = await this.prisma.offering.findUnique({
      where: { id: offeringId },
      include: { course: true },
    });
    if (!offering) throw new NotFoundException('Offering not found');

    const exams = await this.prisma.exam.findMany({
      where: { offeringId },
      include: { examType: true, marks: { where: { studentId } } },
    });
    const completed = exams.filter((e) => e.status === ExamStatus.COMPLETED);
    const anyScheduled = exams.some((e) => e.status === ExamStatus.SCHEDULED);

    const marksByStudent = new Map<string, Map<string, number>>();
    marksByStudent.set(studentId, new Map());
    for (const e of completed) {
      for (const m of e.marks) {
        marksByStudent.get(studentId)!.set(e.id, Number(m.obtained));
      }
    }

    const activeTypes = await this.prisma.examType.findMany({
      where: { status: 'ACTIVE' },
    });
    const allActiveWeightSum = activeTypes.reduce((acc, t) => acc + t.weight, 0);

    const completedByExam = completed.map((e) => ({
      id: e.id,
      totalMarks: e.totalMarks,
      examTypeId: e.examTypeId,
      weight: e.examType.weight,
    }));

    const { weightedTotal, isPartial } = this.computeWeightedTotal({
      completedExams: completedByExam,
      marksByStudent,
      studentId,
      allActiveWeightSum,
      anyScheduled,
    });
    const scheme = await this.resolveScheme();
    const { letter, gpa } = scheme?.tiers
      ? this.resolveLetter(weightedTotal, scheme.tiers)
      : { letter: null, gpa: null };

    return {
      message: 'Student offering result',
      data: { offering, weightedTotal, letter, gpa, isPartial },
    };
  }

  async studentTranscript(studentId: string, semesterId?: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const offeringWhere: Prisma.OfferingWhereInput = {
      batchId: student.batchId ?? undefined,
      ...(semesterId ? { semesterId } : {}),
    };
    const offerings = await this.prisma.offering.findMany({
      where: offeringWhere,
      include: { semester: true, course: true },
    });

    const semestersMap = new Map<string, any>();
    for (const o of offerings) {
      const r = await this.studentOfferingResult(studentId, o.id);
      const sid = o.semesterId;
      if (!semestersMap.has(sid)) {
        semestersMap.set(sid, {
          semester: o.semester,
          courses: [] as any[],
          totalCreditAttempted: 0,
          totalCreditEarned: 0,
          gpaAccumulator: 0,
        });
      }
      const semEntry = semestersMap.get(sid)!;
      const credits = o.course.creditHours ?? 0;
      const passed = r.data.gpa !== null && r.data.gpa > 0;
      semEntry.courses.push({
        course: o.course,
        credits,
        weightedTotal: r.data.weightedTotal,
        letter: r.data.letter,
        gpa: r.data.gpa,
      });
      semEntry.totalCreditAttempted += credits;
      if (passed) semEntry.totalCreditEarned += credits;
      if (r.data.gpa !== null) semEntry.gpaAccumulator += r.data.gpa * credits;
    }

    const semesters = [...semestersMap.values()].map((s) => ({
      semester: s.semester,
      courses: s.courses,
      semesterGpa: s.totalCreditAttempted
        ? Number((s.gpaAccumulator / s.totalCreditAttempted).toFixed(2))
        : null,
      creditHoursAttempted: s.totalCreditAttempted,
      creditHoursEarned: s.totalCreditEarned,
    }));

    const totalCreditsAttempted = semesters.reduce(
      (acc, s) => acc + s.creditHoursAttempted,
      0,
    );
    const totalCreditsEarned = semesters.reduce(
      (acc, s) => acc + s.creditHoursEarned,
      0,
    );
    const cumulativeAcc = semesters.reduce((acc, s) => {
      if (s.semesterGpa === null) return acc;
      return acc + s.semesterGpa * s.creditHoursAttempted;
    }, 0);
    const cumulativeGpa = totalCreditsAttempted
      ? Number((cumulativeAcc / totalCreditsAttempted).toFixed(2))
      : null;

    return {
      message: 'Transcript computed',
      data: {
        student,
        semesters,
        cumulativeGpa,
        totalCreditsAttempted,
        totalCreditsEarned,
      },
    };
  }
}
