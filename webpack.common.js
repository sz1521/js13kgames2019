const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackInlineSourcePlugin = require("html-webpack-inline-source-plugin");

const isProduction = process.env.npm_lifecycle_event === "build";

module.exports = {
  entry: "./src/main.js",
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: "js13k Game",
      template: "src/index.html",
      minify: isProduction && {
        collapseWhitespace: true,
        minifyCSS: true,
        removeComments: true
      },
      inlineSource: isProduction && ".(js|css)$"
    }),
    new HtmlWebpackInlineSourcePlugin()
  ],
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist")
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "eslint-loader"
      },
      {
        test: /\.svg$/,
        loader: "svg-inline-loader",
        options: {
          removeSVGTagAttrs: false
        }
      }
    ]
  }
};
