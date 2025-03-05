import eslint from "@eslint/js";
import tsEsLint from "typescript-eslint";

export default tsEsLint.config(
  eslint.configs.recommended,
  ...tsEsLint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsEsLint.parser,
      parserOptions: {
        project: true,
      },
    },
    plugins: {
      "@typescript-eslint": tsEsLint.plugin,
    },
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",

      // Disable rules that TypeScript handles
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.turbo/**",
      "**/build/**",
    ],
  }
);
