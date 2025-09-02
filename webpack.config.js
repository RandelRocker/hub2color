/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (env, argv) => {
    const isProduction = argv.mode === "production";

    return {
        entry: "./src/index.tsx",
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: isProduction ? "[name].[contenthash].js" : "[name].js",
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
            })
        ],
        devServer: {
            static: [
                {
                    directory: path.join(__dirname, "public"),
                    publicPath: "/"
                }
            ],
            port: 3000,
            hot: true,
            historyApiFallback: true
        },
        devtool: isProduction ? "source-map" : "eval-source-map"
    };
};
