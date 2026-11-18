import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// 개발 서버에서 /api 요청을 Spring 백엔드로 넘긴다 (CORS 설정 없이 같은 출처로 호출)
// 백엔드 주소를 바꾸려면 .env.local에 VITE_API_PROXY_TARGET=http://localhost:8081 처럼 지정
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  };
});
