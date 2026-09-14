const babelJest = require("babel-jest");
module.exports = (babelJest.default || babelJest).createTransformer({
  babelrc: false, configFile: false,
  plugins: [
    require.resolve("@babel/plugin-transform-modules-commonjs"),
    // Jest runs without a development server, so Router HMR is unavailable.
    ({ types: t }) => ({ visitor: { MetaProperty(path) {
      if (path.node.meta.name === "import") path.replaceWith(t.objectExpression([]));
    } } }),
  ],
});
