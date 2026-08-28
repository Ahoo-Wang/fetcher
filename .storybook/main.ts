import { join, dirname } from 'path';
import { createRequire } from 'module';
import type { StorybookConfig } from '@storybook/react-vite';

const require = createRequire(import.meta.url);

function getAbsolutePath(value: string): string {
  return dirname(require.resolve(join(value, 'package.json')));
}

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(ts|tsx)'],
  addons: [
    getAbsolutePath('@chromatic-com/storybook'),
    {
      name: getAbsolutePath('@storybook/addon-docs'),
      options: {
        transcludeMarkdown: true,
      },
    },
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-vitest'),
  ],
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
};
export default config;
