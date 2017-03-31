/**
 * 启动开发服务以及api mock服务
 */

var express = require('express');
var util = require('util');
var fs = require('fs');
var path = require("path");
var djv = require('djv');
var bodyParser = require("body-parser");
var DataMocker = require('json-schema-mock');
var webpack = require('webpack');
var opn = require('opn');
var WebpackDevServer = require('webpack-dev-server');

var config = require('./webpack.config');
var compiler = webpack(config);

var server = {
    initWebpack: function () {
        var server = new WebpackDevServer(compiler, {
            hot: true,
            inline: true,
            proxy: {
                '*': {
                    target: 'http://localhost:8091',
                    changeOrigin: true,
                    secure: false
                }
            }
        });

        server.listen(8080);
        opn('http://localhost:8080');

        console.log("run http://localhost:8080");
    },
    fsExistsSync: function (path) {
        try {
            fs.accessSync(path, fs.F_OK)
        } catch (e) {
            return false;
        }
        return true;
    },
    validatorJSON: function (jsonsc, data) {
        var djvalidate = new djv();
        djvalidate.addSchema('test', jsonsc);

        return !djvalidate.validate('test#/', data);
    },
    error: function (res, message) {
        res.end(JSON.stringify({
            state: 1,
            message: message
        }))
    },
    getFileJSON: function (path, res) {
        var json = fs.readFileSync(path);
        var self = this;

        try {
            return JSON.parse(json.toString());
        } catch (e) {
            self.error(res, "json file error，file:" + path)
        }
    },
    initMock: function () {

        var app = express();
        var self = this;

        app.set("port", 8091);

        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(express.static(path.join(__dirname, 'dist')));

        app.all('*', function (req, res) {
            var pathArray = req.path.split('/');
            var apiPath = path.resolve(__dirname, './api/' + pathArray.join('/'));
            var apiFilePath = apiPath + '.json';
            var apiEntryPath = apiPath + '.entry.json';

            var params = Object.assign(req.query, req.body);
            // 验证接口数据，以及mock接口数据
            if (self.fsExistsSync(apiFilePath) && self.fsExistsSync(apiEntryPath)) {

                var jsonEntry = self.getFileJSON(apiEntryPath, res);

                //验证数据
                if (jsonEntry && self.validatorJSON(jsonEntry, params)) {

                    var jsonsc = self.getFileJSON(apiFilePath, res);

                    if (jsonsc) {
                        try {
                            var json = DataMocker(jsonsc);
                            res.end(JSON.stringify(json));
                        } catch (e) {
                            self.error(res, "json schema error file:" + apiFilePath)
                        }
                    } else {
                        self.error(res, "json schema error file:" + apiFilePath)
                    }

                    // 校验正确mock数据
                } else {
                    self.error(res, "输入参数格式错误")
                }

            } else {
                self.error(res, "接口不存在或者接口描述不全")
            }
        })
        app.listen(app.get('port'), function () {
            console.log("Mock server listening on port " + app.get("port"));
        })
    }
}

server.initMock();
server.initWebpack();
