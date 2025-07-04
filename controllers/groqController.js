import asyncHandler from 'express-async-handler';
import { callGroqAPI } from '../services/index.js';

export const createTask = asyncHandler(async (req, res) => {
  const { diff, engineConfig = {} } = req.body;
  
  if (!diff || typeof diff !== 'string') {
    return res.status(400).json({ 
      error: 'Invalid input',
      message: 'diff field is required and must be a string'
    });
  }

  if (diff.length > 100000) { // 100KB limit
    return res.status(400).json({
      error: 'Diff too large',
      message: 'Diff must be less than 100KB'
    });
  }

  try {
    const result = await callGroqAPI(diff, {
      ...engineConfig,
      commitMode: false
    });
    
    res.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        model: engineConfig.model || 'llama-3.3-70b-versatile',
        type: 'task'
      }
    });
  } catch (error) {
    console.error('Task creation error:', error);
    
    // Handle specific Groq API errors
    if (error.message.includes('429')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Community API is temporarily rate limited. Please try again in a few minutes.',
        retryAfter: 60
      });
    }
    
    res.status(500).json({
      error: 'Failed to create task',
      message: error.message
    });
  }
});

export const createCommit = asyncHandler(async (req, res) => {
  const { diff, engineConfig = {} } = req.body;

  if (!diff || typeof diff !== 'string') {
    return res.status(400).json({
      error: 'Invalid input',
      message: 'diff field is required and must be a string'
    });
  }

  if (diff.length > 50000) {
    return res.status(400).json({
      error: 'Diff too large',
      message: 'Diff must be less than 50KB for commit generation'
    });
  }

  try {
    const result = await callGroqAPI(diff, {
      ...engineConfig,
      commitMode: true
    });

    let commitMessage = result.message || result.commit || 'chore: update code';
    
    // Clean up engine-related scopes from commit messages
    commitMessage = commitMessage
      .replace(/\((.*[Ee]ngine.*)\)/, '') // Remove scopes containing "engine"
      .replace(/\((auto|freetier|groq|openai)\)/, '') // Remove specific engine names
      .replace(/:\s+/, ': ') // Clean up extra spaces
      .trim();

    res.json({
      success: true,
      // Put commit message at top level for easy access
      commit: commitMessage,
      message: commitMessage,
      data: {
        ...result,
        commit: commitMessage,
        message: commitMessage
      },
      meta: {
        timestamp: new Date().toISOString(),
        model: engineConfig.model || 'llama-3.3-70b-versatile',
        type: 'commit'
      }
    });
  } catch (error) {
    console.error('Commit creation error:', error);
    
    if (error.message.includes('429')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Community API is temporarily rate limited. Please try again in a few minutes.',
        retryAfter: 60
      });
    }
    
    res.status(500).json({
      error: 'Failed to create commit',
      message: error.message
    });
  }
});

export const getStats = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      limits: {
        daily: 10,
        monthly: 100
      },
      endpoints: {
        '/api/grok/task': 'Generate task descriptions from git diff',
        '/api/grok/commit': 'Generate commit messages from git diff'
      },
      models: ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile'],
      version: '1.0.0'
    }
  });
});