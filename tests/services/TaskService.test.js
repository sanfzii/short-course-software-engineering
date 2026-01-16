const TaskService = require('../../src/services/TaskService');

// Mock Task class karena Task.js sekarang dikomentarin (pake EnhancedTask di Day 4)
// Ini mock yang provide semua method yang diperluin TaskService
class MockTask {
    constructor(title, description, priority = 'medium') {
        if (!title || title.trim() === '') {
            throw new Error('Task title is required');
        }
        this._id = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        this._title = title.trim();
        this._description = description ? description.trim() : '';
        this._priority = this._validatePriority(priority);
        this._completed = false;
        this._createdAt = new Date();
        this._updatedAt = new Date();
    }
    
    get id() { return this._id; }
    get title() { return this._title; }
    get description() { return this._description; }
    get priority() { return this._priority; }
    get completed() { return this._completed; }
    get createdAt() { return this._createdAt; }
    get updatedAt() { return this._updatedAt; }
    
    markComplete() { this._completed = true; this._updatedAt = new Date(); }
    markIncomplete() { this._completed = false; this._updatedAt = new Date(); }
    
    updateTitle(newTitle) {
        if (!newTitle || newTitle.trim() === '') {
            throw new Error('Task title cannot be empty');
        }
        this._title = newTitle.trim();
        this._updatedAt = new Date();
    }
    
    updateDescription(newDesc) {
        this._description = newDesc ? newDesc.trim() : '';
        this._updatedAt = new Date();
    }
    
    updatePriority(newPriority) {
        this._priority = this._validatePriority(newPriority);
        this._updatedAt = new Date();
    }
    
    _validatePriority(priority) {
        const valid = ['low', 'medium', 'high'];
        const normalized = priority.toLowerCase().trim();
        if (!valid.includes(normalized)) {
            throw new Error(`Invalid priority: ${priority}`);
        }
        return normalized;
    }
    
    toJSON() {
        return {
            id: this._id,
            title: this._title,
            description: this._description,
            priority: this._priority,
            completed: this._completed,
            createdAt: this._createdAt.toISOString(),
            updatedAt: this._updatedAt.toISOString()
        };
    }
    
    static fromJSON(data) {
        if (!data || !data.title) {
            throw new Error('Invalid task data');
        }
        const task = new MockTask(data.title, data.description, data.priority || 'medium');
        if (data.id) task._id = data.id;
        if (typeof data.completed === 'boolean') task._completed = data.completed;
        if (data.createdAt) task._createdAt = new Date(data.createdAt);
        if (data.updatedAt) task._updatedAt = new Date(data.updatedAt);
        return task;
    }
}

// Alias untuk compat
const Task = MockTask;

describe('TaskService', () => {
    let taskService;
    let mockStorage;

    beforeEach(() => {
        // Set Task sebagai global supaya TaskService bisa akses
        global.Task = Task;
        
        // Mock storage manager
        mockStorage = {
            save: jest.fn(),
            load: jest.fn().mockReturnValue([])
        };
        taskService = new TaskService(mockStorage);
    });

    afterEach(() => {
        // Bersihkan global variable setelah test
        delete global.Task;
    });

    describe('Task Creation', () => {
        test('should create task', () => {
            const listener = jest.fn();
            taskService.addListener(listener);

            const task = taskService.createTask('Service Task', 'Desc', 'high');
            
            expect(task.title).toBe('Service Task');
            expect(taskService.tasks.size).toBe(1);
            expect(mockStorage.save).toHaveBeenCalled();
            expect(listener).toHaveBeenCalledWith('taskCreated', task);
        });

        test('should throw and log error for invalid task', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            expect(() => taskService.createTask('', 'Desc', 'medium')).toThrow();
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });
    });

    describe('Task Retrieval', () => {
        test('should get all tasks', () => {
            taskService.createTask('T1', '', 'high');
            taskService.createTask('T2', '', 'low');
            
            const tasks = taskService.getAllTasks();
            expect(tasks).toHaveLength(2);
        });

        test('should get task by ID', () => {
            const task = taskService.createTask('Test', 'Desc', 'medium');
            
            const found = taskService.getTaskById(task.id);
            expect(found.title).toBe('Test');
        });

        test('should return null for non-existent ID', () => {
            const found = taskService.getTaskById('non-existent');
            expect(found).toBeNull();
        });
    });

    describe('Task Updates', () => {
        test('should update task title', () => {
            const task = taskService.createTask('Original', 'Desc', 'medium');
            const updated = taskService.updateTask(task.id, { title: 'Updated' });
            
            expect(updated.title).toBe('Updated');
            expect(taskService.getTaskById(task.id).title).toBe('Updated');
        });

        test('should update task description', () => {
            const task = taskService.createTask('Title', 'Original Desc', 'medium');
            const updated = taskService.updateTask(task.id, { description: 'New Desc' });
            
            expect(updated.description).toBe('New Desc');
        });

        test('should update task priority', () => {
            const task = taskService.createTask('Title', 'Desc', 'low');
            const updated = taskService.updateTask(task.id, { priority: 'high' });
            
            expect(updated.priority).toBe('high');
        });

        test('should update task completed status to true', () => {
            const task = taskService.createTask('Title', 'Desc', 'medium');
            const updated = taskService.updateTask(task.id, { completed: true });
            
            expect(updated.completed).toBe(true);
        });

        test('should update task completed status to false', () => {
            const task = taskService.createTask('Title', 'Desc', 'medium');
            taskService.updateTask(task.id, { completed: true });
            const updated = taskService.updateTask(task.id, { completed: false });
            
            expect(updated.completed).toBe(false);
        });

        test('should return null when updating non-existent task', () => {
            const result = taskService.updateTask('non-existent', { title: 'Test' });
            expect(result).toBeNull();
        });

        test('should throw and log error for invalid update', () => {
            const task = taskService.createTask('Title', 'Desc', 'medium');
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            expect(() => taskService.updateTask(task.id, { title: '' })).toThrow();
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });

        test('should notify listeners on update', () => {
            const listener = jest.fn();
            const task = taskService.createTask('Title', 'Desc', 'medium');
            
            taskService.addListener(listener);
            listener.mockClear(); // Clear creation call
            
            taskService.updateTask(task.id, { title: 'Updated' });
            
            expect(listener).toHaveBeenCalledWith('taskUpdated', expect.any(Object));
        });
    });

    describe('Task Deletion', () => {
        test('should delete task', () => {
            const task = taskService.createTask('To Delete', 'Desc', 'low');
            const result = taskService.deleteTask(task.id);
            
            expect(result).toBe(true);
            expect(taskService.getTaskById(task.id)).toBeNull();
        });

        test('should return false for non-existent task', () => {
            const result = taskService.deleteTask('non-existent');
            expect(result).toBe(false);
        });

        test('should notify listeners on delete', () => {
            const listener = jest.fn();
            const task = taskService.createTask('To Delete', 'Desc', 'low');
            
            taskService.addListener(listener);
            listener.mockClear();
            
            taskService.deleteTask(task.id);
            
            expect(listener).toHaveBeenCalledWith('taskDeleted', task);
        });
    });

    describe('Task Filtering', () => {
        test('should filter by completed status', () => {
            const t1 = taskService.createTask('T1', '', 'high');
            taskService.createTask('T2', '', 'low');
            taskService.updateTask(t1.id, { completed: true });

            expect(taskService.getTasksByStatus(true)).toHaveLength(1);
            expect(taskService.getTasksByStatus(false)).toHaveLength(1);
        });

        test('should filter by priority', () => {
            taskService.createTask('T1', '', 'high');
            taskService.createTask('T2', '', 'high');
            taskService.createTask('T3', '', 'low');

            expect(taskService.getTasksByPriority('high')).toHaveLength(2);
            expect(taskService.getTasksByPriority('low')).toHaveLength(1);
            expect(taskService.getTasksByPriority('medium')).toHaveLength(0);
        });
    });

    describe('Task Statistics', () => {
        test('should get correct stats', () => {
            const t1 = taskService.createTask('T1', '', 'high');
            taskService.createTask('T2', '', 'medium');
            taskService.createTask('T3', '', 'low');
            taskService.updateTask(t1.id, { completed: true });
            
            const stats = taskService.getTaskStats();
            
            expect(stats.total).toBe(3);
            expect(stats.completed).toBe(1);
            expect(stats.pending).toBe(2);
            expect(stats.byPriority.high).toBe(1);
            expect(stats.byPriority.medium).toBe(1);
            expect(stats.byPriority.low).toBe(1);
        });

        test('should return empty stats when no tasks', () => {
            const stats = taskService.getTaskStats();
            
            expect(stats.total).toBe(0);
            expect(stats.completed).toBe(0);
            expect(stats.pending).toBe(0);
        });
    });

    describe('Event Listeners', () => {
        test('should add listener', () => {
            const listener = jest.fn();
            taskService.addListener(listener);
            
            taskService.createTask('Test', 'Desc', 'medium');
            
            expect(listener).toHaveBeenCalled();
        });

        test('should remove listener', () => {
            const listener = jest.fn();
            taskService.addListener(listener);
            taskService.removeListener(listener);
            
            taskService.createTask('Test', 'Desc', 'medium');
            
            expect(listener).not.toHaveBeenCalled();
        });

        test('should handle listener errors gracefully', () => {
            const errorListener = jest.fn(() => { throw new Error('Listener error'); });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            taskService.addListener(errorListener);
            
            // Should not throw
            expect(() => taskService.createTask('Test', 'Desc', 'medium')).not.toThrow();
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });
    });

    describe('Clear All Tasks', () => {
        test('should clear all tasks', () => {
            taskService.createTask('T1', '', 'high');
            taskService.createTask('T2', '', 'low');
            
            const result = taskService.clearAllTasks();
            
            expect(result).toBe(true);
            expect(taskService.getAllTasks()).toHaveLength(0);
        });

        test('should notify listeners when clearing', () => {
            const listener = jest.fn();
            taskService.addListener(listener);
            listener.mockClear();
            
            taskService.clearAllTasks();
            
            expect(listener).toHaveBeenCalledWith('allTasksCleared', undefined);
        });

        test('should persist clear to storage', () => {
            taskService.createTask('T1', '', 'high');
            mockStorage.save.mockClear();
            
            taskService.clearAllTasks();
            
            expect(mockStorage.save).toHaveBeenCalled();
        });
    });

    describe('Storage Integration', () => {
        test('should load tasks from storage', () => {
            const storedTask = new Task('Stored', 'Desc').toJSON();
            mockStorage.load.mockReturnValue([storedTask]);
            
            const newService = new TaskService(mockStorage);
            expect(newService.getAllTasks()).toHaveLength(1);
        });

        test('should handle invalid stored task data gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            mockStorage.load.mockReturnValue([{ invalid: 'data' }]);
            
            const newService = new TaskService(mockStorage);
            
            expect(newService.getAllTasks()).toHaveLength(0);
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });

        test('should save tasks to storage after create', () => {
            taskService.createTask('Test', 'Desc', 'medium');
            
            expect(mockStorage.save).toHaveBeenCalledWith('tasks', expect.any(Array));
        });
    });
});