module.exports = function override(config, env) {
  // Modify HtmlWebpackPlugin options
  config.plugins.forEach(plugin => {
    if (plugin.constructor.name === 'HtmlWebpackPlugin') {
      plugin.options.inject = 'body';
      plugin.options.scriptLoading = 'defer';
    }
  });
  
  return config;
} 