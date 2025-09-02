module.exports = {
  parser: "@typescript-eslint/parser",
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    project: "./tsconfig.json",
  },
  rules: {
    "prefer-const": "error",
    "no-var": "error",
    "no-unused-vars": "off",
    "no-undef": "off",
  },
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ["dist/", "node_modules/", "*.js"],
};
