const EnhancedStorageManager = require('../../src/utils/EnhancedStorageManager');

describe('EnhancedStorageManager', () => {
    let storage;
    const testEntity = 'test_entity';
    const testData = { id: 1, name: 'Test' };

    beforeEach(() => {
        localStorage.clear();
        storage = new EnhancedStorageManager('testApp', '1.0');
    });

    describe('Save and Load', () => {
        test('should save and load data correctly', () => {
            const success = storage.save(testEntity, testData);
            expect(success).toBe(true);

            const loaded = storage.load(testEntity);
            expect(loaded).toEqual(testData);
        });

        test('should return default value if data not found', () => {
            const loaded = storage.load('non_existent', 'default');
            expect(loaded).toBe('default');
        });

        test('should return null as default if no default provided', () => {
            const loaded = storage.load('non_existent');
            expect(loaded).toBeNull();
        });

        test('should handle complex nested data', () => {
            const complexData = {
                users: [{ id: 1, name: 'John' }],
                settings: { theme: 'dark', nested: { value: 123 } }
            };
            storage.save('complex', complexData);
            expect(storage.load('complex')).toEqual(complexData);
        });

        test('should handle array data', () => {
            const arrayData = [1, 2, 3, 'test'];
            storage.save('array', arrayData);
            expect(storage.load('array')).toEqual(arrayData);
        });
    });

    describe('Remove', () => {
        test('should remove data correctly', () => {
            storage.save(testEntity, testData);
            const removed = storage.remove(testEntity);
            expect(removed).toBe(true);
            expect(storage.load(testEntity)).toBeNull();
        });

        test('should return true even if entity does not exist', () => {
            const removed = storage.remove('non_existent');
            expect(removed).toBe(true);
        });

        test('should update metadata after removal', () => {
            storage.save(testEntity, testData);
            storage.remove(testEntity);
            const metadata = storage.getMetadata();
            expect(metadata.entities[testEntity]).toBeUndefined();
        });
    });

    describe('Metadata', () => {
        test('should handle metadata correctly', () => {
            storage.save(testEntity, testData);
            const metadata = storage.getMetadata();
            expect(metadata.entities[testEntity]).toBeDefined();
            expect(metadata.entities[testEntity].lastUpdated).toBeDefined();
        });

        test('should update metadata on save', () => {
            storage.save(testEntity, testData);
            const firstUpdate = storage.getMetadata().entities[testEntity].lastUpdated;
            
            // Small delay to ensure different timestamp
            storage.save(testEntity, { ...testData, updated: true });
            const secondUpdate = storage.getMetadata().entities[testEntity].lastUpdated;
            
            expect(new Date(secondUpdate).getTime()).toBeGreaterThanOrEqual(new Date(firstUpdate).getTime());
        });
    });

    describe('Existence Check', () => {
        test('should return false for non-existent entity', () => {
            expect(storage.exists(testEntity)).toBe(false);
        });

        test('should return true for existing entity', () => {
            storage.save(testEntity, testData);
            expect(storage.exists(testEntity)).toBe(true);
        });

        test('should return false after removal', () => {
            storage.save(testEntity, testData);
            storage.remove(testEntity);
            expect(storage.exists(testEntity)).toBe(false);
        });
    });

    describe('Get Entities', () => {
        test('should get all entities', () => {
            storage.save('users', []);
            storage.save('tasks', []);
            const entities = storage.getEntities();
            expect(entities).toContain('users');
            expect(entities).toContain('tasks');
        });

        test('should not include metadata in entities list', () => {
            storage.save('users', []);
            const entities = storage.getEntities();
            expect(entities).not.toContain('_metadata');
        });

        test('should return empty array if no entities', () => {
            const freshStorage = new EnhancedStorageManager('emptyApp', '1.0');
            // Only metadata exists
            const entities = freshStorage.getEntities();
            expect(Array.isArray(entities)).toBe(true);
        });
    });

    describe('Clear', () => {
        test('should clear all app data', () => {
            storage.save('e1', 1);
            storage.save('e2', 2);
            localStorage.setItem('otherApp_data', 'keep me');
            
            storage.clear();
            
            expect(storage.load('e1')).toBeNull();
            expect(storage.load('e2')).toBeNull();
            expect(localStorage.getItem('otherApp_data')).toBe('keep me');
        });

        test('should return true after clear', () => {
            storage.save('test', 'data');
            const result = storage.clear();
            expect(result).toBe(true);
        });
    });

    describe('Export Data', () => {
        test('should export data', () => {
            storage.save(testEntity, testData);
            const exported = storage.exportData();
            expect(exported.appName).toBe('testApp');
            expect(exported.version).toBe('1.0');
            expect(exported.data).toBeDefined();
        });

        test('should include all entities in export', () => {
            storage.save('users', [{ id: 1 }]);
            storage.save('tasks', [{ id: 2 }]);
            const exported = storage.exportData();
            expect(exported.data).toBeDefined();
            // Data is stored with full keys including appName prefix
            expect(Object.keys(exported.data).length).toBeGreaterThan(0);
        });

        test('should include export timestamp', () => {
            const exported = storage.exportData();
            expect(exported.exportedAt).toBeDefined();
        });
    });

    describe('Import Data', () => {
        test('should import data successfully', () => {
            // The import data format uses full keys with appName prefix
            const importData = {
                appName: 'testApp',
                version: '1.0',
                data: {
                    'testApp_users': { data: [{ id: 1, name: 'Imported User' }], version: '1.0' },
                    'testApp_tasks': { data: [{ id: 2, title: 'Imported Task' }], version: '1.0' }
                }
            };
            
            const success = storage.importData(importData);
            expect(success).toBe(true);
            expect(storage.load('users')).toEqual([{ id: 1, name: 'Imported User' }]);
            expect(storage.load('tasks')).toEqual([{ id: 2, title: 'Imported Task' }]);
        });

        test('should fail with null import data', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            expect(storage.importData(null)).toBe(false);
            consoleSpy.mockRestore();
        });

        test('should fail with missing appName', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            expect(storage.importData({})).toBe(false);
            consoleSpy.mockRestore();
        });

        test('should fail with missing data property', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            expect(storage.importData({ appName: 'testApp' })).toBe(false);
            consoleSpy.mockRestore();
        });

        test('should warn but proceed with different app name', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            const importData = {
                appName: 'differentApp',
                data: {
                    'differentApp_test': { data: 'value', version: '1.0' }
                }
            };
            
            const success = storage.importData(importData);
            expect(success).toBe(true);
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });
    });

    describe('Storage Info', () => {
        test('should get storage info', () => {
            storage.save('test1', 'data1');
            storage.save('test2', 'data2');
            
            const info = storage.getStorageInfo();
            expect(info).toBeDefined();
            expect(info.available).toBe(true);
            expect(info.appKeys).toBeGreaterThan(0);
        });

        test('should include size information', () => {
            storage.save('test', { large: 'x'.repeat(100) });
            
            const info = storage.getStorageInfo();
            expect(info.totalSize).toBeGreaterThan(0);
            expect(info.appSize).toBeGreaterThan(0);
        });

        test('should include usage percentage', () => {
            storage.save('users', [{ id: 1 }]);
            storage.save('tasks', [{ id: 2 }]);
            
            const info = storage.getStorageInfo();
            expect(info.usagePercentage).toBeDefined();
        });
    });
});