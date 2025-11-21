import { Request, Response } from "express";
import { userModel, IUser } from "../models/userModel";
import { School } from "../models/School";

// Type for user with populated school
interface IUserWithSchool extends Omit<IUser, "school"> {
  school?: {
    _id: string;
    name: string;
  } | null;
}

export const getSchoolLeaderboard = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    const topStudents = await userModel
      .find({ school: schoolId })
      .select("fullName email totalScore completedQuizzes")
      .sort({ totalScore: -1 })
      .limit(limit);

    const leaderboard = topStudents.map((student, index) => ({
      rank: index + 1,
      userId: student._id,
      fullName: student.fullName,
      email: student.email,
      totalScore: student.totalScore,
      quizzesTaken: student.completedQuizzes.length,
    }));

    res.json({
      message: "School leaderboard fetched successfully",
      school: {
        id: school._id,
        name: school.name,
        studentCount: school.studentCount,
      },
      leaderboard,
    });
  } catch (err: any) {
    res.status(500).json({ message: "An error occurred", error: err.message });
  }
};

export const getGlobalLeaderboard = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const topStudents = await userModel
      .find()
      .select("fullName email totalScore completedQuizzes school")
      .populate("school", "name")
      .sort({ totalScore: -1 })
      .limit(limit);

    const leaderboard = topStudents.map((student, index) => ({
      rank: index + 1,
      userId: student._id,
      fullName: student.fullName,
      email: student.email,
      totalScore: student.totalScore,
      quizzesTaken: student.completedQuizzes.length,
      school: (student as any).school
        ? (student as any).school.name
        : "No School",
    }));

    res.json({
      message: "Global leaderboard fetched successfully",
      leaderboard,
    });
  } catch (err: any) {
    res.status(500).json({ message: "An error occurred", error: err.message });
  }
};

export const getSchoolRankings = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    // Aggregate to calculate average score per school
    const schoolRankings = await userModel.aggregate([
      {
        $match: { school: { $exists: true, $ne: null } },
      },
      {
        $group: {
          _id: "$school",
          totalStudents: { $sum: 1 },
          totalScore: { $sum: "$totalScore" },
          averageScore: { $avg: "$totalScore" },
          totalQuizzes: { $sum: { $size: "$completedQuizzes" } },
        },
      },
      {
        $lookup: {
          from: "schools",
          localField: "_id",
          foreignField: "_id",
          as: "schoolInfo",
        },
      },
      {
        $unwind: "$schoolInfo",
      },
      {
        $project: {
          schoolId: "$_id",
          schoolName: "$schoolInfo.name",
          totalStudents: 1,
          totalScore: 1,
          averageScore: { $round: ["$averageScore", 2] },
          totalQuizzes: 1,
        },
      },
      {
        $sort: { averageScore: -1 },
      },
      {
        $limit: limit,
      },
    ]);

    const rankings = schoolRankings.map((school, index) => ({
      rank: index + 1,
      schoolId: school.schoolId,
      schoolName: school.schoolName,
      totalStudents: school.totalStudents,
      totalScore: school.totalScore,
      averageScore: school.averageScore,
      totalQuizzes: school.totalQuizzes,
    }));

    res.json({
      message: "School rankings fetched successfully",
      rankings,
    });
  } catch (err: any) {
    res.status(500).json({ message: "An error occurred", error: err.message });
  }
};

export const getUserRanking = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await userModel.findById(userId).populate("school", "name");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get global rank
    const globalRank =
      (await userModel.countDocuments({
        totalScore: { $gt: user.totalScore },
      })) + 1;

    const totalUsers = await userModel.countDocuments();

    // Get school rank (if user has a school)
    let schoolRank = null;
    let totalSchoolStudents = null;
    if (user.school) {
      schoolRank =
        (await userModel.countDocuments({
          school: user.school,
          totalScore: { $gt: user.totalScore },
        })) + 1;

      totalSchoolStudents = await userModel.countDocuments({
        school: user.school,
      });
    }

    res.json({
      message: "User ranking fetched successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        totalScore: user.totalScore,
        quizzesTaken: user.completedQuizzes.length,
        school: user.school ? (user as any).school.name : null,
      },
      globalRanking: {
        rank: globalRank,
        totalUsers: totalUsers,
        percentile:
          ((1 - (globalRank - 1) / totalUsers) * 100).toFixed(2) + "%",
      },
      schoolRanking: user.school
        ? {
            rank: schoolRank,
            totalStudents: totalSchoolStudents,
            percentile:
              ((1 - (schoolRank! - 1) / totalSchoolStudents!) * 100).toFixed(
                2
              ) + "%",
          }
        : null,
    });
  } catch (err: any) {
    res.status(500).json({ message: "An error occurred", error: err.message });
  }
};

export const getSubjectLeaderboard = async (req: Request, res: Response) => {
  try {
    const { subject } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    // Get users who have taken quizzes in this subject
    const users = await userModel
      .find({
        "completedQuizzes.subject": subject,
      })
      .select("fullName email totalScore completedQuizzes school")
      .populate("school", "name");

    // Calculate subject-specific scores
    const subjectScores = users.map((user) => {
      const subjectQuizzes = user.completedQuizzes.filter(
        (q) => q.subject === subject
      );
      const subjectScore = subjectQuizzes.reduce(
        (sum, quiz) => sum + quiz.score,
        0
      );
      const correctAnswers = subjectQuizzes.reduce(
        (sum, quiz) => sum + quiz.correctAnswers,
        0
      );
      const totalQuestions = subjectQuizzes.reduce(
        (sum, quiz) => sum + quiz.totalQuestions,
        0
      );

      return {
        userId: user._id,
        fullName: user.fullName,
        email: user.email,
        school: (user as any).school ? (user as any).school.name : "No School",
        subjectScore,
        quizzesTaken: subjectQuizzes.length,
        correctAnswers,
        totalQuestions,
        accuracy:
          totalQuestions > 0
            ? ((correctAnswers / totalQuestions) * 100).toFixed(2) + "%"
            : "0%",
      };
    });

    // Sort by subject score
    subjectScores.sort((a, b) => b.subjectScore - a.subjectScore);

    const leaderboard = subjectScores.slice(0, limit).map((student, index) => ({
      rank: index + 1,
      ...student,
    }));

    res.json({
      message: "Subject leaderboard fetched successfully",
      subject,
      leaderboard,
    });
  } catch (err: any) {
    res.status(500).json({ message: "An error occurred", error: err.message });
  }
};
