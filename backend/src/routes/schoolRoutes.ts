import express, { Router } from "express";
import { searchSchools, createOrGetSchool, getAllSchools } from "../controllers/schoolController";

const schoolRouter: Router = express.Router();

// Public routes
schoolRouter.get("/search", searchSchools);
schoolRouter.post("/create", createOrGetSchool);
schoolRouter.get("/all", getAllSchools);

export default schoolRouter;