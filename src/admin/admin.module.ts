import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { RbacModule } from 'src/common/rbac/rbac.module';
import { PermissionScannerService } from 'src/common/rbac/permissions-scanner.service';
import { MetadataScanner } from '@nestjs/core';

@Module({
  controllers: [AdminController],
  providers: [AdminService, PrismaService,
    PermissionScannerService,
    MetadataScanner
  ],
  imports: [RbacModule],

})
export class AdminModule { }