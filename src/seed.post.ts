import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import {
  MediaType,
  NotificationStatus,
  PostPrivacy,
  ReactType,
} from './common/enums';
import { SOCIAL } from './notification/enum';
import { TEMPLATE } from './notification/template';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Sport-related content generators
const generateSportWorkoutTitle = (): string => {
  const workoutTypes = [
    'Strength Training',
    'HIIT',
    'Cardio',
    'CrossFit',
    'Yoga',
    'Pilates',
    'Cycling',
    'Running',
    'Swimming',
    'Boxing',
    'Weight Lifting',
    'Functional Training',
    'Circuit Training',
    'Core Workout',
    'Leg Day',
    'Arm Day',
    'Back Day',
    'Chest Day',
    'Rest Day',
    'Recovery Session',
  ];

  const intensities = [
    'Intense',
    'Light',
    'Moderate',
    'Challenging',
    'Recovery',
    'Brutal',
    'Easy',
    'Hard-core',
    'Refreshing',
    'Energizing',
  ];

  const feelings = [
    'Feeling great after',
    'Just crushed',
    'Survived',
    'Loving my',
    'Struggling through',
    'Proud of completing',
    'Smashed',
    'Enjoying',
    'Pushing through',
    'Celebrating my progress with',
  ];

  const duration = faker.number.int({ min: 15, max: 120 });

  return `${faker.helpers.arrayElement(feelings)} my ${faker.helpers.arrayElement(intensities)} ${faker.helpers.arrayElement(workoutTypes)} session! ${duration} mins well spent! 💪`;
};

const generateWorkoutDetails = (): string => {
  const sets = faker.number.int({ min: 3, max: 5 });
  const exercises = [
    'squats',
    'deadlifts',
    'bench press',
    'pull-ups',
    'push-ups',
    'lunges',
    'planks',
    'burpees',
    'mountain climbers',
    'kettlebell swings',
    'box jumps',
    'bicep curls',
    'shoulder press',
    'leg press',
    'crunches',
    'jumping jacks',
    'treadmill sprints',
    'battle ropes',
    'rowing',
    'stair climber',
  ];

  const selectedExercises = faker.helpers.arrayElements(
    exercises,
    faker.number.int({ min: 3, max: 6 }),
  );

  return (
    selectedExercises
      .map((exercise) => {
        const reps = faker.number.int({ min: 8, max: 20 });
        return `${sets}x${reps} ${exercise}`;
      })
      .join('\n') + '\n\nPushing my limits every day! 🔥'
  );
};

const generateMotivationalContent = (): string => {
  const quotes = [
    "The only bad workout is the one that didn't happen.",
    "Your body can stand almost anything. It's your mind that you have to convince.",
    'No pain, no gain!',
    'Strive for progress, not perfection.',
    "The hard work happens when nobody's watching.",
    'Sweat is just fat crying.',
    'Your health is your wealth.',
    "The best project you'll ever work on is yourself.",
    "Don't stop when you're tired. Stop when you're done.",
    'Results happen over time, not overnight.',
  ];

  return (
    faker.helpers.arrayElement(quotes) +
    ' ' +
    faker.helpers.arrayElement(['💪', '🏋️‍♀️', '🏃‍♂️', '🔥', '⚡', '🥇'])
  );
};

const generateWorkoutTips = (): string => {
  const tips = [
    'Remember to stay hydrated during your workouts!',
    'Always focus on proper form over heavier weights.',
    'Rest days are just as important as workout days.',
    'Progressive overload is key to building strength.',
    'Try to incorporate both strength and cardio training for optimal fitness.',
    'Proper nutrition is 80% of your fitness journey.',
    'Track your workouts to monitor progress over time.',
    'Warming up and cooling down prevents injuries.',
    'Sleep is essential for muscle recovery and growth.',
    'Find a workout buddy to keep you accountable!',
  ];

  return (
    faker.helpers.arrayElement(tips) +
    ' ' +
    faker.helpers.arrayElement(['💯', '👏', '✅', '🔑', '📝', '🥗'])
  );
};

const generateSportComment = (): string => {
  const comments = [
    'Looking strong! Keep it up!',
    'Great form on those exercises!',
    "What's your nutrition plan like?",
    'Impressive progress! How long have you been training?',
    "That's a killer workout routine!",
    'Which gym do you go to?',
    'Have you tried adding resistance bands to that exercise?',
    'Your dedication is inspiring!',
    'What supplements are you taking?',
    'Mind sharing your workout split?',
    'Those gains are showing!',
    'How many days a week do you train?',
    'Beast mode activated!',
    'Any tips for someone just starting out?',
    'Have you tried HIIT workouts?',
    'Protein shake recipe please!',
  ];

  return faker.helpers.arrayElement(comments);
};

const generateSportReply = (): string => {
  const replies = [
    'Thanks for the support! Means a lot!',
    "I've been training consistently for 6 months now.",
    "I'm currently doing a 5-day split focusing on different muscle groups.",
    'I take protein, creatine, and BCAAs after workouts.',
    "I'd suggest starting with compound movements and focusing on form.",
    'My current protein shake is banana, peanut butter, almond milk, and vanilla protein!',
    "I've seen the best results with progressive overload and good nutrition.",
    'HIIT has been a game-changer for my cardio endurance!',
    "Rest days are when the growth happens! Don't skip them!",
    "Yes! Let's connect and work out sometime!",
    'I train at FitnessZone downtown. Great facilities!',
    'Try adding resistance bands for extra challenge!',
    "I'm doing intermittent fasting along with my workouts.",
    'Thanks! Consistency is the key to progress!',
    'Water intake is so important - I aim for a gallon a day.',
  ];

  return faker.helpers.arrayElement(replies);
};

const generateSportLocation = (): string => {
  const locations = [
    "Gold's Gym",
    'LA Fitness',
    'Planet Fitness',
    '24 Hour Fitness',
    'Anytime Fitness',
    'Equinox',
    'CrossFit Box',
    'City Park',
    'Home Gym',
    'Running Track',
    'Swimming Pool',
    'Yoga Studio',
    'Community Center',
    'Sports Complex',
    'University Gym',
    'Outdoor Trail',
  ];

  return faker.helpers.arrayElement(locations);
};

// Function to generate workout image URL
const generateSportMediaUrl = (type: 'IMAGE' | 'VIDEO'): string => {
  if (type === 'IMAGE') {
    // Using more reliable sources for images
    const sportImages = [
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600',
      'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=800&h=600',
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&h=600',
      'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&h=600',
      'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&h=600',
      'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&h=600',
      'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&h=600',
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&h=600',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&h=600',
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600',
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&h=600',
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&h=600',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=600',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600',
      'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=800&h=600',
      'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&h=600',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600',
      'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&h=600',
      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&h=600',
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&h=600',
    ];
    return faker.helpers.arrayElement(sportImages);
  } else {
    // Real video URLs from Pixabay (free stock videos with no attribution required)
    const sportVideos = [
      'https://cdn.pixabay.com/vimeo/295548492/deadlift-15177.mp4', // Weightlifting
      'https://cdn.pixabay.com/vimeo/328640385/runner-23616.mp4', // Running
      'https://cdn.pixabay.com/vimeo/343014085/yoga-30532.mp4', // Yoga
      'https://cdn.pixabay.com/vimeo/403166977/workout-39739.mp4', // Home workout
      'https://cdn.pixabay.com/vimeo/303545335/push-up-16993.mp4', // Push-ups
      'https://cdn.pixabay.com/vimeo/148814195/exercise-1202.mp4', // Exercise
      'https://cdn.pixabay.com/vimeo/471036081/sports-48735.mp4', // Sports general
      'https://cdn.pixabay.com/vimeo/426735427/gym-41982.mp4', // Gym
    ];

    return faker.helpers.arrayElement(sportVideos);
  }
};

// Main seeding function
async function seedPosts() {
  console.log('🏋️‍♀️ Starting to seed posts with sport-related content...');

  const dataSource = new DataSource({
    type: (process.env.ORM_CONNECTION as any) || 'postgres',
    host: process.env.ORM_HOST,
    port: parseInt(process.env.ORM_PORT || '5432'),
    username: process.env.ORM_USERNAME,
    password: process.env.ORM_PASSWORD,
    database: process.env.ORM_DB,
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Get all users
    const users = await dataSource.query(`
      SELECT id, fullname FROM "user"
    `);

    if (users.length === 0) {
      throw new Error(
        'No users found in the database. Please seed users first.',
      );
    }

    const userIds = users.map((user) => user.id);
    console.log(`📊 Found ${userIds.length} users in the database`);

    // Create posts
    console.log('📝 Creating sport-related posts...');
    const postIds = [];
    for (let i = 0; i < 30; i++) {
      const userId = faker.helpers.arrayElement(userIds);
      const user = users.find((u) => u.id === userId);

      // Randomly select the type of workout post
      const postContentType = faker.helpers.arrayElement([
        'workout_title',
        'workout_details',
        'motivational',
        'workout_tips',
      ]);

      let postContent;
      switch (postContentType) {
        case 'workout_title':
          postContent = generateSportWorkoutTitle();
          break;
        case 'workout_details':
          postContent = generateWorkoutDetails();
          break;
        case 'motivational':
          postContent = generateMotivationalContent();
          break;
        case 'workout_tips':
          postContent = generateWorkoutTips();
          break;
        default:
          postContent = generateSportWorkoutTitle();
      }

      // Create the post
      const insertResult = await dataSource.query(
        `
        INSERT INTO "post" (
          "text",
          "privacy",
          "userId",
          "location"
        ) VALUES (
          $1, $2, $3, $4
        ) RETURNING id
        `,
        [
          postContent,
          faker.helpers.enumValue(PostPrivacy),
          userId,
          generateSportLocation(),
        ],
      );

      const postId = insertResult[0].id;
      postIds.push(postId);

      // Add 1-3 media items to some posts (higher probability than default seed)
      if (faker.datatype.boolean({ probability: 0.7 })) {
        const mediaCount = faker.number.int({ min: 1, max: 3 });
        for (let j = 0; j < mediaCount; j++) {
          // Higher probability of images than videos
          const mediaType =
            faker.number.int({ min: 1, max: 10 }) <= 9
              ? MediaType.IMAGE
              : MediaType.VIDEO;

          await dataSource.query(
            `
            INSERT INTO "post_media" (
              "postId",
              "priority",
              "url",
              "type"
            ) VALUES (
              $1, $2, $3, $4
            )
            `,
            [postId, j, generateSportMediaUrl(mediaType), mediaType],
          );
        }

        // Update media count
        await dataSource.query(
          `
          UPDATE "post" 
          SET "mediaCount" = $1
          WHERE "id" = $2
          `,
          [mediaCount, postId],
        );
      }

      console.log(
        `✅ Created post #${i + 1}: ${postContent.substring(0, 40)}...`,
      );
    }

    // Create comments
    console.log('💬 Creating sport-related comments...');
    const commentIds = [];
    for (const postId of postIds) {
      // Higher number of comments for better interaction
      const commentCount = faker.number.int({ min: 1, max: 8 });

      for (let i = 0; i < commentCount; i++) {
        const userId = faker.helpers.arrayElement(userIds);
        const user = users.find((u) => u.id === userId);

        const insertResult = await dataSource.query(
          `
          INSERT INTO "post_comment" (
            "userId",
            "postId",
            "text"
          ) VALUES (
            $1, $2, $3
          ) RETURNING id
          `,
          [userId, postId, generateSportComment()],
        );

        commentIds.push(insertResult[0].id);
      }

      // Update comment count
      await dataSource.query(
        `
        UPDATE "post" 
        SET "commentCount" = $1
        WHERE "id" = $2
        `,
        [commentCount, postId],
      );
    }

    // Create comment replies (nested comments)
    console.log('🔄 Creating replies to comments...');
    for (const commentId of commentIds) {
      if (faker.datatype.boolean({ probability: 0.4 })) {
        // 40% chance of replies
        const replyCount = faker.number.int({ min: 1, max: 3 });

        // Get the parent comment to know its postId
        const parentComment = await dataSource.query(
          `
          SELECT "postId" FROM "post_comment" WHERE "id" = $1
          `,
          [commentId],
        );

        if (parentComment.length > 0) {
          const postId = parentComment[0].postId;

          for (let i = 0; i < replyCount; i++) {
            const userId = faker.helpers.arrayElement(userIds);
            const user = users.find((u) => u.id === userId);

            await dataSource.query(
              `
              INSERT INTO "post_comment" (
                "userId",
                "postId",
                "text",
                "replyCommentId"
              ) VALUES (
                $1, $2, $3, $4
              )
              `,
              [userId, postId, generateSportReply(), commentId],
            );

            // Update reply count for parent comment
            await dataSource.query(
              `
              UPDATE "post_comment" 
              SET "replyCount" = "replyCount" + 1
              WHERE "id" = $1
              `,
              [commentId],
            );

            // Update post comment count
            await dataSource.query(
              `
              UPDATE "post" 
              SET "commentCount" = "commentCount" + 1
              WHERE "id" = $1
              `,
              [postId],
            );
          }
        }
      }
    }

    // Create reactions on posts
    console.log('👍 Creating reactions on posts...');
    for (const postId of postIds) {
      // Higher number of reactions for better engagement
      const reactCount = faker.number.int({ min: 3, max: 15 });
      const reactingUserIds = faker.helpers.arrayElements(userIds, reactCount);

      for (const userId of reactingUserIds) {
        // Get post author
        const postData = await dataSource.query(
          `
          SELECT "userId" FROM "post" WHERE "id" = $1
          `,
          [postId],
        );

        await dataSource.query(
          `
          INSERT INTO "post_react" (
            "userId",
            "postId",
            "type"
          ) VALUES (
            $1, $2, $3
          )
          `,
          [userId, postId, faker.helpers.enumValue(ReactType)],
        );

        // Create notification if reacting to someone else's post
        if (postData.length > 0 && postData[0].userId !== userId) {
          const currentUser = await dataSource.query(
            `
            SELECT "fullname" FROM "user" WHERE "id" = $1
            `,
            [userId],
          );

          const post = await dataSource.query(
            `
            SELECT "text" FROM "post" WHERE "id" = $1
            `,
            [postId],
          );

          if (currentUser.length > 0 && post.length > 0) {
            await dataSource.query(
              `
              INSERT INTO "user_notification" (
                "receiverUserId",
                "senderUserId",
                "postId",
                "type",
                "status",
                "text"
              ) VALUES (
                $1, $2, $3, $4, $5, $6
              )
              `,
              [
                postData[0].userId,
                userId,
                postId,
                SOCIAL.REACT,
                NotificationStatus.UNREAD,
                TEMPLATE.REACT.replace('<n>', currentUser[0].fullname).replace(
                  '<content>',
                  post[0].text.substring(0, 30) +
                    (post[0].text.length > 30 ? '...' : ''),
                ),
              ],
            );
          }
        }
      }

      // Update react count
      await dataSource.query(
        `
        UPDATE "post" 
        SET "reactCount" = $1
        WHERE "id" = $2
        `,
        [reactCount, postId],
      );
    }

    // Create reactions on comments
    console.log('❤️ Creating reactions on comments...');
    for (const commentId of commentIds) {
      if (faker.datatype.boolean({ probability: 0.6 })) {
        // 60% chance for comment reactions
        const reactCount = faker.number.int({ min: 1, max: 5 });
        const reactingUserIds = faker.helpers.arrayElements(
          userIds,
          reactCount,
        );

        // Get the comment data
        const commentData = await dataSource.query(
          `
          SELECT "userId", "postId", "text" FROM "post_comment" WHERE "id" = $1
          `,
          [commentId],
        );

        for (const userId of reactingUserIds) {
          await dataSource.query(
            `
            INSERT INTO "post_react" (
              "userId",
              "commentId",
              "type"
            ) VALUES (
              $1, $2, $3
            )
            `,
            [userId, commentId, faker.helpers.enumValue(ReactType)],
          );

          // Create notification if reacting to someone else's comment
          if (commentData.length > 0 && commentData[0].userId !== userId) {
            const currentUser = await dataSource.query(
              `
              SELECT "fullname" FROM "user" WHERE "id" = $1
              `,
              [userId],
            );

            if (currentUser.length > 0) {
              await dataSource.query(
                `
                INSERT INTO "user_notification" (
                  "receiverUserId",
                  "senderUserId",
                  "postId",
                  "type",
                  "status",
                  "text"
                ) VALUES (
                  $1, $2, $3, $4, $5, $6
                )
                `,
                [
                  commentData[0].userId,
                  userId,
                  commentData[0].postId,
                  SOCIAL.REACT,
                  NotificationStatus.UNREAD,
                  TEMPLATE.REACT.replace(
                    '<n>',
                    currentUser[0].fullname,
                  ).replace(
                    '<content>',
                    commentData[0].text.substring(0, 30) +
                      (commentData[0].text.length > 30 ? '...' : ''),
                  ),
                ],
              );
            }
          }
        }

        // Update comment react count
        await dataSource.query(
          `
          UPDATE "post_comment" 
          SET "reactCount" = $1
          WHERE "id" = $2
          `,
          [reactCount, commentId],
        );
      }
    }

    console.log(
      '✅ Sport-related posts, comments, and reactions seeding completed successfully!',
    );
    await dataSource.destroy();
    return true;
  } catch (error) {
    console.error('❌ Error seeding sport-related content:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    return false;
  }
}

// Execute the seed function when the script is run directly
if (require.main === module) {
  seedPosts()
    .then(() => {
      console.log('🎉 Sport content seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Sport content seeding process failed:', error);
      process.exit(1);
    });
}

export default seedPosts;
