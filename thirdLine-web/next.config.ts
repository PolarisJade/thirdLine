import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

// Keep HMR output separate from production builds and browser test servers.
export default function config(phase: string): NextConfig {
  return {
    poweredByHeader: false,
    reactStrictMode: true,
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
  };
}
