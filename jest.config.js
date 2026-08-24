module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  clearMocks: true,
  collectCoverageFrom: [
    "src/services/**/*.ts",
    "src/middlewares/**/*.ts",
    "!src/**/*.test.ts",
  ],
  coverageDirectory: "coverage",
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.spec.json",
    },
  },
};
