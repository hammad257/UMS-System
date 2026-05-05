import { Module } from '@nestjs/common';
import { GuardiansController, StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  controllers: [StudentsController, GuardiansController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
