import * as cron from "node-cron";
import { Reminder } from "../models/ReminderModel";
import { notificationService } from "./notificationService";
import databaseOptimizationService from "./databaseOptimizationService";
import dotenv from "dotenv";
dotenv.config();

class SchedulerService {
  private isRunning: boolean = false;

  startScheduler(): void {
    if (this.isRunning) {
      return;
    }

    // Run every minute to check for reminders
    cron.schedule("* * * * *", async () => {
      try {
        await this.checkAndSendReminders();
      } catch (error) {
        console.error("Error in reminder scheduler:", error);
      }
    });

    // Run database maintenance daily at 2 AM
    cron.schedule("0 2 * * *", async () => {
      try {
        console.log("🛠️ Starting scheduled database maintenance...");
        await databaseOptimizationService.performMaintenance();
        console.log("✅ Scheduled database maintenance completed");
      } catch (error) {
        console.error("❌ Error in scheduled database maintenance:", error);
      }
    });

    // Clear expired cache entries every 30 minutes
    cron.schedule("*/30 * * * *", async () => {
      try {
        // The cache service handles TTL automatically, but we can log cache stats
        const cacheStats = databaseOptimizationService.getCacheStats();
        if (cacheStats.size > 0) {
          console.log(`📊 Cache status: ${cacheStats.size} entries`);
        }
      } catch (error) {
        console.error("Error checking cache stats:", error);
      }
    });

    this.isRunning = true;
  }

  stopScheduler(): void {
    // Note: node-cron doesn't provide a direct way to stop all jobs
    // In a production app, you'd want to store job references and destroy them
    this.isRunning = false;
  }

  private async checkAndSendReminders(): Promise<void> {
    try {
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes ahead

      // Find reminders that are due within the next 5 minutes and haven't been notified yet
      const upcomingReminders = await Reminder.find({
        datetime: {
          $gte: now.toISOString(),
          $lte: fiveMinutesFromNow.toISOString(),
        },
        notified: { $ne: true },
      }).populate("userId");

      if (upcomingReminders.length === 0) {
        return;
      }

      for (const reminder of upcomingReminders) {
        try {
          await notificationService.sendReminderNotification(
            reminder.userId.toString(),
            reminder.title,
            reminder.datetime
          );

          // Mark as notified
          reminder.notified = true;
          await reminder.save();
        } catch (error) {
          console.error(
            `❌ Failed to send notification for reminder "${reminder.title}":`,
            error
          );
        }
      }
    } catch (error) {
      console.error("Error checking reminders:", error);
    }
  }

  // Method to manually trigger reminder check (useful for testing)
  async triggerManualCheck(): Promise<void> {
    await this.checkAndSendReminders();
  }

  // Method to reset all notifications (useful for testing)
  async resetAllNotifications(): Promise<void> {
    try {
      const result = await Reminder.updateMany(
        { notified: true },
        { $unset: { notified: 1 } }
      );

    } catch (error) {
      console.error("Error resetting notifications:", error);
    }
  }
}

export const schedulerService = new SchedulerService();
