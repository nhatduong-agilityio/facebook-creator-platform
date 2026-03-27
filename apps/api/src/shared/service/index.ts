/**
 * Abstract base for all services.
 *
 * Provides no concrete methods — exists to establish the convention
 * that every service constructor receives its repository dependencies,
 * and to give a common type for future cross-cutting concerns
 * (e.g. logging, audit trail injection).
 *
 * Usage:
 *   export class AuthService extends BaseService {
 *     constructor(private readonly userRepo: UserRepository) {
 *       super();
 *     }
 *   }
 */
export abstract class BaseService {
  // Reserved for future shared service utilities:
  // - structured logging helper
  // - audit log emitter
  // - plan limit checker
}
