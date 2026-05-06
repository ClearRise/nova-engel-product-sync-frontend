import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  // console.log(env, "env");
  
  return {
    plugins: [react(), tailwindcss()],
    envDir: '.',
    envPrefix: 'VITE_',
    define: {
      // Expose environment variables to the client
      'import.meta.env.VITE_SHOPIFY_SHOP_DOMAIN': JSON.stringify(env.SHOPIFY_SHOP_DOMAIN),
      'import.meta.env.VITE_SHOPIFY_ADMIN_ACCESS_TOKEN': JSON.stringify(env.SHOPIFY_ADMIN_ACCESS_TOKEN),
      'import.meta.env.VITE_NOVA_ENGEL_EMAIL': JSON.stringify(env.NOVA_ENGEL_EMAIL),
      'import.meta.env.VITE_NOVA_ENGEL_PASSWORD': JSON.stringify(env.NOVA_ENGEL_PASSWORD),
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      open: true,
      proxy: {
        '/api': {
          target: 'http://localhost:80',
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})
