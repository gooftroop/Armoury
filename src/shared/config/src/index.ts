export type { AppConfig, ServiceConfig } from './schema.js';
export { defaults } from './schema.js';
// Re-export config from the platform adapter — bundler resolves via package.json exports map.
// Next.js → "default" → ./src/adapters/nextjs.ts
// React Native → "react-native" → ./src/adapters/expo.ts
export { config } from './adapters/nextjs.js';
