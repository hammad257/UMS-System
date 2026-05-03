import { Test, TestingModule } from '@nestjs/testing';
import { AcademicFacultyController } from './faculty.controller';
import { AcademicFacultyService } from './faculty.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AcademicFacultyController', () => {
  let controller: AcademicFacultyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcademicFacultyController],
      providers: [
        AcademicFacultyService,
        { provide: PrismaService, useValue: {} },
      ],
    })
      .overrideGuard((await import('@nestjs/passport')).AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AcademicFacultyController>(
      AcademicFacultyController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
