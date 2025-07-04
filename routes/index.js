import express from "express";
import { createCommit, createTask, getStats } from "../controllers/groqController.js";

const router = express.Router();

router.post('/grok/task', createTask);

router.post('/grok/commit', createCommit);

router.get('/grok/stats', getStats);

export default router;
