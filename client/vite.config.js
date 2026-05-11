import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const getApiProxyTarget = (apiUrl) => {
  if (!apiUrl) {
    return undefined;
  }

  try {
    return new URL(apiUrl).origin;
  } catch {
    return undefined;
  }
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = getApiProxyTarget(env.VITE_API_URL);

  return {
    plugins: [react()],
    server: apiProxyTarget
      ? {
          proxy: {
            '/api': {
              target: apiProxyTarget,
              changeOrigin: true
            }
          }
        }
      : undefined,
    test: {
      environment: 'jsdom',
      setupFiles: './test/setup.js'
    }
  };
});
