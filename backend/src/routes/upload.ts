import express from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import Conversation from "../models/Conversation";

const router = express.Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/tmp/uploads";
const MAX_SIZE = process.env.MAX_ATTACHMENT_SIZE_BYTES
  ? parseInt(process.env.MAX_ATTACHMENT_SIZE_BYTES)
  : 50 * 1024 * 1024;

// Ensure upload directory exists (only in local development)
try {
  if (require.main === module && !require("fs").existsSync(UPLOAD_DIR)) {
    require("fs").mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch (err: unknown) {
  // Explicitly type the error
  const error = err instanceof Error ? err : new Error(String(err));
  console.warn(
    "Failed to create upload directory, using memory storage:",
    error.message
  );
  // Fallback to memory storage if disk storage fails (e.g., in serverless environments)
  const memoryStorage = multer.memoryStorage();
  const upload = multer({
    storage: memoryStorage,
    limits: { fileSize: MAX_SIZE },
  });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`),
});

const upload = multer({ storage, limits: { fileSize: MAX_SIZE } });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "file required" });
    const file = req.file;
    const fileUrl = `${req.protocol}://${req.get(
      "host"
    )}/uploads/${path.basename(file.path)}`;

    const conversationId = req.body.conversationId;
    if (conversationId) {
      const conv = await Conversation.findById(conversationId);
      if (conv) {
        conv.messages.push({
          role: "user",
          text: `Uploaded file: ${file.originalname}`,
          timestamp: new Date(),
          attachments: [
            {
              filename: file.originalname,
              url: fileUrl,
              mimetype: file.mimetype,
              size: file.size,
            },
          ],
        } as any);
        await conv.save();
      }
    }

    res.json({
      filename: file.originalname,
      storedAs: path.basename(file.path),
      size: file.size,
      mimetype: file.mimetype,
      url: fileUrl,
    });
  } catch (err: unknown) {
    console.error(err);
    const error = err instanceof Error ? err : new Error(String(err));
    res.status(500).json({ error: "upload_failed", detail: error.message });
  }
});

export default router;
