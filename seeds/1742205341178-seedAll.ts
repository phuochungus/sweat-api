import { MigrationInterface, QueryRunner } from 'typeorm';
import { faker } from '@faker-js/faker';
import { User } from 'src/entities';
import { UserGender } from 'src/common/enums';
import * as moment from 'moment';

export class SeedAll1742205341178 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    let users = Array.from({ length: 100 }, () => ({
      friendCount: 0,
      bio: faker.lorem.sentence(),
      avatarUrl: faker.image.avatar(),
      birthday: moment(faker.date.birthdate()).format('YYYY-MM-DD'),
      fullname: faker.person.fullName(),
      coverUrl: faker.image.urlPicsumPhotos(),
      gender: faker.helpers.arrayElement([
        UserGender.FEMALE,
        UserGender.MALE,
        UserGender.OTHER,
      ]),
    }));

    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into('user')
      .values(users)
      .execute();

    // users = await queryRunner.manager.find

    // await Promise.all(
    //   users.map(async (user) => {
    //     const friendsCount = await this.dataSource
    //       .createQueryBuilder(UserFriend, 'uf')
    //       .where('uf.userId1 = :userId OR uf.userId2 = :userId', {
    //         userId: user.id,
    //       })
    //       .getCount();

    //     await this.dataSource
    //       .createQueryBuilder(User, 'u')
    //       .update()
    //       .set({ friendCount: friendsCount })
    //       .where('id = :id', { id: user.id })
    //       .execute();
    //   }),
    // );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
