import { Test, TestingModule } from '@nestjs/testing';
import { GaurdianController } from './gaurdian.controller';
import { GaurdianService } from './gaurdian.service';

describe('GaurdianController', () => {
  let controller: GaurdianController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GaurdianController],
      providers: [GaurdianService],
    }).compile();

    controller = module.get<GaurdianController>(GaurdianController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
