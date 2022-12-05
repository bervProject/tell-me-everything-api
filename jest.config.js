module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: true,
  moduleNameMapper: {
    "^axios$": require.resolve("axios"),
  },
  collectCoverageFrom: ["**/src/**/*.{ts,tsx}"],
  coverageDirectory: "./coverage/",
};
