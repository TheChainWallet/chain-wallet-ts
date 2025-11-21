/** @type {import('ts-jest').JestConfigWithTsJest} **/

module.exports = {
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testTimeout:20*1000,
  testMatch: ["**/test/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[tj]s?(x)"],
  // testRegex: ".*\\.spec\\.ts$",
};