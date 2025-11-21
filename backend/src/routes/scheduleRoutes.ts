import express, { Router } from "express";
import { createSchedule, getSchedule, updateSchedule, deleteSchedule } from "../controllers/scheduleController";
import { protect } from "../middleware/authMiddleware";

export const scheduleRouter: Router = express.Router();

scheduleRouter.post("/createschedule", protect, createSchedule);
scheduleRouter.get("/schedule", protect, getSchedule);
scheduleRouter.put("/schedule", protect, updateSchedule);
scheduleRouter.delete("/schedule", protect, deleteSchedule);
