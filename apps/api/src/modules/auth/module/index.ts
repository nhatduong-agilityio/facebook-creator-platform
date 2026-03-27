import type { DataSource } from 'typeorm';
import { AuthController } from '../controller';
import { AuthService } from '../service';
import { UserRepository } from '@/modules/users/repository';

export function createAuthModule(dataSource: DataSource): AuthController {
  const userRepo = new UserRepository(dataSource);
  const authService = new AuthService(userRepo);
  const controller = new AuthController(authService);

  return controller;
}
