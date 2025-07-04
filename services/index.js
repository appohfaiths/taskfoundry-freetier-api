import fetch from 'node-fetch';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateCommitMessage(diff, engineConfig = {}) {
  const COMMUNITY_GROQ_KEY = process.env.TASKFOUNDRY_COMMUNITY_KEY;

  if (!COMMUNITY_GROQ_KEY) {
    throw new Error('Free tier temporarily unavailable. Community key not configured.');
  }

  const model = engineConfig.model || "llama-3.3-70b-versatile";

  const commitPrompt = `Analyze this git diff and generate a concise, conventional commit message.

Follow conventional commit format:
- type(scope): description
- Types: feat, fix, docs, style, refactor, test, chore
- Keep under 72 characters
- Be specific and clear

Respond with just the commit message, nothing else.`;

  const requestBody = {
    model: model,
    messages: [
      {
        role: "user",
        content: `${commitPrompt}

Git diff:
\`\`\`
${diff}
\`\`\``,
      },
    ],
    temperature: engineConfig.temperature || 0.2,
    max_tokens: engineConfig.maxTokens || 100,
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${COMMUNITY_GROQ_KEY}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status === 429 && attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY * attempt);
          continue;
        }
        
        if (response.status === 429) {
          throw new Error("Free tier rate limit exceeded. Please try again in a moment.");
        }
        
        throw new Error(`API request failed: ${response.status} ${response.statusText}\nDetails: ${errorText}`);
      }

      const data = await response.json();
      
      // Add error checking for the response structure
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response structure from Groq API');
      }
      
      const commitMessage = data.choices[0].message.content.trim();
      
      // Clean up the commit message (remove any extra formatting)
      const cleanMessage = commitMessage.replace(/^["']|["']$/g, '').trim();

      return {
        type: 'commit',
        message: cleanMessage,
        commit: cleanMessage, // Add this field for backward compatibility
        model: model
      };
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error;
      await sleep(RETRY_DELAY * attempt);
    }
  }
  
  // If all retries failed
  throw new Error('Failed to generate commit message after maximum retries');
}

function parseTaskResponse(content) {
  const lines = content.split('\n');
  let title = '';
  let summary = '';
  let technical = '';
  let currentSection = '';

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('TITLE:')) {
      title = trimmedLine.replace('TITLE:', '').trim();
      currentSection = 'title';
    } else if (trimmedLine.startsWith('SUMMARY:')) {
      summary = trimmedLine.replace('SUMMARY:', '').trim();
      currentSection = 'summary';
    } else if (trimmedLine.startsWith('TECHNICAL:')) {
      technical = trimmedLine.replace('TECHNICAL:', '').trim();
      currentSection = 'technical';
    } else if (trimmedLine && currentSection) {
      if (currentSection === 'summary') {
        summary += (summary ? '\n' : '') + trimmedLine;
      } else if (currentSection === 'technical') {
        technical += (technical ? '\n' : '') + trimmedLine;
      }
    }
  }

  return {
    type: 'task',
    title: title || 'Task Title',
    summary: summary || 'Task summary not available',
    technical: technical || 'Technical details not available'
  };
}

export async function callGroqAPI(diff, engineConfig = {}) {
  const COMMUNITY_GROQ_KEY = process.env.TASKFOUNDRY_COMMUNITY_KEY;

  if (!COMMUNITY_GROQ_KEY) {
    throw new Error('Free tier temporarily unavailable. Community key not configured.');
  }

  const model = engineConfig.model || "llama-3.3-70b-versatile";
  const isDetailed = engineConfig.detailed || false;
  const isCommitMode = engineConfig.commitMode || false;

  if (isCommitMode) {
    return generateCommitMessage(diff, engineConfig);
  }

  const basePrompt = `Analyze this git diff and create a task description for Azure DevOps or similar tools.`;

  const concisePrompt = `${basePrompt}
Respond in exactly this format:

TITLE: [Brief summary of the change]
SUMMARY: [What was changed and why]
TECHNICAL: [Implementation notes and considerations]

Keep responses concise and focused.`;

  const detailedPrompt = `${basePrompt}
Create a comprehensive task description with detailed sections.

Respond in exactly this format:

TITLE: [Clear, actionable title]
SUMMARY: [Comprehensive summary including:
- What was changed and why
- Key functionality added/modified
- Business impact or user benefits
- Requirements or acceptance criteria
- Test coverage requirements if applicable]
TECHNICAL: [Detailed technical considerations including:
- Implementation approach and architecture decisions
- Dependencies and integrations affected
- Performance considerations
- Security considerations if applicable
- Testing strategy and recommendations
- Deployment considerations
- Potential risks and mitigation strategies
- Code quality and best practices notes]

Provide detailed, actionable information that would help a developer understand the full scope and context.`;

  const prompt = isDetailed ? detailedPrompt : concisePrompt;

  const requestBody = {
    model: model,
    messages: [
      {
        role: "user",
        content: `${prompt}

Git diff:
\`\`\`
${diff}
\`\`\``,
      },
    ],
    temperature: engineConfig.temperature || 0.3,
    max_tokens: isDetailed
      ? engineConfig.maxTokens || 2000
      : engineConfig.maxTokens || 1000,
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${COMMUNITY_GROQ_KEY}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status === 429 && attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY * attempt);
          continue;
        }
        
        if (response.status === 429) {
          throw new Error("Free tier rate limit exceeded. Please try again in a moment.");
        }
        
        throw new Error(`API request failed: ${response.status} ${response.statusText}\nDetails: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content.trim();

      const result = parseTaskResponse(content);
      result.model = model;
      
      return result;
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error;
      await sleep(RETRY_DELAY * attempt);
    }
  }
}