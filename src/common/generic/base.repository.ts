import {
  Repository,
  DeepPartial,
  FindManyOptions,
  DeleteResult,
  FindOneOptions,
} from 'typeorm';

export abstract class BaseRepositoryAbstract<T> {
  protected constructor(private readonly repository: Repository<T>) {}
  async find(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async create(entity: DeepPartial<T>): Promise<T> {
    const newItem = this.repository.create(entity);
    return this.repository.save(newItem);
  }

  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne(options);
  }

  async paginate(
    filter: Partial<T> = {},
    options: any = {},
  ): Promise<{ docs: T[]; pagination: any }> {
    const [docs, count] = await this.repository.findAndCount({
      where: filter,
      ...options,
    });
    return { docs, pagination: { total: count } };
  }
}
