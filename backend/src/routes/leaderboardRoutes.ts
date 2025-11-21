import express, { Router } from "express";
import {
  getSchoolLeaderboard,
  getGlobalLeaderboard,
  getSchoolRankings,
  getUserRanking,
  getSubjectLeaderboard,
} from "../controllers/leaderboardController";
import { protect } from "../middleware/authMiddleware";

const leaderboardRouter: Router = express.Router();

// Public leaderboards (anyone can view)
leaderboardRouter.get("/global", getGlobalLeaderboard);
leaderboardRouter.get("/schools", getSchoolRankings);
leaderboardRouter.get("/school/:schoolId", getSchoolLeaderboard);
leaderboardRouter.get("/subject/:subject", getSubjectLeaderboard);

// Protected routes (user must be logged in)
leaderboardRouter.get("/user/:userId", protect, getUserRanking);

export default leaderboardRouter;