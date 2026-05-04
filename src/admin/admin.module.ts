import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../common/rbac/rbac.module';

@Module({
  imports: [AuthModule, RbacModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
