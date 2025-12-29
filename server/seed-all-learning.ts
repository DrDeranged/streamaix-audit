import { seedExpandedLearningContent } from "./seed-learning-content";
import { seedPredictionAndMacroLessons } from "./seed-learning-content-part2";
import { seedLearningQuizzes } from "./seed-learning-quizzes";
import { db } from "./db";
import { learningModules } from "../shared/schema";
import { eq } from "drizzle-orm";

async function updateModuleStats() {
  console.log("Updating module statistics...");
  
  const moduleUpdates = [
    { id: "mod-web3-basics", lessonCount: 5, estimatedMinutes: 59, xpReward: 475 },
    { id: "mod-defi-intro", lessonCount: 5, estimatedMinutes: 81, xpReward: 625 },
    { id: "mod-ai-trading", lessonCount: 5, estimatedMinutes: 86, xpReward: 700 },
    { id: "mod-prediction-markets", lessonCount: 5, estimatedMinutes: 81, xpReward: 625 },
    { id: "mod-macro-economics", lessonCount: 4, estimatedMinutes: 69, xpReward: 475 },
    { id: "mod-tech-stocks", lessonCount: 4, estimatedMinutes: 66, xpReward: 450 },
  ];
  
  for (const update of moduleUpdates) {
    try {
      await db.update(learningModules)
        .set({
          lessonCount: update.lessonCount,
          estimatedMinutes: update.estimatedMinutes,
          xpReward: update.xpReward
        })
        .where(eq(learningModules.id, update.id));
      console.log(`Updated module stats: ${update.id}`);
    } catch (error) {
      console.error(`Error updating module ${update.id}:`, error);
    }
  }
}

async function seedAllLearning() {
  console.log("===========================================");
  console.log("STARTING COMPLETE LEARNING CONTENT SEED");
  console.log("===========================================");
  
  try {
    console.log("\n--- Seeding Web3, DeFi, AI Trading Lessons ---");
    await seedExpandedLearningContent();
    
    console.log("\n--- Seeding Prediction Markets, Macro, Tech Lessons ---");
    await seedPredictionAndMacroLessons();
    
    console.log("\n--- Seeding All Quizzes ---");
    await seedLearningQuizzes();
    
    console.log("\n--- Updating Module Statistics ---");
    await updateModuleStats();
    
    console.log("\n===========================================");
    console.log("COMPLETE LEARNING CONTENT SEED FINISHED!");
    console.log("===========================================");
    console.log("Summary:");
    console.log("- 28 comprehensive lessons across 6 modules");
    console.log("- 60+ quizzes with multiple choice questions");
    console.log("- 3,350+ XP available to earn");
    console.log("===========================================");
  } catch (error) {
    console.error("Error during seeding:", error);
    throw error;
  }
}

seedAllLearning()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
