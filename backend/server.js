// server.js
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com/v1',
    apiKey: process.env.DEEPSEEK_API_KEY,
});

const DOCUMENTATION_PROMPT = `Generate a single, concise README.md for the entire project. The README must:

1. Start with project name and a 1-2 sentence description of what it does
2. Use these exact sections in order:
   - Installation (just the commands)
   - Usage (one primary example of the most important functionality)
   - Features (maximum 4 bullet points)
   - Structure (1-2 sentences each for main files, max 4 files)
   - Requirements
   - License (one line)

Rules:
- Maximum 30 lines total
- No badges or tables
- No separate sections for individual files
- Only show code examples for the main functionality
- Each file description should be 1-2 sentences max
- Focus on the project as a whole, not implementation details`;

app.post('/api/generate-docs', async (req, res) => {
    try {
        const { codeContent } = req.body;
        
        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert at writing minimal, focused documentation. You avoid repetition and focus on the project as a unified whole."
                },
                {
                    role: "user",
                    content: `${DOCUMENTATION_PROMPT}\n\nHere's the code to document: ${codeContent}`
                }
            ],
            model: "deepseek-chat",
            temperature: 0.2,  // Even lower temperature for more consistent output
            max_tokens: 400    // Further reduced token limit
        });

        res.json({ documentation: completion.choices[0].message.content });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate documentation', details: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});