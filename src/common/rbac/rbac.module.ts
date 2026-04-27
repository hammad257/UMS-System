import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { PermissionScannerService } from './permissions-scanner.service';

@Module({
  imports: [DiscoveryModule],
  providers: [PermissionScannerService],
  exports: [PermissionScannerService],
})
export class RbacModule {}