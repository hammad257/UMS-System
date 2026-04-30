import { Module } from '@nestjs/common';
import { GuardianService } from './gaurdian.service';
import { GuardianController } from './gaurdian.controller';

@Module({
  controllers: [GuardianController],
  providers: [GuardianService],
})
export class GuardianModule {}