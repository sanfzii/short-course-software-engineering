/* eslint-disable no-unused-vars */
// PASTIKAN KODE DI src/models/Task.js SUDAH DI-UNCOMMENT!
const { Task, TaskError, TaskValidationError } = require('../../src/models/Task');

describe('Task Model (Day 1)', () => {
    describe('Constructor', () => {
        test('should create valid task', () => {
            const task = new Task('Test Title', 'Desc', 'high');
            expect(task.title).toBe('Test Title');
            expect(task.priority).toBe('high');
            expect(task.id).toBeDefined();
            expect(task.createdAt).toBeInstanceOf(Date);
        });

        test('should throw error for invalid title', () => {
            expect(() => new Task('')).toThrow(TaskValidationError);
            expect(() => new Task(123)).toThrow(TaskValidationError);
        });

        test('should throw error for null title', () => {
            expect(() => new Task(null)).toThrow(TaskValidationError);
        });

        test('should throw error for whitespace only title', () => {
            expect(() => new Task('   ')).toThrow(TaskValidationError);
        });

        test('should set default priority', () => {
            const task = new Task('Title', 'Desc');
            expect(task.priority).toBe('medium');
        });

        test('should trim title', () => {
            const task = new Task('  Trimmed Title  ', 'Desc');
            expect(task.title).toBe('Trimmed Title');
        });

        test('should handle undefined description', () => {
            const task = new Task('Title', undefined);
            expect(task.description).toBe('');
        });

        test('should throw error for non-string description', () => {
            expect(() => new Task('Title', 123)).toThrow(TaskValidationError);
        });

        test('should throw error for invalid priority type', () => {
            expect(() => new Task('Title', 'Desc', 123)).toThrow(TaskValidationError);
        });

        test('should throw error for invalid priority value', () => {
            expect(() => new Task('Title', 'Desc', 'critical')).toThrow(TaskValidationError);
        });

        test('should accept priority in different cases', () => {
            const task1 = new Task('Title', 'Desc', 'HIGH');
            expect(task1.priority).toBe('high');
            
            const task2 = new Task('Title', 'Desc', 'Low');
            expect(task2.priority).toBe('low');
        });
    });

    describe('Getters', () => {
        let task;
        beforeEach(() => {
            task = new Task('Title', 'Description', 'medium');
        });

        test('should return id', () => {
            expect(task.id).toMatch(/^task_/);
        });

        test('should return description', () => {
            expect(task.description).toBe('Description');
        });

        test('should return completed status', () => {
            expect(task.completed).toBe(false);
        });

        test('should return updatedAt', () => {
            expect(task.updatedAt).toBeInstanceOf(Date);
        });
    });

    describe('markComplete', () => {
        let task;
        let consoleSpy;
        
        beforeEach(() => {
            task = new Task('Title', 'Desc');
            consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        });
        
        afterEach(() => {
            consoleSpy.mockRestore();
        });

        test('should mark task as complete', () => {
            task.markComplete();
            expect(task.completed).toBe(true);
        });

        test('should update timestamp when marking complete', () => {
            const beforeUpdate = new Date(task.updatedAt);
            // Small delay to ensure different timestamp
            task.markComplete();
            expect(task.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
        });

        test('should warn when already completed', () => {
            task.markComplete();
            task.markComplete(); // Second call should warn
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe('markIncomplete', () => {
        let task;
        let consoleSpy;
        
        beforeEach(() => {
            task = new Task('Title', 'Desc');
            consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        });
        
        afterEach(() => {
            consoleSpy.mockRestore();
        });

        test('should mark task as incomplete', () => {
            task.markComplete();
            task.markIncomplete();
            expect(task.completed).toBe(false);
        });

        test('should warn when already incomplete', () => {
            task.markIncomplete(); // Already incomplete
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe('updateTitle', () => {
        let task;
        beforeEach(() => {
            task = new Task('Title', 'Desc');
        });

        test('should update title', () => {
            task.updateTitle('New Title');
            expect(task.title).toBe('New Title');
        });

        test('should throw error for empty title', () => {
            expect(() => task.updateTitle('')).toThrow(TaskValidationError);
        });

        test('should throw error for null title', () => {
            expect(() => task.updateTitle(null)).toThrow(TaskValidationError);
        });

        test('should throw error for non-string title', () => {
            expect(() => task.updateTitle(123)).toThrow(TaskValidationError);
        });

        test('should throw error for title exceeding 200 characters', () => {
            const longTitle = 'a'.repeat(201);
            expect(() => task.updateTitle(longTitle)).toThrow(TaskValidationError);
        });

        test('should accept title of exactly 200 characters', () => {
            const title200 = 'a'.repeat(200);
            task.updateTitle(title200);
            expect(task.title).toBe(title200);
        });

        test('should trim updated title', () => {
            task.updateTitle('  Trimmed  ');
            expect(task.title).toBe('Trimmed');
        });
    });

    describe('updateDescription', () => {
        let task;
        beforeEach(() => {
            task = new Task('Title', 'Original Description');
        });

        test('should update description', () => {
            task.updateDescription('New Description');
            expect(task.description).toBe('New Description');
        });

        test('should allow empty string description', () => {
            task.updateDescription('');
            expect(task.description).toBe('');
        });

        test('should allow undefined description', () => {
            task.updateDescription(undefined);
            expect(task.description).toBe('');
        });

        test('should throw error for non-string description', () => {
            expect(() => task.updateDescription(123)).toThrow(TaskValidationError);
        });

        test('should throw error for description exceeding 1000 characters', () => {
            const longDesc = 'a'.repeat(1001);
            expect(() => task.updateDescription(longDesc)).toThrow(TaskValidationError);
        });

        test('should accept description of exactly 1000 characters', () => {
            const desc1000 = 'a'.repeat(1000);
            task.updateDescription(desc1000);
            expect(task.description).toBe(desc1000);
        });

        test('should trim updated description', () => {
            task.updateDescription('  Trimmed Description  ');
            expect(task.description).toBe('Trimmed Description');
        });
    });

    describe('updatePriority', () => {
        let task;
        beforeEach(() => {
            task = new Task('Title', 'Desc');
        });

        test('should update priority to high', () => {
            task.updatePriority('high');
            expect(task.priority).toBe('high');
        });

        test('should update priority to low', () => {
            task.updatePriority('low');
            expect(task.priority).toBe('low');
        });

        test('should throw error for invalid priority', () => {
            expect(() => task.updatePriority('invalid')).toThrow(TaskValidationError);
        });

        test('should throw error for non-string priority', () => {
            expect(() => task.updatePriority(123)).toThrow(TaskValidationError);
        });

        test('should accept priority with different casing', () => {
            task.updatePriority('HIGH');
            expect(task.priority).toBe('high');
        });

        test('should trim priority', () => {
            task.updatePriority('  low  ');
            expect(task.priority).toBe('low');
        });
    });

    describe('toJSON', () => {
        test('should return plain object', () => {
            const task = new Task('Title', 'Desc', 'high');
            const json = task.toJSON();
            
            expect(json.title).toBe('Title');
            expect(json.description).toBe('Desc');
            expect(json.priority).toBe('high');
            expect(json.completed).toBe(false);
            expect(json.id).toBe(task.id);
            expect(typeof json.createdAt).toBe('string');
            expect(typeof json.updatedAt).toBe('string');
        });

        test('should serialize dates as ISO strings', () => {
            const task = new Task('Title', 'Desc');
            const json = task.toJSON();
            
            expect(json.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
            expect(json.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        });
    });

    describe('Static Methods - fromJSON', () => {
        test('should reconstruct task from JSON', () => {
            const data = {
                title: 'Reconstructed',
                description: 'Desc',
                priority: 'low',
                completed: true,
                createdAt: new Date().toISOString()
            };
            const task = Task.fromJSON(data);
            expect(task.title).toBe('Reconstructed');
            expect(task.completed).toBe(true);
        });

        test('should throw on empty data', () => {
            expect(() => Task.fromJSON({})).toThrow(TaskValidationError);
        });

        test('should throw on null data', () => {
            expect(() => Task.fromJSON(null)).toThrow(TaskValidationError);
        });

        test('should throw on non-object data', () => {
            expect(() => Task.fromJSON('string')).toThrow(TaskValidationError);
        });

        test('should restore id from data', () => {
            const data = {
                id: 'custom-id',
                title: 'Test',
                description: 'Desc'
            };
            const task = Task.fromJSON(data);
            expect(task.id).toBe('custom-id');
        });

        test('should generate new id if not provided', () => {
            const data = {
                title: 'Test',
                description: 'Desc'
            };
            const task = Task.fromJSON(data);
            expect(task.id).toMatch(/^task_/);
        });

        test('should restore completed status', () => {
            const data = {
                title: 'Test',
                completed: true
            };
            const task = Task.fromJSON(data);
            expect(task.completed).toBe(true);
        });

        test('should restore createdAt date', () => {
            const date = new Date('2024-01-01T00:00:00.000Z');
            const data = {
                title: 'Test',
                createdAt: date.toISOString()
            };
            const task = Task.fromJSON(data);
            expect(task.createdAt.toISOString()).toBe(date.toISOString());
        });

        test('should throw for invalid createdAt date', () => {
            const data = {
                title: 'Test',
                createdAt: 'invalid-date'
            };
            expect(() => Task.fromJSON(data)).toThrow(TaskValidationError);
        });

        test('should restore updatedAt date', () => {
            const date = new Date('2024-06-15T12:30:00.000Z');
            const data = {
                title: 'Test',
                updatedAt: date.toISOString()
            };
            const task = Task.fromJSON(data);
            expect(task.updatedAt.toISOString()).toBe(date.toISOString());
        });

        test('should throw for invalid updatedAt date', () => {
            const data = {
                title: 'Test',
                updatedAt: 'not-a-date'
            };
            expect(() => Task.fromJSON(data)).toThrow(TaskValidationError);
        });

        test('should use default priority if not provided', () => {
            const data = { title: 'Test' };
            const task = Task.fromJSON(data);
            expect(task.priority).toBe('medium');
        });
    });

    describe('Error Classes', () => {
        test('TaskError should have correct name', () => {
            const error = new TaskError('Test error');
            expect(error.name).toBe('TaskError');
        });

        test('TaskError should include original error stack', () => {
            const originalError = new Error('Original');
            const error = new TaskError('Wrapped error', originalError);
            expect(error.stack).toContain('Caused by:');
            expect(error.originalError).toBe(originalError);
        });

        test('TaskValidationError should extend TaskError', () => {
            const error = new TaskValidationError('Validation error');
            expect(error.name).toBe('TaskValidationError');
            expect(error).toBeInstanceOf(TaskError);
        });

        test('TaskValidationError should include original error', () => {
            const originalError = new Error('Original');
            const error = new TaskValidationError('Validation error', originalError);
            expect(error.originalError).toBe(originalError);
        });
    });
});