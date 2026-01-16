// Import dependencies
const TestDataFactory = require('../helpers/TestDataFactory');
const TestAssertions = require('../helpers/TestAssertions');

// Import class yang akan di-test
const User = require('../../src/models/User');

describe('User Model', () => {
    describe('User Creation', () => {
        test('should create user with valid data', () => {
            // Arrange (Persiapan)
            const userData = TestDataFactory.createValidUserData();
            
            // Act (Aksi yang di-test)
            const user = new User(userData.username, userData.email, userData.fullName);
            
            // Assert (Verifikasi hasil)
            expect(user.username).toBe(userData.username);
            expect(user.email).toBe(userData.email);
            expect(user.fullName).toBe(userData.fullName);
            expect(user.isActive).toBe(true);
            TestAssertions.assertUserHasRequiredProperties(user);
        });
        
        test('should throw error when username is empty', () => {
            // Arrange
            const userData = TestDataFactory.createValidUserData({ username: '' });
            
            // Act & Assert
            expect(() => {
                new User(userData.username, userData.email, userData.fullName);
            }).toThrow('Username wajib diisi');
        });
        
        test('should throw error when email is invalid', () => {
            // Arrange
            const userData = TestDataFactory.createValidUserData({ email: 'invalid-email' });
            
            // Act & Assert
            expect(() => {
                new User(userData.username, userData.email, userData.fullName);
            }).toThrow('Email tidak valid');
        });
        
        test('should generate unique ID for each user', () => {
            // Arrange
            const userData1 = TestDataFactory.createValidUserData({ username: 'user1' });
            const userData2 = TestDataFactory.createValidUserData({ username: 'user2' });
            
            // Act
            const user1 = new User(userData1.username, userData1.email, userData1.fullName);
            const user2 = new User(userData2.username, userData2.email, userData2.fullName);
            
            // Assert
            expect(user1.id).toBeDefined();
            expect(user2.id).toBeDefined();
            expect(user1.id).not.toBe(user2.id);
        });
    });
    
    describe('User Methods', () => {
        let user;
        
        beforeEach(() => {
            // Setup yang dijalankan sebelum setiap test
            const userData = TestDataFactory.createValidUserData();
            user = new User(userData.username, userData.email, userData.fullName);
        });
        
        test('should update profile successfully', () => {
            // Arrange
            const newFullName = 'Updated Name';
            const newEmail = 'updated@example.com';
            
            // Act
            user.updateProfile(newFullName, newEmail);
            
            // Assert
            expect(user.fullName).toBe(newFullName);
            expect(user.email).toBe(newEmail);
        });
        
        test('should record login time', () => {
            // Arrange
            const beforeLogin = new Date();
            
            // Act
            user.recordLogin();
            
            // Assert
            expect(user.lastLoginAt).toBeDefined();
            expect(user.lastLoginAt).toBeInstanceOf(Date);
            expect(user.lastLoginAt.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
        });
        
        test('should deactivate user', () => {
            // Act
            user.deactivate();
            
            // Assert
            expect(user.isActive).toBe(false);
        });
        
        test('should activate user', () => {
            // Arrange
            user.deactivate(); // First deactivate
            
            // Act
            user.activate();
            
            // Assert
            expect(user.isActive).toBe(true);
        });
    });
    
    describe('User Serialization', () => {
        test('should convert to JSON correctly', () => {
            // Arrange
            const userData = TestDataFactory.createValidUserData();
            const user = new User(userData.username, userData.email, userData.fullName);
            
            // Act
            const json = user.toJSON();
            
            // Assert
            expect(json).toHaveProperty('id', user.id);
            expect(json).toHaveProperty('username', user.username);
            expect(json).toHaveProperty('email', user.email);
            expect(json).toHaveProperty('fullName', user.fullName);
            expect(json).toHaveProperty('isActive', user.isActive);
            expect(json).toHaveProperty('createdAt');
        });
        
        test('should create user from JSON correctly', () => {
            // Arrange
            const originalUser = new User('testuser', 'test@example.com', 'Test User');
            const json = originalUser.toJSON();
            
            // Act
            const restoredUser = User.fromJSON(json);
            
            // Assert
            expect(restoredUser.id).toBe(originalUser.id);
            expect(restoredUser.username).toBe(originalUser.username);
            expect(restoredUser.email).toBe(originalUser.email);
            expect(restoredUser.fullName).toBe(originalUser.fullName);
            expect(restoredUser.isActive).toBe(originalUser.isActive);
        });
        
        test('should restore lastLoginAt from JSON', () => {
            // Arrange
            const originalUser = new User('testuser', 'test@example.com', 'Test User');
            originalUser.recordLogin();
            const json = originalUser.toJSON();
            
            // Act
            const restoredUser = User.fromJSON(json);
            
            // Assert
            expect(restoredUser.lastLoginAt).toBeInstanceOf(Date);
        });
        
        test('should handle fromJSON with missing optional preferences', () => {
            // Arrange
            const json = {
                id: 'user_123',
                username: 'testuser',
                email: 'test@example.com',
                fullName: 'Test User',
                role: 'user',
                isActive: true,
                createdAt: new Date().toISOString(),
                lastLoginAt: null
                // preferences intentionally omitted
            };
            
            // Act
            const restoredUser = User.fromJSON(json);
            
            // Assert
            expect(restoredUser.preferences).toBeDefined();
            expect(restoredUser.preferences).toHaveProperty('theme');
        });
    });
    
    describe('User Preferences', () => {
        let user;
        
        beforeEach(() => {
            const userData = TestDataFactory.createValidUserData();
            user = new User(userData.username, userData.email, userData.fullName);
        });
        
        test('should have default preferences', () => {
            // Assert
            expect(user.preferences).toBeDefined();
            expect(user.preferences.theme).toBe('light');
            expect(user.preferences.defaultCategory).toBe('personal');
            expect(user.preferences.emailNotifications).toBe(true);
        });
        
        test('should update preferences successfully', () => {
            // Arrange
            const newPreferences = { theme: 'dark' };
            
            // Act
            user.updatePreferences(newPreferences);
            
            // Assert
            expect(user.preferences.theme).toBe('dark');
            // Other preferences should remain unchanged
            expect(user.preferences.defaultCategory).toBe('personal');
            expect(user.preferences.emailNotifications).toBe(true);
        });
        
        test('should merge multiple preferences', () => {
            // Act
            user.updatePreferences({ theme: 'dark', emailNotifications: false });
            
            // Assert
            expect(user.preferences.theme).toBe('dark');
            expect(user.preferences.emailNotifications).toBe(false);
            expect(user.preferences.defaultCategory).toBe('personal');
        });
        
        test('preferences getter should return a copy', () => {
            // Arrange
            const prefs = user.preferences;
            
            // Act - try to modify the returned object
            prefs.theme = 'hacked';
            
            // Assert - original should not be modified
            expect(user.preferences.theme).toBe('light');
        });
    });
    
    describe('User Validation Edge Cases', () => {
        test('should throw error for null username', () => {
            // Act & Assert
            expect(() => {
                new User(null, 'test@example.com', 'Test User');
            }).toThrow('Username wajib diisi');
        });
        
        test('should normalize username to lowercase', () => {
            // Act
            const user = new User('TestUser', 'test@example.com', 'Test User');
            
            // Assert
            expect(user.username).toBe('testuser');
        });
        
        test('should normalize email to lowercase', () => {
            // Act
            const user = new User('testuser', 'TEST@EXAMPLE.COM', 'Test User');
            
            // Assert
            expect(user.email).toBe('test@example.com');
        });
        
        test('should handle empty fullName', () => {
            // Act
            const user = new User('testuser', 'test@example.com');
            
            // Assert
            expect(user.fullName).toBe('');
        });
        
        test('should trim whitespace from inputs', () => {
            // Act
            const user = new User('  testuser  ', '  test@example.com  ', '  Test User  ');
            
            // Assert
            expect(user.username).toBe('testuser');
            expect(user.email).toBe('test@example.com');
            expect(user.fullName).toBe('Test User');
        });
        
        test('should reject email without @ symbol', () => {
            // Act & Assert
            expect(() => {
                new User('testuser', 'invalidemail', 'Test User');
            }).toThrow('Email tidak valid');
        });
        
        test('should reject email without domain', () => {
            // Act & Assert
            expect(() => {
                new User('testuser', 'test@', 'Test User');
            }).toThrow('Email tidak valid');
        });
        
        test('should updateProfile with valid email only', () => {
            // Arrange
            const user = new User('testuser', 'test@example.com', 'Test User');
            
            // Act
            user.updateProfile(null, 'new@example.com');
            
            // Assert
            expect(user.email).toBe('new@example.com');
            expect(user.fullName).toBe('Test User'); // unchanged
        });
        
        test('should updateProfile with valid fullName only', () => {
            // Arrange
            const user = new User('testuser', 'test@example.com', 'Test User');
            
            // Act
            user.updateProfile('New Name', null);
            
            // Assert
            expect(user.fullName).toBe('New Name');
            expect(user.email).toBe('test@example.com'); // unchanged
        });
    });
});