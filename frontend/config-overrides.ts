import type { Configuration } from 'webpack';
import type { OverrideWebpackConfig } from 'react-app-rewired';

const config: OverrideWebpackConfig = (config: Configuration) => {
  return config;
};

export default config; 