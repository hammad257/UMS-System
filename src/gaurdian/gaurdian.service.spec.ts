import { Test, TestingModule } from '@nestjs/testing';
import { GaurdianService } from './gaurdian.service';

describe('GaurdianService', () => {
  let service: GaurdianService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GaurdianService],
    }).compile();

    service = module.get<GaurdianService>(GaurdianService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
