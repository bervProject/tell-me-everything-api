module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: true,
  transform: {
    "^.+\\.ts?$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  transformIgnorePatterns: [],
  collectCoverageFrom: ["**/src/**/*.{ts,tsx}"],
  coverageDirectory: "./coverage/",
};
