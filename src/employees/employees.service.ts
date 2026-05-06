import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { Prisma, EmployeeRole, EmployeeStatus, EmployeeType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEmployeeDto,
  ListEmployeesQueryDto,
  PromoteEmployeeToUserDto,
  SetEmployeeDepartmentsDto,
  UpdateEmployeeDto,
} from './dto/employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async generateEmployeeNumber(
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<string> {
    const count = await tx.employee.count();
    const next = count + 1;
    return `EMP-${String(next).padStart(4, '0')}`;
  }

  private validateRoleType(role: EmployeeRole, employeeType: EmployeeType) {
    if (employeeType === EmployeeType.FACULTY && role !== EmployeeRole.TEACHER) {
      throw new BadRequestException(
        'Employees with employeeType=FACULTY must have role=TEACHER',
      );
    }
    if (employeeType === EmployeeType.NON_FACULTY && role === EmployeeRole.TEACHER) {
      throw new BadRequestException(
        'Employees with role=TEACHER must have employeeType=FACULTY',
      );
    }
  }

  private validateAge(dob?: string, joiningDate?: string) {
    if (!dob || !joiningDate) return;
    const birth = new Date(dob);
    const join = new Date(joiningDate);
    const minJoin = new Date(birth);
    minJoin.setFullYear(minJoin.getFullYear() + 18);
    if (join < minJoin) {
      throw new BadRequestException(
        'Employee must be at least 18 years old at joining date',
      );
    }
  }

  private validatePrimaryInDepartments(
    primaryDepartmentId: string | undefined,
    departmentIds: string[] | undefined,
  ) {
    if (!primaryDepartmentId || !departmentIds || departmentIds.length === 0) return;
    if (!departmentIds.includes(primaryDepartmentId)) {
      throw new BadRequestException(
        'primaryDepartmentId must be one of the assigned departmentIds',
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------

  async create(dto: CreateEmployeeDto) {
    this.validateRoleType(dto.role, dto.employeeType);
    this.validateAge(dto.dob, dto.joiningDate);
    this.validatePrimaryInDepartments(dto.primaryDepartmentId, dto.departmentIds);

    const join = new Date(dto.joiningDate);
    if (join > new Date()) {
      throw new BadRequestException('joiningDate cannot be in the future');
    }

    if (dto.primaryDepartmentId) {
      const dept = await this.prisma.department.findUnique({
        where: { id: dto.primaryDepartmentId },
        select: { id: true },
      });
      if (!dept) throw new NotFoundException('primaryDepartmentId not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const employeeNumber =
        dto.employeeNumber ?? (await this.generateEmployeeNumber(tx));

      let userId: string | undefined;
      if (dto.createUser) {
        const passwordHash = await argon2.hash(dto.createUser.password);
        const user = await tx.user.create({
          data: {
            email: dto.email.toLowerCase(),
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            status: 'ACTIVE',
            userRoles: {
              create: dto.createUser.roleIds.map((roleId) => ({ roleId })),
            },
          },
        });
        userId = user.id;
      }

      try {
        const employee = await tx.employee.create({
          data: {
            employeeNumber,
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email.toLowerCase(),
            phone: dto.phone,
            dob: dto.dob ? new Date(dto.dob) : undefined,
            gender: dto.gender,
            address: dto.address,
            nationality: dto.nationality,
            cnic: dto.cnic,
            role: dto.role,
            employeeType: dto.employeeType,
            designation: dto.designation,
            employmentType: dto.employmentType,
            joiningDate: join,
            status: dto.status ?? EmployeeStatus.ACTIVE,
            primaryDepartmentId: dto.primaryDepartmentId,
            photoUrl: dto.photoUrl,
            userId,
            departments: dto.departmentIds?.length
              ? {
                  create: dto.departmentIds.map((departmentId) => ({
                    departmentId,
                  })),
                }
              : undefined,
          },
          include: {
            primaryDepartment: true,
            departments: { include: { department: true } },
            user: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
        });
        return { message: 'Employee created', data: employee };
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          const field = (e.meta?.target as string[] | undefined)?.join(', ') ?? 'unique field';
          throw new ConflictException(`Employee with this ${field} already exists`);
        }
        throw e;
      }
    });
  }

  // ---------------------------------------------------------------------------
  // List / Read
  // ---------------------------------------------------------------------------

  async findAll(query: ListEmployeesQueryDto) {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.pageSize ?? 20);
    const skip = (page - 1) * pageSize;

    const where: Prisma.EmployeeWhereInput = { deletedAt: null };
    if (query.role) where.role = query.role;
    if (query.employeeType) where.employeeType = query.employeeType;
    if (query.status) where.status = query.status;
    if (query.departmentId) {
      where.OR = [
        { primaryDepartmentId: query.departmentId },
        { departments: { some: { departmentId: query.departmentId } } },
      ];
    }
    if (query.search) {
      const s = query.search;
      where.AND = [
        {
          OR: [
            { firstName: { contains: s, mode: 'insensitive' } },
            { lastName: { contains: s, mode: 'insensitive' } },
            { email: { contains: s, mode: 'insensitive' } },
            { employeeNumber: { contains: s, mode: 'insensitive' } },
            { designation: { contains: s, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          primaryDepartment: { select: { id: true, code: true, name: true } },
          departments: {
            include: { department: { select: { id: true, code: true, name: true } } },
          },
          user: { select: { id: true, email: true, status: true } },
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      message: 'Employees fetched',
      data: {
        items,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      },
    };
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        primaryDepartment: true,
        departments: { include: { department: true } },
        user: { select: { id: true, email: true, status: true } },
      },
    });
    if (!employee || employee.deletedAt) {
      throw new NotFoundException('Employee not found');
    }
    return { message: 'Employee fetched', data: employee };
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  async update(id: string, dto: UpdateEmployeeDto) {
    const existing = await this.prisma.employee.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Employee not found');
    }

    const role = dto.role ?? existing.role;
    const employeeType = dto.employeeType ?? existing.employeeType;
    this.validateRoleType(role, employeeType);
    this.validateAge(
      dto.dob ?? existing.dob?.toISOString(),
      dto.joiningDate ?? existing.joiningDate.toISOString(),
    );
    this.validatePrimaryInDepartments(dto.primaryDepartmentId, dto.departmentIds);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.employee.update({
        where: { id },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email?.toLowerCase(),
          phone: dto.phone,
          dob: dto.dob ? new Date(dto.dob) : undefined,
          gender: dto.gender,
          address: dto.address,
          nationality: dto.nationality,
          cnic: dto.cnic,
          role: dto.role,
          employeeType: dto.employeeType,
          designation: dto.designation,
          employmentType: dto.employmentType,
          joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : undefined,
          status: dto.status,
          primaryDepartmentId: dto.primaryDepartmentId,
          photoUrl: dto.photoUrl,
        },
      });

      // Sync linked User's email/name when changed.
      if (existing.userId && (dto.email || dto.firstName || dto.lastName)) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            email: dto.email?.toLowerCase(),
            firstName: dto.firstName,
            lastName: dto.lastName,
          },
        });
      }

      // Replace department M2M when departmentIds is provided.
      if (dto.departmentIds) {
        await tx.employeeDepartment.deleteMany({ where: { employeeId: id } });
        if (dto.departmentIds.length > 0) {
          await tx.employeeDepartment.createMany({
            data: dto.departmentIds.map((departmentId) => ({
              employeeId: id,
              departmentId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return { message: 'Employee updated', data: updated };
    });
  }

  // ---------------------------------------------------------------------------
  // Delete (soft)
  // ---------------------------------------------------------------------------

  async remove(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        facultiesAsDean: { select: { id: true } },
        departmentsAsHead: { select: { id: true } },
        courseAssignments: { select: { id: true } },
      },
    });
    if (!employee || employee.deletedAt) {
      throw new NotFoundException('Employee not found');
    }
    if (employee.facultiesAsDean.length || employee.departmentsAsHead.length) {
      throw new ConflictException(
        'Cannot delete: employee is currently a Faculty dean or Department head. Reassign first.',
      );
    }
    if (employee.courseAssignments.length) {
      throw new ConflictException(
        'Cannot delete: employee has active course assignments',
      );
    }

    await this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date(), status: EmployeeStatus.INACTIVE },
    });
    return { message: 'Employee deleted', data: null };
  }

  // ---------------------------------------------------------------------------
  // Department M2M
  // ---------------------------------------------------------------------------

  async setDepartments(id: string, dto: SetEmployeeDepartmentsDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee || employee.deletedAt) {
      throw new NotFoundException('Employee not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.employeeDepartment.deleteMany({ where: { employeeId: id } });
      if (dto.departmentIds.length > 0) {
        await tx.employeeDepartment.createMany({
          data: dto.departmentIds.map((departmentId) => ({
            employeeId: id,
            departmentId,
          })),
          skipDuplicates: true,
        });
      }
      const updated = await tx.employee.findUnique({
        where: { id },
        include: { departments: { include: { department: true } } },
      });
      return { message: 'Departments updated', data: updated };
    });
  }

  // ---------------------------------------------------------------------------
  // Promote / Demote login User
  // ---------------------------------------------------------------------------

  async promoteToUser(id: string, dto: PromoteEmployeeToUserDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee || employee.deletedAt) {
      throw new NotFoundException('Employee not found');
    }
    if (employee.userId) {
      throw new ConflictException('Employee already has a linked user account');
    }

    const passwordHash = await argon2.hash(dto.password);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: employee.email,
          passwordHash,
          firstName: employee.firstName,
          lastName: employee.lastName,
          status: 'ACTIVE',
          userRoles: { create: dto.roleIds.map((roleId) => ({ roleId })) },
        },
      });
      const updated = await tx.employee.update({
        where: { id },
        data: { userId: user.id },
        include: { user: { select: { id: true, email: true } } },
      });
      return { message: 'Employee promoted to login user', data: updated };
    });
  }

  async demoteFromUser(id: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee || employee.deletedAt) {
      throw new NotFoundException('Employee not found');
    }
    if (!employee.userId) {
      throw new ConflictException('Employee has no linked user account');
    }

    return this.prisma.$transaction(async (tx) => {
      const userId = employee.userId!;
      await tx.employee.update({ where: { id }, data: { userId: null } });
      await tx.user.update({
        where: { id: userId },
        data: { deletedAt: new Date(), status: 'INACTIVE' },
      });
      return { message: 'Login user unlinked and deactivated', data: null };
    });
  }
}
