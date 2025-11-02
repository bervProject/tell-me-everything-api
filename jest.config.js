module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: true,
  transformIgnorePatterns: [],
  collectCoverageFrom: ["**/src/**/*.{ts,tsx}"],
  coverageDirectory: "./coverage/",
};
