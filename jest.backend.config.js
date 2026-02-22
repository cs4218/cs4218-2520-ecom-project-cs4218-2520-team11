export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which tests to run
  testMatch: [
    "<rootDir>/{controllers,middlewares,helpers,models}/*.test.js",
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/categoryController.js",
    "controllers/productController.js",
    "models/categoryModel.js",
    "models/userModel.js",
  ],

  coverageThreshold: {
    global: {
      lines: 9,
      functions: 9,
    },
  },
};