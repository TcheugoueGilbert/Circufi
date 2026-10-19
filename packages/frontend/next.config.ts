import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Self-contained server bundle (.next/standalone) used by the Docker image
  output: 'standalone',
  // The app lives in an npm workspace: trace files from the repository root
  outputFileTracingRoot: path.join(__dirname, '../../'),
}

export default nextConfig
