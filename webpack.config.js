/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const config = require("./config");

const stripLeadingSlash = (publicPath) => publicPath.replace(/^\/+/, "");

const assetMounts = [
    { from: config.PORTAL_HUB2COLOR_MOUNT_FOLDER, to: config.HUB2COLOR_PUBLIC_PATH },
    { from: config.PORTAL_IMG_MOUNT_FOLDER, to: config.HUB2COLOR_IMG_PUBLIC_PATH },
    { from: config.PORTAL_CSS_MOUNT_FOLDER, to: config.HUB2COLOR_CSS_PUBLIC_PATH },
    { from: config.PORTAL_IMAGES_MOUNT_FOLDER, to: config.HUB2COLOR_IMAGES_PUBLIC_PATH }
];

module.exports = (env, argv) => {
    const isProduction = argv.mode === "production";

    const copyPatterns = assetMounts
        .map(({ from, to }) => ({
            from: path.resolve(__dirname, from),
            to: path.resolve(__dirname, "dist", stripLeadingSlash(to)),
            noErrorOnMissing: true
        }))
        .filter(({ from }) => fs.existsSync(from));

    return {
        entry: "./src/index.tsx",
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: isProduction ? "[name].[contenthash].js" : "[name].js",
            chunkFilename: isProduction ? "[name].[contenthash].chunk.js" : "[name].chunk.js",
            clean: true
        },
        resolve: {
            extensions: [".tsx", ".ts", ".js"],
            alias: {
                "@": path.resolve(__dirname, "src")
            }
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: "ts-loader",
                    exclude: /node_modules/
                },
                {
                    test: /\.css$/i,
                    use: ["style-loader", "css-loader"]
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    type: "asset/resource"
                }
            ]
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: "./src/index.html",
                title: "Mini Storybook"
            }),
            ...(copyPatterns.length > 0
                ? [new CopyWebpackPlugin({ patterns: copyPatterns })]
                : [])
        ],
        devServer: {
            static: [
                {
                    directory: path.join(__dirname, "public"),
                    publicPath: "/"
                },
                {
                    directory: path.resolve(__dirname, config.PORTAL_HUB2COLOR_MOUNT_FOLDER), 
                    publicPath: config.HUB2COLOR_PUBLIC_PATH + '/', // Files in /external-folder/ are ALSO at localhost:8080/
                    watch: true,
                },
                {
                    directory: path.resolve(__dirname, config.PORTAL_IMG_MOUNT_FOLDER), 
                    publicPath: config.HUB2COLOR_IMG_PUBLIC_PATH + '/', // Files in /external-folder/ are ALSO at localhost:8080/
                    watch: true,
                },
                {
                    directory: path.resolve(__dirname, config.PORTAL_CSS_MOUNT_FOLDER), 
                    publicPath: config.HUB2COLOR_CSS_PUBLIC_PATH + '/', // Files in /external-folder/ are ALSO at localhost:8080/
                    watch: true,
                },
                {
                    directory: path.resolve(__dirname, config.PORTAL_IMAGES_MOUNT_FOLDER), 
                    publicPath: config.HUB2COLOR_IMAGES_PUBLIC_PATH + '/', // Files in /external-folder/ are ALSO at localhost:8080/
                    watch: true,
                },
            ],
            port: 3000,
            hot: true,
            historyApiFallback: true
        },
        devtool: isProduction ? "source-map" : "eval-source-map",
        optimization: {
            splitChunks: {
                chunks: "all",
                cacheGroups: {
                    vendorReact: {
                        test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                        name: "vendor-react",
                        priority: 20,
                        reuseExistingChunk: true
                    },
                    vendorRedux: {
                        test: /[\\/]node_modules[\\/](@reduxjs|redux|react-redux|immer|reselect)[\\/]/,
                        name: "vendor-redux",
                        priority: 15,
                        reuseExistingChunk: true
                    },
                    vendorMui: {
                        test: /[\\/]node_modules[\\/](@mui|@emotion)[\\/]/,
                        name: "vendor-mui",
                        priority: 10,
                        reuseExistingChunk: true
                    },
                    monaco: {
                        test: /[\\/]node_modules[\\/](@monaco-editor|monaco-editor)[\\/]/,
                        name: "monaco-editor",
                        priority: 5,
                        reuseExistingChunk: true
                    },
                    default: {
                        minChunks: 2,
                        priority: -10,
                        reuseExistingChunk: true
                    }
                }
            },
            runtimeChunk: "single"
        }
    };
};
