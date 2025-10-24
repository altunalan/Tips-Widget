module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
    browser: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:jsdoc/recommended',
    'plugin:prettier/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  settings: {
    jsdoc: {
      tagNamePreference: {
        returns: 'returns',
      },
    },
  },
};
