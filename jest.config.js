module.exports = {
    // Environment untuk testing (browser-like)
    testEnvironment: 'jsdom',
    
    // Pattern file test yang akan dijalankan
    testMatch: [
        '**/tests/**/*.test.js',
        '**/day3-testing/**/*.test.js'
    ],
    
    // Tests yang di-skip (karena source code-nya di-comment atau butuh setup kompleks)
    testPathIgnorePatterns: [
        '/node_modules/',
        '/tests/models/Task\\.test\\.js$',  // Task.js source is commented out
        '/tests/app\\.test\\.js$'  // app.js requires complex DOM setup
    ],
    
    // Setup coverage (laporan seberapa banyak kode yang di-test)
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'html'],
    
    // File mana saja yang akan di-cover
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/app.js',  // Entry point with browser-specific code
        '!src/models/Task.js',  // Commented out code
        '!src/utils/StorageManager.js',  // Commented out code
        '!src/services/UserService.js',  // Empty file (placeholder)
        '!src/views/UserView.js',  // Empty file (placeholder)
        '!src/**/*.test.js',
        '!**/node_modules/**'
    ],
    
    // Target coverage minimum (sesuai requirements)
    coverageThreshold: {
        global: {
            branches: 75,
            functions: 85,
            lines: 80,
            statements: 80
        }
    },
    
    // Output yang detail untuk pembelajaran
    verbose: true,
    
    // Clear mocks antar test
    clearMocks: true
};