module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: true,
  transform: {
    "^.+\\.ts?$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  transformIgnorePatterns: ["<rootDir>/node_modules/whatwg-url/*",],
  collectCoverageFrom: ["**/src/**/*.{ts,tsx}"],
  coverageDirectory: "./coverage/",
};
