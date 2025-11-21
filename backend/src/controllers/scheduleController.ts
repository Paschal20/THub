import express, { Response, Request } from "express";
import mongoose from "mongoose";
import { ScheduleModel, ISchedule, IDaySchedule } from "../models/Schedule";
import { IUser } from "../models/userModel";

interface AuthRequest extends Request {
  user?: IUser;
}

export const createSchedule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    // Check if user already has a schedule
    const existingSchedule = await ScheduleModel.findOne({ userId });
    if (existingSchedule) {
      res
        .status(409)
        .json({ message: "Schedule already exists for this user" });
      return;
    }

    const { days } = req.body;
    if (!days || !Array.isArray(days)) {
      res.status(400).json({ message: "Days array is required" });
      return;
    }

    const newSchedule = await ScheduleModel.create({ userId, days });

    res
      .status(201)
      .json({ message: "Schedule created successfully", data: newSchedule });
  } catch (err: any) {
    res.status(500).json({ message: "An error occurred", err: err.message });
  }
};

export const getSchedule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    let schedule = await ScheduleModel.findOne({ userId });
    if (!schedule) {
      // Create default schedule if none exists
      const defaultDays: IDaySchedule[] = [
        { id: 1, name: "Mon", entries: [], isExpanded: false },
        { id: 2, name: "Tue", entries: [], isExpanded: false },
        { id: 3, name: "Wed", entries: [], isExpanded: false },
        { id: 4, name: "Thu", entries: [], isExpanded: false },
        { id: 5, name: "Fri", entries: [], isExpanded: false },
        { id: 6, name: "Sat", entries: [], isExpanded: false },
      ];
      schedule = await ScheduleModel.create({ userId, days: defaultDays });
    }

    res
      .status(200)
      .json({ message: "Schedule retrieved successfully", data: schedule });
  } catch (err: any) {
    res.status(500).json({ message: "An error occurred", err: err.message });
  }
};

export const updateSchedule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const { days } = req.body;
    if (!days || !Array.isArray(days)) {
      res.status(400).json({ message: "Days array is required" });
      return;
    }

    const updatedSchedule = await ScheduleModel.findOneAndUpdate(
      { userId },
      { days },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: "Schedule updated successfully",
      data: updatedSchedule,
    });
  } catch (err: any) {
    res.status(500).json({ message: "An error occurred", err: err.message });
  }
};

export const deleteSchedule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const deletedSchedule = await ScheduleModel.findOneAndDelete({ userId });

    if (!deletedSchedule) {
      res.status(404).json({ message: "Schedule not found" });
      return;
    }

    res.status(200).json({
      message: "Schedule deleted successfully",
      data: deletedSchedule,
    });
  } catch (err: any) {
    res.status(500).json({ message: "An error occurred", err: err.message });
  }
};
