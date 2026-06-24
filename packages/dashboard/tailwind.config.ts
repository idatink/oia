import type { Config } from 'tailwindcss';
import { sharedConfig } from '@nia/shared-ui';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', '../../packages/shared-ui/src/**/*.{ts,tsx}'],
  presets: [{ theme: sharedConfig.theme }],
};

export default config;
