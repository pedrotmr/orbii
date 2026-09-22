module.exports = {
  preset: "jest-expo",
  testMatch: ["<rootDir>/tests/**/*.test.tsx"],
  setupFilesAfterEnv: ["<rootDir>/tests/support/setup.ts"],
  clearMocks: true,
  passWithNoTests: false,
  transformIgnorePatterns: [
    "node_modules/(?!(.pnpm|(jest-)?react-native|@react-native(-community)?|expo|@expo|@react-navigation|react-native-svg|phosphor-react-native))",
  ],
};
