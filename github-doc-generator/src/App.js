import React, { useEffect } from 'react';
import DocumentationGenerator from './components/DocumentationGenerator';

function App() {
  useEffect(() => {
    // Handle GitHub OAuth callback
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      localStorage.setItem('github_token', token);
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Reload to update authentication state
      window.location.reload();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <DocumentationGenerator />
    </div>
  );
}

export default App;