module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh"],
  ignorePatterns: [
    "dist",
    "node_modules",
    "public",
    "tests",
    "*.config.*",
    ".eslintrc.cjs",
  ],
  rules: {
    "react-refresh/only-export-components": "off",
    "react-hooks/exhaustive-deps": "warn",
  },
};
