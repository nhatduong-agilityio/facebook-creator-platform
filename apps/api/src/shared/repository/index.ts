import type {
  DataSource,
  FindOptionsSelect,
  FindOptionsWhere,
  ObjectLiteral,
  Repository
} from 'typeorm';

/**
 * Abstract base for all TypeORM repositories.
 *
 * Provides findById and delete for free.
 * Subclasses add domain-specific methods — no abstract methods are forced.
 *
 * E = TypeORM Entity class (UserEntity, PostEntity, ...)
 *
 * Usage:
 *   export class UserRepository extends BaseRepository<UserEntity> {
 *     constructor(dataSource: DataSource) {
 *       super(dataSource, UserEntity);
 *     }
 *     // add custom methods below
 *   }
 */
export abstract class BaseRepository<E extends ObjectLiteral> {
  protected readonly repo: Repository<E>;

  constructor(dataSource: DataSource, entity: new () => E) {
    this.repo = dataSource.getRepository(entity);
  }

  /**
   * Find a record by its UUID primary key.
   * Returns null when not found — callers decide whether to throw NotFoundError.
   */
  async findById(id: string, select?: FindOptionsSelect<E>): Promise<E | null> {
    return await this.repo.findOne({
      where: { id } as unknown as FindOptionsWhere<E>,
      ...(select ? { select } : {})
    });
  }

  /**
   * Delete a record by its UUID primary key.
   * Returns true when a row was actually removed, false when nothing matched.
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
