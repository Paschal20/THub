import { Request, Response } from "express";
import { School } from "../models/School";

export const searchSchools = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query || (query as string).length < 2) {
      return res.json({ schools: [] });
    }

    const normalizedQuery = (query as string).toLowerCase().trim();

    // Fuzzy search using regex
    const schools = await School.find({
      normalizedName: { $regex: normalizedQuery, $options: 'i' }
    })
    .limit(5)
    .select('name studentCount')
    .sort({ studentCount: -1 }); // Popular schools first

    res.json({
      message: "Schools found",
      schools
    });
  } catch (err: any) {
    res.status(500).json({ message: "Error searching schools", error: err.message });
  }
};

export const createOrGetSchool = async (req: Request, res: Response) => {
  try {
    const { schoolName } = req.body;

    if (!schoolName || schoolName.trim().length < 2) {
      return res.status(400).json({ message: "School name is required" });
    }

    const normalizedName = schoolName.toLowerCase().trim().replace(/\s+/g, ' ');

    // Check if school exists
    let school = await School.findOne({ normalizedName });

    if (!school) {
      // Create new school
      school = await School.create({
        name: schoolName.trim(),
        normalizedName,
        studentCount: 1
      });

      return res.status(201).json({
        message: "New school created",
        school,
        isNew: true
      });
    } else {
      // School exists, increment student count
      school.studentCount += 1;
      await school.save();

      return res.json({
        message: "School found",
        school,
        isNew: false
      });
    }
  } catch (err: any) {
    res.status(500).json({ message: "Error creating school", error: err.message });
  }
};

export const getAllSchools = async (req: Request, res: Response) => {
  try {
    const schools = await School.find()
      .select('name studentCount')
      .sort({ studentCount: -1, name: 1 });

    res.json({
      message: "All schools fetched",
      count: schools.length,
      schools
    });
  } catch (err: any) {
    res.status(500).json({ message: "Error fetching schools", error: err.message });
  }
};