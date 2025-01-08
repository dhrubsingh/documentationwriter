# documentationwriter
Agentic GitHub documentation writer

## 📖 Project Overview

This project is a GitHub Documentation Generator that automatically creates comprehensive and well-structured README.md files for GitHub repositories. It analyzes repository content, including code files and configuration files, and generates documentation following best practices. The tool is designed for developers, open-source maintainers, and teams who want to maintain high-quality documentation with minimal effort.

## 🏗️ Technical Architecture

The application is built with a React frontend and an Express.js backend. The frontend handles user interaction and displays generated documentation, while the backend processes repository content and interacts with AI services for documentation generation. Key technologies include React, Express.js, TailwindCSS, and OpenAI's API for AI-powered documentation generation.

## 📁 File Documentation

### 📄 backend/server.js
This is the main backend server file that handles API requests, processes repository content, and interacts with the AI service for documentation generation. It includes endpoints for generating documentation and handling GitHub OAuth authentication.

### 📄 github-doc-generator/src/App.js
The main React application component that handles GitHub OAuth callback and renders the DocumentationGenerator component. It manages authentication state and application routing.

### 📄 github-doc-generator/src/components/DocumentationGenerator/documentationUtils.js
Contains utility functions for parsing GitHub URLs, processing repository content, and generating README files. It handles the core logic for documentation generation and formatting.

### 📄 github-doc-generator/src/config/api.js
Provides API functions for interacting with GitHub's API and the backend documentation generation service. Includes functions for fetching repository data, creating pull requests, and generating documentation.

## 🔧 Installation

To set up the project locally, follow these steps:

```bash
# Clone the repository
git clone https://github.com/dhrubsingh/documentationwriter.git

# Navigate to the project directory
cd documentationwriter

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../github-doc-generator
npm install
```

## 🚀 Usage

To start the development server:

```bash
# Start the backend server
cd backend
npm start

# Start the frontend development server
cd ../github-doc-generator
npm start
```

Example usage in the frontend:

```javascript
// Example of generating documentation
const { owner, repo } = parseGitHubUrl('https://github.com/dhrubsingh/documentationwriter');
const { repoData, documentation } = await processRepository(owner, repo);
console.log(generateReadme(repoData, documentation));
```

## 📋 Requirements

- Node.js (v18 or higher)
- npm (v9 or higher)
- System Requirements:
  - 4GB RAM minimum
  - 2GHz dual-core processor
  - 500MB disk space

Install required dependencies:

```bash
# Install backend dependencies
cd backend
npm install express cors openai dotenv axios

# Install frontend dependencies
cd ../github-doc-generator
npm install react react-dom @uiw/react-md-editor lucide-react
```

## 📝 License

This project is licensed under the MIT License. See the LICENSE file for more details.