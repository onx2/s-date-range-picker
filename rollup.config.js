import svelte from "rollup-plugin-svelte";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import serve from "rollup-plugin-serve";
import html from "rollup-plugin-bundle-html";
// import typescript from "rollup-plugin-typescript2";
// import tscompile from "typescript";
import { terser } from "rollup-plugin-terser";
import livereload from "rollup-plugin-livereload";
import bundleSize from "rollup-plugin-bundle-size";
import pkg from "./package.json";

const name = pkg.name
  .replace(/^(@\S+\/)?(svelte-)?(\S+)/, "$3")
  .replace(/^\w/, m => m.toUpperCase())
  .replace(/-\w/g, m => m[1].toUpperCase());

const isProd = process.env.NODE_ENV === "production";
const isDev = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

const plugins = [
  commonjs({ include: "node_modules/**" }),
  // typescript({ typescript: tscompile }),
  svelte({
    dev: isProd ? false : true,
    extensions: [".svelte"],
    // preprocess: require("./svelte.config.js").preprocess,
    css: isTest ? false : css => css.write("build/css/style.css")
  }),
  resolve({ browser: true }),
  html({
    template: "src/index.html",
    dest: "build",
    filename: "index.html"
  })
];

if (isDev) {
  plugins.push(
    serve({
      open: false,
      openPage: "/index.html",
      historyApiFallback: "/index.html",
      contentBase: ["./build"]
    }),
    livereload({
      watch: "build"
    })
  );
} else if (isProd) {
  // Minify
  plugins.push(terser({ sourcemap: true, mangle: true }));
  // Output bundle sizes to console
  plugins.push(bundleSize());
}

export default {
  input: isProd ? "src/date-range-picker/index.js" : "src/index.js",
  output: [
    { file: pkg.module, format: "es" },
    { file: pkg.main, format: "umd", name }
  ],
  plugins
};
