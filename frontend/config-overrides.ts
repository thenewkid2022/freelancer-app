import type { Configuration } from 'webpack';
import type { OverrideWebpackConfig } from 'react-app-rewired';
import path from 'path';

const config: OverrideWebpackConfig = (config: Configuration) => {
  if (!config.resolve) {
    config.resolve = {};
  }
  if (!config.resolve.alias) {
    config.resolve.alias = {};
  }

  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname, 'src'),
    '@components': path.resolve(__dirname, 'src/components'),
    '@hooks': path.resolve(__dirname, 'src/hooks'),
    '@services': path.resolve(__dirname, 'src/services'),
    '@utils': path.resolve(__dirname, 'src/utils'),
    '@context': path.resolve(__dirname, 'src/context'),
    '@types': path.resolve(__dirname, 'src/types')
  };

  return config;
};

export default config; 