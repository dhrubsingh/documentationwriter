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

const DOCUMENTATION_PROMPT = `Generate a comprehensive README.md for the GitHub repository following this exact structure:

1. Start with the exact repository name as the main title

2. Project Overview Section:
   - Write 2-3 detailed sentences explaining what the project does
   - Include its purpose, main functionality, and target users

3. Technical Architecture Section:
   - Write 1-2 sentences describing the overall technical structure
   - Explain how the main components interact
   - Mention key technologies or frameworks used

4. File Documentation Section:
   For each main code file in the repository:
   - List the filename as a subheading
   - Write 1-2 specific sentences describing what the file does and its role

5. Installation & Usage Section:
   - List exact commands needed to install and run the project
   - Include any necessary configuration steps
   - Show a brief example of the most common usage

6. Requirements Section:
   - List all dependencies and their minimum versions
   - Include any system requirements
   - Mention any external services needed

7. License Section:
   - State the project's license

Rules:
- Be specific to the actual repository content
- Avoid placeholder text or generic descriptions
- Include technical details where relevant
- Focus on how the components work together
- Use clear, direct language`;

app.post('/api/generate-docs', async (req, res) => {
    try {
        const { repoContent, repoName, owner } = req.body;
        
        if (!repoContent) {
            return res.status(400).json({ 
                error: 'Repository content is required' 
            });
        }

        // Create the context prompt without relying on files array
        const contextPrompt = `
Repository: ${owner ? `${owner}/` : ''}${repoName || 'Unknown Repository'}

Repository Content:
${repoContent}`;

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert software documentation writer who specializes in creating detailed, accurate, and practical documentation. You analyze code thoroughly and explain technical concepts clearly while maintaining accuracy and specificity to the actual codebase."
                },
                {
                    role: "user",
                    content: `${DOCUMENTATION_PROMPT}\n\nRepository Details:\n${contextPrompt}`
                }
            ],
            model: "deepseek-chat",
            temperature: 0.1,
            max_tokens: 1000
        });

        const documentation = completion.choices[0].message.content
            .replace(/```md|```markdown|```/g, '')
            .trim();

        res.json({ documentation });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Failed to generate documentation', 
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});