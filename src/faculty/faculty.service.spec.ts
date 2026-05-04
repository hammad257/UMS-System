import { Test, TestingModule } from '@nestjs/testing';
import { AcademicFacultyService } from './faculty.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AcademicFacultyService', () => {
  let service: AcademicFacultyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicFacultyService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<AcademicFacultyService>(AcademicFacultyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
