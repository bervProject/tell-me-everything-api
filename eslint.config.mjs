import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginJest from "eslint-plugin-jest";
import { globalIgnores } from "eslint/config";
import json from "eslint-plugin-json";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import markdown from "@eslint/markdown";

export default tseslint.config(
  globalIgnores([".yarn/"]),
  {
    files: ["**/*.md"],
    plugins: {
      markdown,
    },
    language: "markdown/commonmark",
    rules: {
      "markdown/no-html": "error",
    },
  },
  {
    files: ["**/*.json"],
    plugins: { json },
    processor: "json/json",
    rules: {
      "json/*": ["error", "allowComments"],
    },
  },
  {
    files: ["**/*.ts"],
    ...eslint.configs.recommended,
  },
  {
    // update this to match your test files
    files: ["**/*.spec.ts", "**/*.test.ts"],
    plugins: { jest: pluginJest },
    languageOptions: {
      globals: pluginJest.environments.globals.globals,
    },
  },
  tseslint.configs.recommended,
  {
    rules: {
      "no-case-declarations": "warn",
      "no-undef": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    ignores: ["**/*.md"],
    ...eslintPluginPrettierRecommended,
  },
);
