// src/config/api.js
import axios from 'axios';

// Function to generate documentation using our backend
export const generateDocumentation = async (codeContent) => {
    try {
        const response = await fetch('http://localhost:3001/api/generate-docs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ codeContent })
        });

        if (!response.ok) {
            throw new Error('Failed to generate documentation');
        }

        const data = await response.json();
        return data.documentation;
    } catch (error) {
        console.error('Error generating documentation:', error);
        throw error;
    }
};

// Function to fetch GitHub repository data
export const fetchRepoData = async (owner, repo) => {
    try {
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching repo data:', error);
        throw new Error('Failed to fetch repository data');
    }
};

// Function to fetch repository contents
export const fetchRepoContents = async (owner, repo) => {
    try {
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`
        );
        return response.data.tree;
    } catch (error) {
        console.error('Error fetching repo contents:', error);
        throw new Error('Failed to fetch repository contents');
    }
};

// Function to fetch file content from GitHub
export const fetchFileContent = async (owner, repo, path) => {
    try {
        const response = await axios.get(
            `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching file content:', error);
        throw new Error(`Failed to fetch content for ${path}`);
    }
};