import { PartialType } from '@nestjs/swagger';
import { CreateGuardianDto } from './create-gaurdian.dto';

export class UpdateGuardianDto extends PartialType(CreateGuardianDto) {}