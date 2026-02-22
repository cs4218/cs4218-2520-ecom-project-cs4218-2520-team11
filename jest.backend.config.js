export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which tests to run
  testMatch: ["<rootDir>/{controllers,middlewares,helpers,models}/*.test.js"],

  // jest code coverage
  collectCoverage: true,

  // Scope coverage to MS1 assigned backend files
  collectCoverageFrom: [
    "controllers/categoryController.js",
    "controllers/productController.js",
    "models/categoryModel.js",
    "models/userModel.js",
  ],

  // Keep thresholds low to avoid failing due to partial controller scope
  coverageThreshold: {
    global: {
      lines: 9,
      functions: 9,
    },
  },
};