import { Test, TestingModule } from '@nestjs/testing';
import { SheinService } from './shein.service';

describe('SheinService', () => {
  let service: SheinService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SheinService],
    }).compile();

    service = module.get<SheinService>(SheinService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
