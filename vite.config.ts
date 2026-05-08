import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Parse the API URL from .env if it exists, otherwise use fallback
  const apiUrl = env.VITE_PDF_ANALYZER_API_URL || 'https://kushagra734-bail-pdf-analyzer.hf.space/analyze-pdf';
  
  let targetOrigin = 'https://kushagra734-bail-pdf-analyzer.hf.space';
  let rewritePath = '/analyze-pdf';
  
  try {
    const url = new URL(apiUrl);
    targetOrigin = url.origin;
    rewritePath = url.pathname;
  } catch (e) {
    console.error("Invalid VITE_PDF_ANALYZER_API_URL in .env");
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Avoid CORS when calling HF Space API from localhost.
        // Frontend will call /api/analyze-pdf, Vite will proxy to the HF Space dynamically.
        '/api/analyze-pdf': {
          target: targetOrigin,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/analyze-pdf/, rewritePath === '/' ? '' : rewritePath),
        },
      },
    },
  };
});
