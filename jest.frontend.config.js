export default {
  // name displayed during tests
  displayName: "frontend",

  // simulates browser environment in jest
  // e.g., using document.querySelector in your tests
  testEnvironment: "jest-environment-jsdom",

  // jest does not recognise jsx files by default, so we use babel to transform any jsx files
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },

  // tells jest how to handle css/scss imports in your tests
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
  },

  // ignore all node_modules except styleMock (needed for css imports)
  transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js)$)"],

  // run all frontend tests (pages, components, hooks, etc.)
  testMatch: ["<rootDir>/client/src/**/*.test.js"],
  testPathIgnorePatterns: ["<rootDir>/client/src/_site/"],

  // jest code coverage
  collectCoverage: true,

  // scope coverage to MS1 assigned frontend files
  collectCoverageFrom: [
  "context/auth.js",
  "components/Routes/Private.js",

  "pages/Auth/Register.js",
  "pages/Auth/Login.js",

  "components/AdminMenu.js",
  "pages/admin/AdminDashboard.js",
  "pages/admin/AdminOrders.js",
  "pages/admin/Users.js",

  "components/Form/CategoryForm.js",
  "pages/admin/CreateCategory.js",
  "pages/admin/CreateProduct.js",
  "pages/admin/UpdateProduct.js",
  "pages/admin/Products.js",

  "components/UserMenu.js",
  "pages/user/Dashboard.js",
  "pages/user/Orders.js",
  "pages/user/Profile.js",

  "components/Form/SearchInput.js",
  "context/search.js",
  "pages/Search.js",

  "pages/ProductDetails.js",
  "pages/CategoryProduct.js",
  "hooks/useCategory.js",
  "pages/Categories.js",

  "context/cart.js",
  "pages/CartPage.js",

  "components/Footer.js",
  "components/Header.js",
  "components/Layout.js",
  "components/Spinner.js",
  "pages/About.js",
  "pages/Pagenotfound.js",
  "pages/Homepage.js",
  "pages/Contact.js",
  "pages/Policy.js",
  ],

  coverageThreshold: {
    global: {
      lines: 70,
      functions: 70,
    },
  },

  setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],
};