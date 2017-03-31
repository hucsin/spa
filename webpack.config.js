/**
 * webpack 配置文件
 * @author wangjian366
 */

var webpack = require('webpack');
var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var CleanWebpackPlugin = require('clean-webpack-plugin');
var NgAnnotatePlugin = require('ng-annotate-webpack-plugin');//自动注入注解插件
var buildPath = path.resolve(__dirname, "dist");
var publicPath = '';
var __DEV__ = process.env.NODE_ENV === 'dev';
var  devtool = 'source-map';

var plugins = [
    new CleanWebpackPlugin('dist', {
        verbose: true,
        dry: false
     }),
     new HtmlWebpackPlugin({
          chunks: ['app', 'vendor'],
          template: __dirname + '/src/index.html',
          filename: './index.html'
     }),
     new webpack.optimize.CommonsChunkPlugin({
         name: "vendor",
         filename: "script/vendor.[hash:6].js"
     }),
     new ExtractTextPlugin("css/styles.[hash:6].css"),
     new ExtractTextPlugin("css/styles.[hash:6].less"),
     
     new NgAnnotatePlugin({
        add: true
     }),
     new webpack.BannerPlugin("Copyright pingan.com.cn inc.")
     
];

if (!__DEV__) {
    plugins.push(new webpack.optimize.UglifyJsPlugin({
        compress: {
            warnings: false
        }
    }));
    plugins.push(new webpack.DefinePlugin({
         'process.env': {
             NODE_ENV: '"production"'
         }
     }));
    publicPath = './';
} else {
  plugins.push(new webpack.HotModuleReplacementPlugin())
}


module.exports = {
    //入口文件配置
    entry: {
        app: path.resolve(__dirname, 'src/app.js'),
        vendor: ["angular", 'angular-ui-router', 'oclazyload']
    },
    //文件导出的配置
    output: {
        path: buildPath,
        filename: "script/[name].[hash:6].js",
        publicPath: publicPath,
        chunkFilename: "chunks/[name].chunk.[chunkhash].js"
    },
    //本地服务器配置
    devServer: {
        historyApiFallback: true,
        hot: true,
        inline: true,
        grogress: true
    },
    //模块配置
    module: {
        rules:[
            {
                test: /\.html$/,
                use: ['raw-loader']
            },
            /*{
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: function() {
                                return [
                                    require('autoprefixer')
                                ]
                            }
                        }
                    }
                ]
            },*/
            {
                test: /\.(png|jpg|gif)$/,
                use: 'url?limit=8192,name=/img/[name].[hash:6].[ext]'
            },
            {
                test:  /\.(woff|woff2|eot|ttf|svg)(\?.*$|$)/,
                use: 'url-loader?importLoaders=1&limit=1000&name=/fonts/[name].[ext]'
            },
            {
                test: /\.(less|css)/,
                use: ExtractTextPlugin.extract({
                    'fallback': 'style-loader',
                    'use': 'css-loader!less-loader'
                })
            }
        ]
    },
    //插件配置
    plugins: plugins,
    //调试配置
    devtool: devtool,
    resolve: {
        alias: {
            'components' : path.resolve(path.resolve(__dirname, './src/components')),
            'modules' : path.resolve(path.resolve(__dirname, './src/components'))
        }
    }
};
