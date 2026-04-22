import nextVitals from "eslint-config-next/core-web-vitals";

export default [
  ...nextVitals,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "prefer-const": "off",
      "no-undef": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-useless-assignment": "off",
      "no-empty": "off"
    }
  }
];
