const babelJest = require("babel-jest");
module.exports = (babelJest.default || babelJest).createTransformer({
  babelrc: false, configFile: false,
  plugins: [require.resolve("@babel/plugin-transform-modules-commonjs")],
});
