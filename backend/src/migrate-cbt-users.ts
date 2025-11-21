// DANGER FLAG - Uncomment this line to enable migration
// SAFETY CHECK - Uncomment the line below to enable migration
// const ENABLE_MIGRATION = true;

const ENABLE_MIGRATION = true; // Set to true to enable migration

if (!ENABLE_MIGRATION) {
  console.log('🚫 MIGRATION DISABLED FOR SAFETY');
  console.log('To enable migration:');
  console.log('1. Uncomment the ENABLE_MIGRATION line');
  console.log('2. Ensure you have database backups');
  console.log('3. Run: npm run migrate-cbt');
  process.exit(0);
}

import mongoose from 'mongoose';
import { userModel } from './models/userModel';
import { School } from './models/School';
import { Kode10xQuestion } from './models/Kode10xQuestion';
import { Kode10xQuizAttempt } from './models/Kode10xQuizAttempt';
import Quiz from './models/Quiz';
import QuizResult from './models/QuizResult';
import config from './config';

interface MigrationStats {
  schoolsMigrated: number;
  schoolsSkipped: number;
  questionsMigrated: number;
  questionsSkipped: number;
  attemptsMigrated: number;
  attemptsSkipped: number;
  usersUpdated: number;
  errors: string[];
}

async function connectToDatabases() {
  try {
    // Connect to main TimelyHub database
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to TimelyHub database');

    // If there's a separate Kode10x database, connect to it too
    const kode10xUri = process.env.KODE10X_MONGO_URL;
    if (kode10xUri && kode10xUri !== config.mongoUri) {
      // For separate databases, we'd need to create a separate connection
      // For now, assuming everything is in the same database
      console.log('ℹ️  Using same database for Kode10x data');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

async function migrateSchools(): Promise<{ migrated: number; skipped: number }> {
  console.log('\n🏫 Migrating Schools...');

  const stats = { migrated: 0, skipped: 0 };

  try {
    // Get all unique school names from users
    const usersWithSchools = await userModel.find({ school: { $exists: true, $ne: null } }).select('school');
    const schoolNames: string[] = [];
    for (const user of usersWithSchools) {
      if (user.school && typeof user.school === 'string') {
        schoolNames.push(user.school);
      }
    }
    const uniqueSchoolNames = [...new Set(schoolNames)];

    console.log(`Found ${schoolNames.length} schools to migrate`);

    for (const schoolName of uniqueSchoolNames) {
      if (!schoolName) continue;

      try {
        // Check if school already exists
        const existingSchool = await School.findOne({
          $or: [
            { name: schoolName },
            { normalizedName: schoolName.toLowerCase().trim().replace(/\s+/g, ' ') }
          ]
        });

        if (existingSchool) {
          console.log(`⏭️  School "${schoolName}" already exists, skipping`);
          stats.skipped++;
          continue;
        }

        // Create new school
        const newSchool = new School({
          name: schoolName,
          studentCount: await userModel.countDocuments({ school: schoolName })
        });

        await newSchool.save();
        console.log(`✅ Migrated school: ${schoolName}`);
        stats.migrated++;

      } catch (error) {
        console.error(`❌ Error migrating school "${schoolName}":`, error);
        stats.skipped++;
      }
    }

  } catch (error) {
    console.error('❌ Error in school migration:', error);
  }

  return stats;
}

async function migrateQuestions(): Promise<{ migrated: number; skipped: number }> {
  console.log('\n❓ Migrating Questions...');

  const stats = { migrated: 0, skipped: 0 };

  try {
    const questions = await Kode10xQuestion.find({});
    console.log(`Found ${questions.length} questions to migrate`);

    for (const kode10xQuestion of questions) {
      try {
        // Check if question already exists (by text and subject)
        const existingQuiz = await Quiz.findOne({
          'questions.question': kode10xQuestion.questionText,
          topic: kode10xQuestion.subject || 'General'
        });

        if (existingQuiz) {
          console.log(`⏭️  Question "${kode10xQuestion.questionText.substring(0, 50)}..." already exists, skipping`);
          stats.skipped++;
          continue;
        }

        // Convert Kode10x question to Quiz format
        const questionOptions: { [key: string]: string } = {};
        kode10xQuestion.options.forEach((option, index) => {
          const letter = String.fromCharCode(65 + index); // A, B, C, D...
          questionOptions[letter] = option;
        });

        // Find the correct answer letter
        const correctAnswerLetter = Object.keys(questionOptions).find(
          key => questionOptions[key] === kode10xQuestion.correctAnswer
        );

        if (!correctAnswerLetter) {
          console.log(`⚠️  Could not find correct answer for question: ${kode10xQuestion.questionText.substring(0, 50)}...`);
          stats.skipped++;
          continue;
        }

        const quizQuestion = {
          _id: new mongoose.Types.ObjectId().toString(),
          question: kode10xQuestion.questionText,
          options: questionOptions,
          answer: correctAnswerLetter,
          explanation: `Correct answer: ${kode10xQuestion.correctAnswer}`,
          type: 'multiple-choice' as const,
          difficulty: 'medium' as const,
          points: 1,
          tags: [kode10xQuestion.subject || 'general']
        };

        // Create a quiz document for this question
        const newQuiz = new Quiz({
          title: `${kode10xQuestion.subject || 'General'} Quiz Question`,
          topic: kode10xQuestion.subject || 'General',
          source: 'CBT Migration',
          difficulty: 'medium',
          numQuestions: 1,
          questions: [quizQuestion],
          userId: 'system', // System-generated
          tags: [kode10xQuestion.subject || 'general'],
          category: kode10xQuestion.subject || 'General',
          isPublic: false,
          isTemplate: false,
          estimatedTime: 2, // 2 minutes per question
          language: 'en',
          status: 'published'
        });

        await newQuiz.save();
        console.log(`✅ Migrated question: ${kode10xQuestion.questionText.substring(0, 50)}...`);
        stats.migrated++;

      } catch (error) {
        console.error(`❌ Error migrating question:`, error);
        stats.skipped++;
      }
    }

  } catch (error) {
    console.error('❌ Error in question migration:', error);
  }

  return stats;
}

async function migrateQuizAttempts(): Promise<{ migrated: number; skipped: number }> {
  console.log('\n📊 Migrating Quiz Attempts...');

  const stats = { migrated: 0, skipped: 0 };

  try {
    const attempts = await Kode10xQuizAttempt.find({});
    console.log(`Found ${attempts.length} quiz attempts to migrate`);

    for (const attempt of attempts) {
      try {
        // Check if attempt already exists
        const existingResult = await QuizResult.findOne({
          userId: attempt.userId.toString(),
          'selectedAnswers': { $exists: true }
        });

        if (existingResult) {
          console.log(`⏭️  Attempt for user ${attempt.userId} already exists, skipping`);
          stats.skipped++;
          continue;
        }

        // Find the corresponding quiz (created from the question)
        const question = await Kode10xQuestion.findById(attempt.questionId);
        if (!question) {
          console.log(`⚠️  Question ${attempt.questionId} not found, skipping attempt`);
          stats.skipped++;
          continue;
        }

        const quiz = await Quiz.findOne({
          'questions.question': question.questionText,
          topic: question.subject || 'General'
        });

        if (!quiz) {
          console.log(`⚠️  Quiz not found for question ${attempt.questionId}, skipping attempt`);
          stats.skipped++;
          continue;
        }

        // Create quiz result
        const selectedAnswers = new Map();
        if (quiz.questions && quiz.questions.length > 0 && quiz.questions[0]) {
          selectedAnswers.set(quiz.questions[0]._id, attempt.userAnswer || '');
        }

        const isCorrect = attempt.isCorrect;
        const totalQuestions = 1;
        const score = isCorrect ? 1 : 0;

        const quizResult = new QuizResult({
          userId: attempt.userId.toString(),
          quizId: quiz._id.toString(),
          score: score,
          totalQuestions: totalQuestions,
          selectedAnswers: selectedAnswers,
          timeTaken: 60, // Default 1 minute
          status: 'completed',
          completedAt: attempt.answeredAt || new Date(),
          difficulty: 'medium',
          questionTypes: ['multiple-choice'],
          analytics: {
            accuracy: (score / totalQuestions) * 100,
            averageTimePerQuestion: 60,
            difficultyBreakdown: {
              easy: { correct: 0, total: 0 },
              medium: { correct: isCorrect ? 1 : 0, total: 1 },
              hard: { correct: 0, total: 0 }
            },
            questionTypeBreakdown: {
              'multiple-choice': { correct: isCorrect ? 1 : 0, total: 1 },
              'true-false': { correct: 0, total: 0 },
              'fill-in-the-blank': { correct: 0, total: 0 }
            },
            timeDistribution: new Map([['question_1', 60]]),
            streak: {
              longest: isCorrect ? 1 : 0,
              current: isCorrect ? 1 : 0,
              breakdown: isCorrect ? [1] : [0]
            }
          },
          version: 1
        });

        await quizResult.save();
        console.log(`✅ Migrated quiz attempt for user ${attempt.userId}`);
        stats.migrated++;

      } catch (error) {
        console.error(`❌ Error migrating quiz attempt:`, error);
        stats.skipped++;
      }
    }

  } catch (error) {
    console.error('❌ Error in quiz attempt migration:', error);
  }

  return stats;
}

async function updateUserReferences(): Promise<number> {
  console.log('\n👤 Updating User References...');

  let updatedCount = 0;

  try {
    // Update user school references to use ObjectId instead of string
    const usersWithSchools = await userModel.find({
      school: { $exists: true, $ne: null }
    });

    console.log(`Found ${usersWithSchools.length} users with school references to update`);

    for (const user of usersWithSchools) {
      try {
        const schoolValue = user.school;
        if (schoolValue && typeof schoolValue === 'string') {
          const schoolString = schoolValue as string;
          const normalizedName = schoolString.toLowerCase().trim().replace(/\s+/g, ' ');
          const school = await School.findOne({
            $or: [
              { name: schoolString },
              { normalizedName: normalizedName }
            ]
          });

          if (school) {
            await userModel.findByIdAndUpdate(user._id, { school: school._id });
            console.log(`✅ Updated school reference for user ${user.email}`);
            updatedCount++;
          }
        }
      } catch (error) {
        console.error(`❌ Error updating user ${user.email}:`, error);
      }
    }

  } catch (error) {
    console.error('❌ Error updating user references:', error);
  }

  return updatedCount;
}

async function runMigration(): Promise<void> {
  console.log('🚀 Starting CBT to TimelyHub Migration...');
  console.log('⚠️  Make sure you have database backups before proceeding!');

  const stats: MigrationStats = {
    schoolsMigrated: 0,
    schoolsSkipped: 0,
    questionsMigrated: 0,
    questionsSkipped: 0,
    attemptsMigrated: 0,
    attemptsSkipped: 0,
    usersUpdated: 0,
    errors: []
  };

  try {
    // Connect to databases
    await connectToDatabases();

    // Run migrations
    const schoolStats = await migrateSchools();
    stats.schoolsMigrated = schoolStats.migrated;
    stats.schoolsSkipped = schoolStats.skipped;

    const questionStats = await migrateQuestions();
    stats.questionsMigrated = questionStats.migrated;
    stats.questionsSkipped = questionStats.skipped;

    const attemptStats = await migrateQuizAttempts();
    stats.attemptsMigrated = attemptStats.migrated;
    stats.attemptsSkipped = attemptStats.skipped;

    stats.usersUpdated = await updateUserReferences();

    // Print final report
    console.log('\n📊 Migration Complete!');
    console.log('========================');
    console.log(`🏫 Schools: ${stats.schoolsMigrated} migrated, ${stats.schoolsSkipped} skipped`);
    console.log(`❓ Questions: ${stats.questionsMigrated} migrated, ${stats.questionsSkipped} skipped`);
    console.log(`📊 Quiz Attempts: ${stats.attemptsMigrated} migrated, ${stats.attemptsSkipped} skipped`);
    console.log(`👤 Users Updated: ${stats.usersUpdated}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      stats.errors.forEach(error => console.log(`   - ${error}`));
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('Next steps:');
    console.log('1. Test user login and quiz functionality');
    console.log('2. Verify school affiliations are correct');
    console.log('3. Check leaderboard data');
    console.log('4. Remove KODE10X_MONGO_URL from environment variables');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    stats.errors.push(error instanceof Error ? error.message : String(error));
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

// Run the migration
runMigration().catch(console.error);