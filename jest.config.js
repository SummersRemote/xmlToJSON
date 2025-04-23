
export default {
  testEnvironment: 'jsdom',
  verbose: true,
  setupFilesAfterEnv: [
    './test/helpers/customMatchers.js',
    './test/helpers/setupJest.js'
  ],
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: 'test_reports/html',
      filename: 'report.html',
      expand: true, // expands test case results
      includeFailureMsg: true,
      includeConsoleLog: true
    }]
  ]
};