import { Test, TestingModule } from '@nestjs/testing';
import { GuardianController } from './gaurdian.controller';
import { GuardianService } from './gaurdian.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GuardianController', () => {
  let controller: GuardianController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuardianController],
      providers: [GuardianService, { provide: PrismaService, useValue: {} }],
    }).compile();

    controller = module.get<GuardianController>(GuardianController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
