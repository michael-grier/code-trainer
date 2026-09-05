import mdx from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), [
    'AUTH_PROXY_TARGET',
    'VITE_CONVEX_SITE_URL',
  ])
  const authProxyTarget =
    process.env.AUTH_PROXY_TARGET ||
    fileEnv.AUTH_PROXY_TARGET ||
    fileEnv.VITE_CONVEX_SITE_URL

  return {
    plugins: [mdx(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
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
  }
})
