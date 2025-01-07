import axios from 'axios';
import { generateDocumentation } from '../../config/api';

export const parseGitHubUrl = (url) => {
    const regex = /github\.com\/([^/]+)\/([^/]+)/;
    const matches = url.match(regex);
    if (!matches) throw new Error('Invalid GitHub URL format');
    return { owner: matches[1], repo: matches[2] };
};

export const fetchRepoContents = async (owner, repo) => {
    try {
        // Fetch repository metadata
        const repoResponse = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}`
        );

        // Fetch repository contents
        const contentsResponse = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`
        );

        return {
            repoData: repoResponse.data,
            contents: contentsResponse.data.tree
        };
    } catch (error) {
        console.error('Error fetching repo contents:', error);
        throw error;
    }
};

export const processRepository = async (owner, repo) => {
    // Fetch repo contents
    const { repoData, contents } = await fetchRepoContents(owner, repo);
    
    // Filter for relevant files (.js, .jsx, .ts, .tsx, etc.)
    const codeFiles = contents.filter(file => 
        /\.(js|jsx|ts|tsx|py|java|cpp|rb)$/.test(file.path)
    );

    // Fetch content of each file
    const fileContents = await Promise.all(
        codeFiles.map(async file => {
            const response = await axios.get(
                `https://raw.githubusercontent.com/${owner}/${repo}/main/${file.path}`
            );
            return {
                path: file.path,
                content: response.data
            };
        })
    );

    // Generate documentation for each file
    const documentation = await Promise.all(
        fileContents.map(async file => {
            const docs = await generateDocumentation(file.content);
            return {
                path: file.path,
                documentation: docs
            };
        })
    );

    return {
        repoData,
        documentation
    };
};

export const generateReadme = (repoData, documentation) => {
    const doc = [];

    // Project Title and Description
    doc.push(`# ${repoData.name}\n`);
    doc.push(repoData.description ? `${repoData.description}\n\n` : '\n');

    // Badges
    doc.push(`![GitHub stars](https://img.shields.io/github/stars/${repoData.full_name})`);
    doc.push(`![GitHub forks](https://img.shields.io/github/forks/${repoData.full_name})`);
    doc.push(`![GitHub issues](https://img.shields.io/github/issues/${repoData.full_name})\n\n`);

    // Table of Contents
    doc.push('## Table of Contents\n');
    doc.push('- [Installation](#installation)\n');
    doc.push('- [Code Documentation](#code-documentation)\n');
    doc.push('- [Contributing](#contributing)\n');
    doc.push('- [License](#license)\n\n');

    // Installation
    doc.push('## Installation\n');
    doc.push('```bash\n');
    doc.push(`git clone ${repoData.clone_url}\n`);
    doc.push(`cd ${repoData.name}\n`);
    doc.push('```\n\n');

    // Code Documentation
    doc.push('## Code Documentation\n');
    documentation.forEach(({ path, documentation }) => {
        doc.push(`### ${path}\n\n`);
        doc.push(`${documentation}\n\n`);
    });

    return doc.join('');
};