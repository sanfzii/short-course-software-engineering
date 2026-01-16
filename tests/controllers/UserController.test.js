const UserController = require('../../src/controllers/UserController');

// Mock dependencies buat testing
const mockUserRepository = {
    create: jest.fn(),
    findByUsername: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    findActive: jest.fn(),
    search: jest.fn(),
    recordLogin: jest.fn()
};

describe('UserController', () => {
    let userController;
    let mockUser;

    beforeEach(() => {
        jest.clearAllMocks();
        userController = new UserController(mockUserRepository);
        
        mockUser = {
            id: 'user-123',
            username: 'testuser',
            email: 'test@example.com',
            fullName: 'Test User',
            role: 'user',
            isActive: true,
            preferences: { theme: 'light' },
            lastLoginAt: new Date(),
            createdAt: new Date()
        };
        
        // Mock objek global app buat fallback fitur Day 4
        global.app = { 
            taskRepository: {
                findByOwner: jest.fn().mockReturnValue([])
            } 
        };
    });

    describe('register', () => {
        test('should register a new user successfully', () => {
            const userData = { username: 'newuser', email: 'new@example.com', fullName: 'New User' };
            mockUserRepository.create.mockReturnValue({ ...userData, id: 'new-id' });

            const response = userController.register(userData);

            expect(response.success).toBe(true);
            expect(response.data.username).toBe('newuser');
            expect(response.message).toContain('berhasil didaftarkan');
        });

        test('should fail validation when username is empty', () => {
            const response = userController.register({});
            expect(response.success).toBe(false);
            expect(response.error).toBe('Username wajib diisi');
        });

        test('should fail validation when email is empty', () => {
            const response = userController.register({ username: 'test' });
            expect(response.success).toBe(false);
            expect(response.error).toBe('Email wajib diisi');
        });

        test('should fail when username is only whitespace', () => {
            const response = userController.register({ username: '   ', email: 'test@test.com' });
            expect(response.success).toBe(false);
            expect(response.error).toBe('Username wajib diisi');
        });

        test('should fail when email is only whitespace', () => {
            const response = userController.register({ username: 'test', email: '   ' });
            expect(response.success).toBe(false);
            expect(response.error).toBe('Email wajib diisi');
        });

        test('should handle repository errors', () => {
            mockUserRepository.create.mockImplementation(() => {
                throw new Error('Database error');
            });
            
            const response = userController.register({ username: 'test', email: 'test@test.com' });
            expect(response.success).toBe(false);
            expect(response.error).toBe('Database error');
        });
    });

    describe('login', () => {
        test('should login successfully', () => {
            mockUserRepository.findByUsername.mockReturnValue(mockUser);
            const response = userController.login('testuser');
            expect(response.success).toBe(true);
            expect(userController.currentUser).toEqual(mockUser);
            expect(response.message).toContain('Selamat datang');
        });

        test('should fail if user not found', () => {
            mockUserRepository.findByUsername.mockReturnValue(null);
            const response = userController.login('unknown');
            expect(response.success).toBe(false);
            expect(response.error).toBe('User tidak ditemukan');
        });

        test('should fail if username is empty', () => {
            const response = userController.login('');
            expect(response.success).toBe(false);
            expect(response.error).toBe('Username wajib diisi');
        });

        test('should fail if username is only whitespace', () => {
            const response = userController.login('   ');
            expect(response.success).toBe(false);
            expect(response.error).toBe('Username wajib diisi');
        });

        test('should fail if user is inactive', () => {
            const inactiveUser = { ...mockUser, isActive: false };
            mockUserRepository.findByUsername.mockReturnValue(inactiveUser);
            
            const response = userController.login('testuser');
            expect(response.success).toBe(false);
            expect(response.error).toBe('Akun tidak aktif');
        });

        test('should record login timestamp', () => {
            mockUserRepository.findByUsername.mockReturnValue(mockUser);
            userController.login('testuser');
            expect(mockUserRepository.recordLogin).toHaveBeenCalledWith(mockUser.id);
        });

        test('should handle repository errors', () => {
            mockUserRepository.findByUsername.mockImplementation(() => {
                throw new Error('Connection failed');
            });
            
            const response = userController.login('testuser');
            expect(response.success).toBe(false);
            expect(response.error).toBe('Connection failed');
        });
    });

    describe('logout', () => {
        test('should clear current user', () => {
            userController.currentUser = mockUser;
            const response = userController.logout();
            expect(response.success).toBe(true);
            expect(userController.currentUser).toBeNull();
            expect(response.message).toContain('berhasil logout');
        });

        test('should work when no user is logged in', () => {
            userController.currentUser = null;
            const response = userController.logout();
            expect(response.success).toBe(true);
            expect(response.message).toContain('User berhasil logout');
        });
    });

    describe('getCurrentUser', () => {
        test('should return current user data', () => {
            userController.currentUser = mockUser;
            const response = userController.getCurrentUser();
            expect(response.success).toBe(true);
            expect(response.data.username).toBe('testuser');
            expect(response.data.email).toBe('test@example.com');
        });

        test('should fail when not logged in', () => {
            userController.currentUser = null;
            const response = userController.getCurrentUser();
            expect(response.success).toBe(false);
            expect(response.error).toBe('Tidak ada user yang login');
        });
    });

    describe('updateProfile', () => {
        test('should update profile successfully', () => {
            userController.currentUser = mockUser;
            const updatedUser = { ...mockUser, fullName: 'Updated Name' };
            mockUserRepository.update.mockReturnValue(updatedUser);
            
            const response = userController.updateProfile({ fullName: 'Updated Name' });
            expect(response.success).toBe(true);
            expect(response.data.fullName).toBe('Updated Name');
            expect(response.message).toBe('Profile berhasil diupdate');
        });

        test('should fail when not logged in', () => {
            userController.currentUser = null;
            const response = userController.updateProfile({ fullName: 'New Name' });
            expect(response.success).toBe(false);
            expect(response.error).toBe('User harus login terlebih dahulu');
        });

        test('should fail when update returns null', () => {
            userController.currentUser = mockUser;
            mockUserRepository.update.mockReturnValue(null);
            
            const response = userController.updateProfile({ fullName: 'New Name' });
            expect(response.success).toBe(false);
            expect(response.error).toBe('Gagal mengupdate profile');
        });

        test('should handle repository errors', () => {
            userController.currentUser = mockUser;
            mockUserRepository.update.mockImplementation(() => {
                throw new Error('Update failed');
            });
            
            const response = userController.updateProfile({ fullName: 'New Name' });
            expect(response.success).toBe(false);
            expect(response.error).toBe('Update failed');
        });
    });

    describe('updatePreferences', () => {
        test('should update preferences successfully', () => {
            userController.currentUser = mockUser;
            const updatedUser = { ...mockUser, preferences: { theme: 'dark' } };
            mockUserRepository.update.mockReturnValue(updatedUser);
            
            const response = userController.updatePreferences({ theme: 'dark' });
            expect(response.success).toBe(true);
            expect(response.message).toBe('Preferences berhasil diupdate');
        });

        test('should fail when not logged in', () => {
            userController.currentUser = null;
            const response = userController.updatePreferences({ theme: 'dark' });
            expect(response.success).toBe(false);
            expect(response.error).toBe('User harus login terlebih dahulu');
        });

        test('should fail when update returns null', () => {
            userController.currentUser = mockUser;
            mockUserRepository.update.mockReturnValue(null);
            
            const response = userController.updatePreferences({ theme: 'dark' });
            expect(response.success).toBe(false);
            expect(response.error).toBe('Gagal mengupdate preferences');
        });

        test('should handle repository errors', () => {
            userController.currentUser = mockUser;
            mockUserRepository.update.mockImplementation(() => {
                throw new Error('Preferences update failed');
            });
            
            const response = userController.updatePreferences({ theme: 'dark' });
            expect(response.success).toBe(false);
            expect(response.error).toBe('Preferences update failed');
        });
    });

    describe('getAllUsers', () => {
        test('should return all active users', () => {
            userController.currentUser = mockUser;
            const users = [
                { id: '1', username: 'user1', fullName: 'User One' },
                { id: '2', username: 'user2', fullName: 'User Two' }
            ];
            mockUserRepository.findActive.mockReturnValue(users);
            
            const response = userController.getAllUsers();
            expect(response.success).toBe(true);
            expect(response.data).toHaveLength(2);
            expect(response.count).toBe(2);
        });

        test('should fail when not logged in', () => {
            userController.currentUser = null;
            const response = userController.getAllUsers();
            expect(response.success).toBe(false);
            expect(response.error).toBe('User harus login terlebih dahulu');
        });

        test('should handle repository errors', () => {
            userController.currentUser = mockUser;
            mockUserRepository.findActive.mockImplementation(() => {
                throw new Error('Query failed');
            });
            
            const response = userController.getAllUsers();
            expect(response.success).toBe(false);
            expect(response.error).toBe('Query failed');
        });
    });

    describe('searchUsers', () => {
        test('should search users successfully', () => {
            userController.currentUser = mockUser;
            const users = [
                { id: '1', username: 'john', fullName: 'John Doe', isActive: true }
            ];
            mockUserRepository.search.mockReturnValue(users);
            
            const response = userController.searchUsers('john');
            expect(response.success).toBe(true);
            expect(response.data).toHaveLength(1);
            expect(response.query).toBe('john');
        });

        test('should filter out inactive users', () => {
            userController.currentUser = mockUser;
            const users = [
                { id: '1', username: 'john', fullName: 'John Doe', isActive: true },
                { id: '2', username: 'jane', fullName: 'Jane Doe', isActive: false }
            ];
            mockUserRepository.search.mockReturnValue(users);
            
            const response = userController.searchUsers('doe');
            expect(response.success).toBe(true);
            expect(response.data).toHaveLength(1);
            expect(response.data[0].username).toBe('john');
        });

        test('should fail when not logged in', () => {
            userController.currentUser = null;
            const response = userController.searchUsers('john');
            expect(response.success).toBe(false);
            expect(response.error).toBe('User harus login terlebih dahulu');
        });

        test('should fail when query is empty', () => {
            userController.currentUser = mockUser;
            const response = userController.searchUsers('');
            expect(response.success).toBe(false);
            expect(response.error).toBe('Query pencarian tidak boleh kosong');
        });

        test('should fail when query is only whitespace', () => {
            userController.currentUser = mockUser;
            const response = userController.searchUsers('   ');
            expect(response.success).toBe(false);
            expect(response.error).toBe('Query pencarian tidak boleh kosong');
        });

        test('should handle repository errors', () => {
            userController.currentUser = mockUser;
            mockUserRepository.search.mockImplementation(() => {
                throw new Error('Search failed');
            });
            
            const response = userController.searchUsers('john');
            expect(response.success).toBe(false);
            expect(response.error).toBe('Search failed');
        });
    });

    describe('isLoggedIn', () => {
        test('should return true when user is logged in', () => {
            userController.currentUser = mockUser;
            expect(userController.isLoggedIn()).toBe(true);
        });

        test('should return false when user is not logged in', () => {
            userController.currentUser = null;
            expect(userController.isLoggedIn()).toBe(false);
        });
    });

    describe('getUserById', () => {
        test('should return user by ID', () => {
            mockUserRepository.findById.mockReturnValue(mockUser);
            
            const response = userController.getUserById('user-123');
            expect(response.success).toBe(true);
            expect(response.data.id).toBe('user-123');
            expect(response.data.username).toBe('testuser');
        });

        test('should fail when user not found', () => {
            mockUserRepository.findById.mockReturnValue(null);
            
            const response = userController.getUserById('non-existent');
            expect(response.success).toBe(false);
            expect(response.error).toBe('User tidak ditemukan');
        });

        test('should handle repository errors', () => {
            mockUserRepository.findById.mockImplementation(() => {
                throw new Error('Find failed');
            });
            
            const response = userController.getUserById('user-123');
            expect(response.success).toBe(false);
            expect(response.error).toBe('Find failed');
        });
    });

    describe('getUserProfile', () => {
        test('should return user profile with stats', () => {
            userController.currentUser = mockUser;
            
            const response = userController.getUserProfile();
            expect(response.success).toBe(true);
            expect(response.data.user.username).toBe('testuser');
            expect(response.data.statistics).toBeDefined();
            expect(response.data.statistics.totalTasks).toBe(0);
        });

        test('should fail when not logged in', () => {
            userController.currentUser = null;
            const response = userController.getUserProfile();
            expect(response.success).toBe(false);
            expect(response.error).toBe('User harus login terlebih dahulu');
        });

        test('should compute task statistics correctly', () => {
            userController.currentUser = mockUser;
            
            const mockTasks = [
                { isCompleted: true, isOverdue: false, category: 'work' },
                { isCompleted: false, isOverdue: true, category: 'personal' },
                { isCompleted: false, isOverdue: false, category: 'work' }
            ];
            global.app.taskRepository.findByOwner.mockReturnValue(mockTasks);
            
            const response = userController.getUserProfile();
            expect(response.success).toBe(true);
            expect(response.data.statistics.totalTasks).toBe(3);
            expect(response.data.statistics.completedTasks).toBe(1);
            expect(response.data.statistics.pendingTasks).toBe(2);
            expect(response.data.statistics.overdueTasks).toBe(1);
            expect(response.data.statistics.completionRate).toBe(33);
            expect(response.data.statistics.tasksByCategory.work).toBe(2);
            expect(response.data.statistics.tasksByCategory.personal).toBe(1);
        });

        test('should use this.taskRepository if available', () => {
            userController.currentUser = mockUser;
            userController.taskRepository = {
                findByOwner: jest.fn().mockReturnValue([{ isCompleted: true, isOverdue: false, category: 'study' }])
            };
            
            const response = userController.getUserProfile();
            expect(response.success).toBe(true);
            expect(response.data.statistics.totalTasks).toBe(1);
            expect(userController.taskRepository.findByOwner).toHaveBeenCalledWith(mockUser.id);
        });

        test('should handle errors gracefully', () => {
            userController.currentUser = mockUser;
            global.app.taskRepository.findByOwner.mockImplementation(() => {
                throw new Error('Task fetch failed');
            });
            
            const response = userController.getUserProfile();
            expect(response.success).toBe(false);
            expect(response.error).toBe('Task fetch failed');
        });
    });

    describe('updateUserPreferences (Day 4)', () => {
        test('should update preferences successfully', () => {
            userController.currentUser = mockUser;
            const newPrefs = { theme: 'dark' };
            mockUserRepository.update.mockReturnValue({ ...mockUser, preferences: newPrefs });
            
            const response = userController.updateUserPreferences(newPrefs);
            expect(response.success).toBe(true);
            expect(response.message).toBe('Preferences berhasil diupdate');
        });

        test('should fail when not logged in', () => {
            userController.currentUser = null;
            const response = userController.updateUserPreferences({ theme: 'dark' });
            expect(response.success).toBe(false);
            expect(response.error).toBe('User harus login terlebih dahulu');
        });

        test('should reject invalid preference keys', () => {
            userController.currentUser = mockUser;
            const response = userController.updateUserPreferences({ invalidKey: 'value' });
            expect(response.success).toBe(false);
            expect(response.error).toContain('Invalid preference keys');
        });

        test('should accept valid preference keys', () => {
            userController.currentUser = mockUser;
            const validPrefs = { 
                theme: 'dark', 
                defaultCategory: 'work',
                emailNotifications: false,
                language: 'id'
            };
            mockUserRepository.update.mockReturnValue({ ...mockUser, preferences: validPrefs });
            
            const response = userController.updateUserPreferences(validPrefs);
            expect(response.success).toBe(true);
        });

        test('should fail when update returns null', () => {
            userController.currentUser = mockUser;
            mockUserRepository.update.mockReturnValue(null);
            
            const response = userController.updateUserPreferences({ theme: 'dark' });
            expect(response.success).toBe(false);
            expect(response.error).toBe('Gagal mengupdate preferences');
        });

        test('should handle repository errors', () => {
            userController.currentUser = mockUser;
            mockUserRepository.update.mockImplementation(() => {
                throw new Error('Update error');
            });
            
            const response = userController.updateUserPreferences({ theme: 'dark' });
            expect(response.success).toBe(false);
            expect(response.error).toBe('Update error');
        });
    });
});