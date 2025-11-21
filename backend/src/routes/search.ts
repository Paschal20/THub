import express from "express";
import { webSearch } from "../services/websearch";

const router = express.Router();

router.get("/", async (req, res) => {
  const q = (req.query.q as string) || "";
  if (!q) return res.status(400).json({ error: "q query param required" });
  const count = req.query.count ? parseInt(req.query.count as string) : 5;
  try {
    const results = await webSearch(q, count);
    res.json({ query: q, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "search_failed", detail: (err as Error).message });
  }
});

export default router;
