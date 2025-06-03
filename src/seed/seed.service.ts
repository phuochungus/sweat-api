import { Injectable } from '@nestjs/common';
import { User } from 'src/entities';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { UserGender } from 'src/common/enums';

@Injectable()
export class SeedService {
  constructor(private readonly dataSource: DataSource) {}

  private generateUser(id: number): Partial<User> {
    return {
      id,
      fullname: faker.person.fullName(),
      avatarUrl: faker.image.avatar(),
      coverUrl: faker.image.urlLoremFlickr({ category: 'sports' }),
      bio: faker.lorem.sentence(),
      gender: faker.helpers.arrayElement(Object.values(UserGender)),
    };
  }
  async seedDatabase() {
    const users = Array.from({ length: 1000 }, (_, i) =>
      this.generateUser(i + 1),
    );
    await this.dataSource.getRepository(User).save(users);
  }
}
