/**
 * Fallback when Metro has not generated `dev-hmr-registry.generated.js` yet.
 * Empty on purpose: HMR plugins come only from gitignored `dev-plugins.local.json`.
 */
module.exports = {
  modules: [],
};
