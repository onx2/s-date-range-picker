module.exports = {
  env: {
    "jest/globals": true,
    "browser": true,
    "es6": true
  },
  parserOptions: {
    "ecmaVersion": 2019,
    "sourceType": "module"
  },
  plugins: [
    "jest",
    "svelte3"
  ],
  settings: {
		"svelte3/ignore-styles": attributes => attributes.lang && attributes.lang.includes('scss')
	},
  extends: [
    "eslint:recommended"
  ],
  overrides: [
    {
     files: [
        "src/date-range-picker/**/*.svelte",
        "src/date-range-picker/*.svelte"
      ],
      processor: "svelte3/svelte3"
    }
  ],
  rules: {
    "comma-dangle": "error",
    quotes: ["error", "double"],
    semi: ["error", "never"]
  }
}
