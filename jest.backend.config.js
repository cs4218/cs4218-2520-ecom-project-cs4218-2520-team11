export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: ["<rootDir>/{controllers,middlewares,helpers}/*.test.js"],

  // jest code coverage
  collectCoverage: true,
  // Scope coverage to the two controller files under test
  collectCoverageFrom: [
    "controllers/categoryController.js",
    "controllers/productController.js",
  ],
  coverageThreshold: {
    global: {
      lines: 50,
      functions: 25,
    },
  },
};
