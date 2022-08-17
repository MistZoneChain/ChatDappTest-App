const Host = 'http://localhost:3000';
const webpack = require('webpack');

const cdn = {
  css: [],
  js: [
    'https://cdn.bootcdn.net/ajax/libs/vue/2.6.10/vue.min.js',
    'https://cdn.bootcdn.net/ajax/libs/vue-router/3.1.3/vue-router.min.js',
    'https://cdn.bootcdn.net/ajax/libs/vuex/3.1.2/vuex.min.js',
    'https://cdn.bootcdn.net/ajax/libs/axios/0.18.0/axios.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.27.0/moment.min.js',
  ],
};

const CompressionWebpackPlugin = require('compression-webpack-plugin');

module.exports = {
  chainWebpack: (config) => {
    // 需要打包分析时取消注释
    // config.plugin('webpack-bundle-analyzer').use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin);

    if (process.env.NODE_ENV === 'production') {
      let externals = {
        vue: 'Vue',
        axios: 'axios',
        'vue-router': 'VueRouter',
        vuex: 'Vuex',
        moment: 'moment',
      };
      config.externals(externals);
      config.plugin('html').tap((args) => {
        args[0].cdn = cdn;
        return args;
      });
    }
  },
  configureWebpack: (config) => {
    const productionGzipExtensions = ['html', 'js', 'css'];
    config.plugins.push(
      new CompressionWebpackPlugin({
        filename: '[path].gz[query]',
        algorithm: 'gzip',
        test: new RegExp('\\.(' + productionGzipExtensions.join('|') + ')$'),
        threshold: 10240,
        minRatio: 0.8,
        deleteOriginalAssets: false,
      })
    );

    config.plugins.push(new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/));

    if (process.env.NODE_ENV === 'production') {
      config.optimization.minimizer[0].options.terserOptions.compress.drop_console = true;
    }
  },
  css: {
    loaderOptions: {
      less: {
        lessOptions: {
          modifyVars: {
            'primary-color': 'skyblue',
            // 'link-color': '#1DA57A',
            // 'border-radius-base': '2px',
          },
          javascriptEnabled: true,
        },
      },
      sass: {
        prependData: "@import '@/theme/index.scss';",
      },
    },
  },
  publicPath: './',
  devServer: {
    port: 1997,
    // proxy: {
    //   '/api': {
    //     target: Host,
    //     ws: true,
    //     changeOrigin: true,
    //     pathRewrite: {
    //       '^/api': '',
    //     },
    //   },
    //   'socket.io': {
    //     target: Host,
    //     ws: true,
    //     changeOrigin: true,
    //   },
    // },
  },
  productionSourceMap: false,
};
