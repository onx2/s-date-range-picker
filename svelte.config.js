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
  preprocess: preprocess({
    env,
    compilerOptions: {
      ...readConfigFile(env),
      allowNonTsExtensions: true,
      customElement: true
    }
  })
}
