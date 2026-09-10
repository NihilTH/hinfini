module.exports = require("babel-jest").createTransformer({
  babelrc: false, configFile: false,
  plugins: [require.resolve("@babel/plugin-transform-modules-commonjs")],
});
