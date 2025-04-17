export default {
    transform: {
      "^.+\\.[t|j]sx?$": "babel-jest"
    },
    transformIgnorePatterns: [
      "node_modules/(?!(module-that-needs-to-be-transformed)/)"
    ],
    moduleFileExtensions: ["js", "json"],
    testEnvironment: "jsdom",
    testMatch: ["**/test/unit/**/*.test.js"],
    // Remove the extensionsToTreatAsEsm setting
    moduleNameMapper: {
      "^(\\.{1,2}/.*)\\.js$": "$1"
    },
    coverageDirectory: "coverage",
    collectCoverageFrom: ["src/**/*.js"]
  };