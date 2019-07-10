const webpack = require('webpack');
const path = require('path');

const devServer = {
  host: 'localhost',
  port: '7070',
  compress: true,
  publicPath: `http://localhost:7070/assets/`
};

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    app: path.resolve(__dirname, './src/app.js')
  },
  resolve: {
    modules: [path.resolve(__dirname, './node_modules')]
  },
  devServer: devServer,
  output: {
    filename: '[name].js',
    publicPath: devServer.publicPath
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules\/(?!(dom7|ssr-window|swiper)\/).*/,
        loader: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader',
            options: { minimize: true }
          }
        ]
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loader: 'url-loader',
        options: {
          limit: 4096,
          outputPath: 'images/'
        }
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      IN_APP: 'false',
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
    // new BundleAnalyzerPlugin()
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/](.*).js$/,
          chunks: 'all',
          name: 'vendor'
        }
      }
    },
    runtimeChunk: {
      name: 'runtime'
    }
  }
};
