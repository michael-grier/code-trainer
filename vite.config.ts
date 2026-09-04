import mdx from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'

const authProxyTarget = process.env.AUTH_PROXY_TARGET

export default defineConfig({
  plugins: [mdx(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: authProxyTarget
    ? {
        proxy: {
          '/api/auth': {
            target: authProxyTarget,
            changeOrigin: true,
            configure(proxy) {
              proxy.on('proxyReq', (proxyRequest, request) => {
                // The backend trusts only the address written by this proxy.
                proxyRequest.removeHeader('x-forwarded-for')
                proxyRequest.removeHeader('x-real-ip')
                proxyRequest.setHeader(
                  'x-real-ip',
                  request.socket.remoteAddress ?? 'unknown',
                )
              })
            },
          },
        },
      }
    : undefined,
})
