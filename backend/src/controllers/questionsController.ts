import { Request, Response } from "express";

// Static CBT questions for the quiz
const cbtQuestions = [
  {
    _id: "q1",
    questionText: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: "Paris",
    type: "multiple-choice",
    difficulty: "easy"
  },
  {
    _id: "q2",
    questionText: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: "Mars",
    type: "multiple-choice",
    difficulty: "easy"
  },
  {
    _id: "q3",
    questionText: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    correctAnswer: "4",
    type: "multiple-choice",
    difficulty: "easy"
  },
  {
    _id: "q4",
    questionText: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    correctAnswer: "William Shakespeare",
    type: "multiple-choice",
    difficulty: "medium"
  },
  {
    _id: "q5",
    questionText: "What is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    correctAnswer: "Pacific Ocean",
    type: "multiple-choice",
    difficulty: "medium"
  },
  {
    _id: "q6",
    questionText: "In which year did World War II end?",
    options: ["1944", "1945", "1946", "1947"],
    correctAnswer: "1945",
    type: "multiple-choice",
    difficulty: "medium"
  },
  {
    _id: "q7",
    questionText: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correctAnswer: "Au",
    type: "multiple-choice",
    difficulty: "hard"
  },
  {
    _id: "q8",
    questionText: "Which element has the atomic number 1?",
    options: ["Helium", "Hydrogen", "Lithium", "Carbon"],
    correctAnswer: "Hydrogen",
    type: "multiple-choice",
    difficulty: "hard"
  },
  {
    _id: "q9",
    questionText: "What is the square root of 144?",
    options: ["10", "11", "12", "13"],
    correctAnswer: "12",
    type: "multiple-choice",
    difficulty: "hard"
  },
  {
    _id: "q10",
    questionText: "Who painted the Mona Lisa?",
    options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
    correctAnswer: "Leonardo da Vinci",
    type: "multiple-choice",
    difficulty: "medium"
  }
];

// Get random questions for CBT quiz
export const getRandomQuestions = async (req: Request, res: Response): Promise<void> => {
  console.log("getRandomQuestions called");
  try {
    // Shuffle the questions array and take first 5
    const shuffled = [...cbtQuestions].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, 5);

    res.status(200).json({
      success: true,
      selectedQuestions
    });
  } catch (error) {
    console.error("Error fetching random questions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch questions"
    });
  }
};

// Submit quiz answers
export const submitQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, answers } = req.body;

    // Calculate score
    let correctAnswers = 0;
    const results = answers.map((answer: any) => {
      const question = cbtQuestions.find(q => q._id === answer.questionId);
      const isCorrect = question && question.correctAnswer === answer.userAnswer;

      if (isCorrect) correctAnswers++;

      return {
        questionId: answer.questionId,
        userAnswer: answer.userAnswer,
        correctAnswer: question?.correctAnswer,
        isCorrect
      };
    });

    res.status(200).json({
      success: true,
      message: "Quiz submitted successfully",
      results: {
        totalQuestions: answers.length,
        correctAnswers,
        score: correctAnswers,
        percentage: Math.round((correctAnswers / answers.length) * 100),
        details: results
      }
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit quiz"
    });
  }
};