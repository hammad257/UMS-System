import { Test, TestingModule } from '@nestjs/testing';
import { GuardianService } from './gaurdian.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GuardianService', () => {
  let service: GuardianService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuardianService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<GuardianService>(GuardianService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
