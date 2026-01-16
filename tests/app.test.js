// Mock class-class sebelum require app.js
jest.mock('../src/utils/EnhancedStorageManager');
jest.mock('../src/repositories/UserRepository');
jest.mock('../src/repositories/TaskRepository');
jest.mock('../src/controllers/UserController');
jest.mock('../src/controllers/TaskController');
jest.mock('../src/views/TaskView');

const { initializeApp, app } = require('../src/app');

describe('App Entry Point', () => {
    beforeEach(() => {
        // Setup elemen DOM yang dibutuhin buat app.js
        document.body.innerHTML = `
            <div id="loginSection"></div>
            <div id="userInfo"></div>
            <div id="mainContent"></div>
            <button id="loginBtn"></button>
            <input id="usernameInput">
            <div id="messages"></div>
        `;
        jest.clearAllMocks();
    });

    test('initializeApp should instantiate all components', () => {
        initializeApp();

        expect(app.storage).toBeDefined();
        expect(app.userRepository).toBeDefined();
        expect(app.taskRepository).toBeDefined();
        expect(app.userController).toBeDefined();
        expect(app.taskController).toBeDefined();
        expect(app.taskView).toBeDefined();
    });
    
    // Catatan: app.js punya banyak event binding DOM yang susah buat di-cover full
    // tanpa simulasi kompleks, tapi test ini mastiin glue code jalan tanpa crash.
});