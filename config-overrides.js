module.exports = function override(config, env) {
  // Deaktiviere source-map-loader für react-router-dom
  config.module.rules = config.module.rules.map(rule => {
    if (rule.use && rule.use.some(use => use.loader === 'source-map-loader')) {
      rule.exclude = /react-router-dom/;
    }
    return rule;
  });

  return config;
}; 