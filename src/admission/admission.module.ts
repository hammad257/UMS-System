import { Module } from '@nestjs/common';
import { AdmissionService } from './admission.service';
import { AdmissionController } from './admission.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AdmissionController],
  providers: [AdmissionService],
})
export class AdmissionModule {}
