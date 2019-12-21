const sass = require("node-sass")
/**
 * @todo Use this file in rollup.config.js to add preprocessor for TypeScript
 */
const {
  preprocess,
  createEnv,
  readConfigFile
} = require("svelte-ts-preprocess")

const env = createEnv()

module.exports = {
  preprocess: {
    style: async ({ content, attributes }) => {
        if (attributes.type !== "text/scss" && attributes.lang !== "scss") return // lang is now taken into account

        return new Promise((resolve, reject) => {
          sass.render({
              data: content,
              includePaths: ["src"],
              sourceMap: true,
              outFile: "x" // this is necessary, but is ignored
            },
            (err, result) => {
              if (err) return reject(err)

              resolve({
                code: result.css.toString(),
                map: result.map.toString()
              })
            }
          )
        })
      },
      typescript: preprocess({
      env,
      compilerOptions: {
        ...readConfigFile(env),
        allowNonTsExtensions: true,
        customElement: true
      }
    })
  }
}
