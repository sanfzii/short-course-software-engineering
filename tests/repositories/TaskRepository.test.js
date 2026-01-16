const TaskRepository = require('../../src/repositories/TaskRepository');

// Mock buat EnhancedTask Model
const createMockTask = (overrides = {}) => ({
    id: 'task-1',
    title: 'Test Task',
    description: 'Description',
    ownerId: 'user-1',
    assigneeId: null,
    category: 'work',
    status: 'pending',
    priority: 'high',
    tags: ['urgent'],
    isOverdue: false,
    daysUntilDue: 2,
    isCompleted: false,
    createdAt: new Date('2024-01-15'),
    dueDate: new Date('2024-02-15'),
    toJSON: jest.fn().mockImplementation(function() { 
        return { id: this.id, title: this.title }; 
    }),
    updateTitle: jest.fn(),
    updateDescription: jest.fn(),
    updateCategory: jest.fn(),
    updatePriority: jest.fn(),
    updateStatus: jest.fn(),
    setDueDate: jest.fn(),
    assignTo: jest.fn(),
    setEstimatedHours: jest.fn(),
    addTimeSpent: jest.fn(),
    addTag: jest.fn(),
    removeTag: jest.fn(),
    addNote: jest.fn(),
    ...overrides
});

let mockEnhancedTask;

// Setup struktur Mock Class
const MockEnhancedTaskClass = jest.fn((title, desc, ownerId, options) => {
    mockEnhancedTask = createMockTask({ title, ownerId, ...options });
    return mockEnhancedTask;
});
MockEnhancedTaskClass.fromJSON = jest.fn((data) => createMockTask(data));
MockEnhancedTaskClass.getAvailableCategories = jest.fn().mockReturnValue(['work', 'personal', 'finance', 'study', 'health', 'other']);
MockEnhancedTaskClass.prototype = {
    getCategoryDisplayName: function() { return this._category ? this._category.toUpperCase() : 'OTHER'; }
};

// Assign ke global variable supaya Repository bisa akses
global.EnhancedTask = MockEnhancedTaskClass;

describe('TaskRepository', () => {
    let taskRepository;
    let mockStorage;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock Storage buat testing
        mockStorage = {
            save: jest.fn(),
            load: jest.fn().mockReturnValue([])
        };

        mockEnhancedTask = createMockTask();

        taskRepository = new TaskRepository(mockStorage);
    });

    describe('Create & Init', () => {
        test('should load tasks from storage on init', () => {
            mockStorage.load.mockReturnValue([{ id: 'loaded-1' }]);
            const repo = new TaskRepository(mockStorage);
            
            expect(mockStorage.load).toHaveBeenCalledWith('tasks', []);
            expect(MockEnhancedTaskClass.fromJSON).toHaveBeenCalled();
            expect(repo.findAll().length).toBe(1);
        });

        test('should handle invalid task data during load', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            MockEnhancedTaskClass.fromJSON.mockImplementationOnce(() => { throw new Error('Invalid'); });
            mockStorage.load.mockReturnValue([{ id: 'invalid' }]);
            
            const repo = new TaskRepository(mockStorage);
            
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('create should save new task', () => {
            const taskData = { 
                title: 'New Task', 
                description: 'Desc', 
                ownerId: 'u1' 
            };
            
            const result = taskRepository.create(taskData);
            
            expect(result).toBeDefined();
            expect(MockEnhancedTaskClass).toHaveBeenCalledWith(
                taskData.title, taskData.description, taskData.ownerId, taskData
            );
            expect(mockStorage.save).toHaveBeenCalled();
        });

        test('create should throw on error', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            MockEnhancedTaskClass.mockImplementationOnce(() => { throw new Error('Creation failed'); });
            
            expect(() => taskRepository.create({ title: 'Test', ownerId: 'u1' })).toThrow('Creation failed');
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });
    });

    describe('Find Methods', () => {
        beforeEach(() => {
            taskRepository.tasks.set('task-1', mockEnhancedTask);
        });

        test('findById should return task', () => {
            expect(taskRepository.findById('task-1')).toBe(mockEnhancedTask);
            expect(taskRepository.findById('invalid')).toBeNull();
        });

        test('findAll should return all tasks', () => {
            taskRepository.tasks.set('task-2', createMockTask({ id: 'task-2' }));
            expect(taskRepository.findAll()).toHaveLength(2);
        });

        test('findByOwner should filter correctly', () => {
            mockEnhancedTask.ownerId = 'u1';
            const results = taskRepository.findByOwner('u1');
            expect(results).toHaveLength(1);
        });

        test('findByAssignee should filter correctly', () => {
            mockEnhancedTask.assigneeId = 'user-123';
            const results = taskRepository.findByAssignee('user-123');
            expect(results).toHaveLength(1);
            
            const noResults = taskRepository.findByAssignee('other-user');
            expect(noResults).toHaveLength(0);
        });

        test('findByCategory should filter correctly', () => {
            mockEnhancedTask.category = 'work';
            const results = taskRepository.findByCategory('work');
            expect(results).toHaveLength(1);
        });

        test('findByStatus should filter correctly', () => {
            mockEnhancedTask.status = 'pending';
            expect(taskRepository.findByStatus('pending')).toHaveLength(1);
            expect(taskRepository.findByStatus('completed')).toHaveLength(0);
        });

        test('findByPriority should filter correctly', () => {
            mockEnhancedTask.priority = 'high';
            expect(taskRepository.findByPriority('high')).toHaveLength(1);
            expect(taskRepository.findByPriority('low')).toHaveLength(0);
        });

        test('findOverdue should return overdue tasks', () => {
            mockEnhancedTask.isOverdue = true;
            expect(taskRepository.findOverdue()).toHaveLength(1);
            
            mockEnhancedTask.isOverdue = false;
            expect(taskRepository.findOverdue()).toHaveLength(0);
        });

        test('findDueSoon should check daysUntilDue', () => {
            mockEnhancedTask.daysUntilDue = 2; // Due soon (<= 3 days)
            mockEnhancedTask.isCompleted = false;
            expect(taskRepository.findDueSoon(3)).toHaveLength(1);
            
            mockEnhancedTask.daysUntilDue = 10; // Not due soon
            expect(taskRepository.findDueSoon(3)).toHaveLength(0);
        });

        test('findDueSoon should exclude completed tasks', () => {
            mockEnhancedTask.daysUntilDue = 2;
            mockEnhancedTask.isCompleted = true;
            expect(taskRepository.findDueSoon(3)).toHaveLength(0);
        });

        test('findDueSoon should exclude null daysUntilDue', () => {
            mockEnhancedTask.daysUntilDue = null;
            expect(taskRepository.findDueSoon(3)).toHaveLength(0);
        });

        test('findByTag should filter by tag', () => {
            mockEnhancedTask.tags = ['urgent', 'important'];
            expect(taskRepository.findByTag('urgent')).toHaveLength(1);
            expect(taskRepository.findByTag('minor')).toHaveLength(0);
        });
    });

    describe('Filter Method', () => {
        beforeEach(() => {
            taskRepository.tasks.set('task-1', mockEnhancedTask);
        });

        test('should filter by priority', () => {
            mockEnhancedTask.priority = 'high';
            expect(taskRepository.filter({ priority: 'high' })).toHaveLength(1);
            expect(taskRepository.filter({ priority: 'low' })).toHaveLength(0);
        });

        test('should filter by status', () => {
            mockEnhancedTask.status = 'pending';
            expect(taskRepository.filter({ status: 'pending' })).toHaveLength(1);
        });

        test('should filter by category', () => {
            mockEnhancedTask.category = 'work';
            expect(taskRepository.filter({ category: 'work' })).toHaveLength(1);
        });

        test('should filter by ownerId', () => {
            mockEnhancedTask.ownerId = 'u1';
            expect(taskRepository.filter({ ownerId: 'u1' })).toHaveLength(1);
        });

        test('should filter by assigneeId', () => {
            mockEnhancedTask.assigneeId = 'user-123';
            expect(taskRepository.filter({ assigneeId: 'user-123' })).toHaveLength(1);
        });

        test('should filter by isCompleted', () => {
            mockEnhancedTask.isCompleted = true;
            expect(taskRepository.filter({ isCompleted: true })).toHaveLength(1);
            expect(taskRepository.filter({ isCompleted: false })).toHaveLength(0);
        });

        test('should filter with multiple criteria', () => {
            mockEnhancedTask.priority = 'high';
            mockEnhancedTask.status = 'pending';
            
            expect(taskRepository.filter({ priority: 'high', status: 'pending' })).toHaveLength(1);
            expect(taskRepository.filter({ priority: 'high', status: 'completed' })).toHaveLength(0);
        });
    });

    describe('Update', () => {
        beforeEach(() => {
            taskRepository.tasks.set('task-1', mockEnhancedTask);
        });

        test('should update title', () => {
            taskRepository.update('task-1', { title: 'Updated' });
            expect(mockEnhancedTask.updateTitle).toHaveBeenCalledWith('Updated');
            expect(mockStorage.save).toHaveBeenCalled();
        });

        test('should update description', () => {
            taskRepository.update('task-1', { description: 'New desc' });
            expect(mockEnhancedTask.updateDescription).toHaveBeenCalledWith('New desc');
        });

        test('should update category', () => {
            taskRepository.update('task-1', { category: 'personal' });
            expect(mockEnhancedTask.updateCategory).toHaveBeenCalledWith('personal');
        });

        test('should update priority', () => {
            taskRepository.update('task-1', { priority: 'low' });
            expect(mockEnhancedTask.updatePriority).toHaveBeenCalledWith('low');
        });

        test('should update status', () => {
            taskRepository.update('task-1', { status: 'completed' });
            expect(mockEnhancedTask.updateStatus).toHaveBeenCalledWith('completed');
        });

        test('should set due date', () => {
            const dueDate = new Date('2024-03-15');
            taskRepository.update('task-1', { dueDate });
            expect(mockEnhancedTask.setDueDate).toHaveBeenCalledWith(dueDate);
        });

        test('should assign to user', () => {
            taskRepository.update('task-1', { assigneeId: 'user-456' });
            expect(mockEnhancedTask.assignTo).toHaveBeenCalledWith('user-456');
        });

        test('should set estimated hours', () => {
            taskRepository.update('task-1', { estimatedHours: 5 });
            expect(mockEnhancedTask.setEstimatedHours).toHaveBeenCalledWith(5);
        });

        test('should add time spent', () => {
            taskRepository.update('task-1', { addTimeSpent: 2 });
            expect(mockEnhancedTask.addTimeSpent).toHaveBeenCalledWith(2);
        });

        test('should add tag', () => {
            taskRepository.update('task-1', { addTag: 'new-tag' });
            expect(mockEnhancedTask.addTag).toHaveBeenCalledWith('new-tag');
        });

        test('should remove tag', () => {
            taskRepository.update('task-1', { removeTag: 'old-tag' });
            expect(mockEnhancedTask.removeTag).toHaveBeenCalledWith('old-tag');
        });

        test('should add note', () => {
            taskRepository.update('task-1', { note: 'New note' });
            expect(mockEnhancedTask.addNote).toHaveBeenCalledWith('New note');
        });

        test('should return null for non-existent task', () => {
            expect(taskRepository.update('invalid', { title: 'Test' })).toBeNull();
        });
    });

    describe('Delete', () => {
        beforeEach(() => {
            taskRepository.tasks.set('task-1', mockEnhancedTask);
        });

        test('should delete task', () => {
            const success = taskRepository.delete('task-1');
            expect(success).toBe(true);
            expect(taskRepository.tasks.has('task-1')).toBe(false);
            expect(mockStorage.save).toHaveBeenCalled();
        });

        test('should return false for non-existent task', () => {
            expect(taskRepository.delete('invalid')).toBe(false);
        });
    });

    describe('Search', () => {
        beforeEach(() => {
            taskRepository.tasks.set('task-1', mockEnhancedTask);
        });

        test('should search by title', () => {
            mockEnhancedTask.title = 'Meeting with Client';
            const results = taskRepository.search('meet');
            expect(results).toHaveLength(1);
        });

        test('should search by description', () => {
            mockEnhancedTask.description = 'Important project discussion';
            const results = taskRepository.search('project');
            expect(results).toHaveLength(1);
        });

        test('should be case insensitive', () => {
            mockEnhancedTask.title = 'Meeting';
            expect(taskRepository.search('MEET')).toHaveLength(1);
        });

        test('should return empty for no matches', () => {
            mockEnhancedTask.title = 'Task';
            expect(taskRepository.search('xyz')).toHaveLength(0);
        });
    });

    describe('Sort', () => {
        test('should sort by title ascending', () => {
            const t1 = createMockTask({ id: '1', title: 'B Task' });
            const t2 = createMockTask({ id: '2', title: 'A Task' });
            
            const sorted = taskRepository.sort([t1, t2], 'title', 'asc');
            expect(sorted[0].title).toBe('A Task');
        });

        test('should sort by title descending', () => {
            const t1 = createMockTask({ id: '1', title: 'A Task' });
            const t2 = createMockTask({ id: '2', title: 'B Task' });
            
            const sorted = taskRepository.sort([t1, t2], 'title', 'desc');
            expect(sorted[0].title).toBe('B Task');
        });

        test('should sort by priority', () => {
            const t1 = createMockTask({ id: '1', priority: 'low' });
            const t2 = createMockTask({ id: '2', priority: 'high' });
            
            const sorted = taskRepository.sort([t1, t2], 'priority', 'asc');
            // Urutan prioritas: high > medium > low (berdasarkan bobot)
            expect(sorted.length).toBe(2);
        });

        test('should sort by dueDate', () => {
            const t1 = createMockTask({ id: '1', dueDate: new Date('2024-03-15') });
            const t2 = createMockTask({ id: '2', dueDate: new Date('2024-01-15') });
            
            const sorted = taskRepository.sort([t1, t2], 'dueDate', 'asc');
            expect(sorted[0].id).toBe('2');
        });

        test('should sort by createdAt', () => {
            const t1 = createMockTask({ id: '1', createdAt: new Date('2024-02-01') });
            const t2 = createMockTask({ id: '2', createdAt: new Date('2024-01-01') });
            
            const sorted = taskRepository.sort([t1, t2], 'createdAt', 'asc');
            expect(sorted[0].id).toBe('2');
        });
    });

    describe('Statistics', () => {
        beforeEach(() => {
            taskRepository.tasks.set('t1', createMockTask({ id: 't1', category: 'work', status: 'pending', priority: 'high', isOverdue: false, isCompleted: false, ownerId: 'u1' }));
            taskRepository.tasks.set('t2', createMockTask({ id: 't2', category: 'personal', status: 'completed', priority: 'low', isCompleted: true, ownerId: 'u1' }));
            taskRepository.tasks.set('t3', createMockTask({ id: 't3', category: 'work', status: 'pending', priority: 'medium', isOverdue: true, isCompleted: false, ownerId: 'u2' }));
        });

        test('getStats should aggregate counts', () => {
            const stats = taskRepository.getStats();
            expect(stats.total).toBe(3);
            expect(stats.completed).toBe(1);
            expect(stats.pending).toBe(2);
            expect(stats.byCategory.work).toBe(2);
            expect(stats.byCategory.personal).toBe(1);
            expect(stats.byPriority.high).toBe(1);
        });

        test('getStats should filter by userId', () => {
            const stats = taskRepository.getStats('u1');
            expect(stats.total).toBe(2);
        });

        test('getCategoryStats should return detailed stats', () => {
            const stats = taskRepository.getCategoryStats();
            expect(stats.work.total).toBe(2);
            expect(stats.personal.total).toBe(1);
        });

        test('getCategoryStats should filter by userId', () => {
            const stats = taskRepository.getCategoryStats('u1');
            expect(stats.work.total).toBe(1);
        });

        test('getMostUsedCategories should sort by count', () => {
            const result = taskRepository.getMostUsedCategories(null, 5);
            expect(result.length).toBeGreaterThan(0);
            expect(result[0].category).toBe('work'); // 2 tasks
        });

        test('getMostUsedCategories should filter by userId', () => {
            const result = taskRepository.getMostUsedCategories('u1', 5);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('Storage Persistence', () => {
        test('should save to storage after create', () => {
            taskRepository.create({ title: 'Test', ownerId: 'u1' });
            expect(mockStorage.save).toHaveBeenCalledWith('tasks', expect.any(Array));
        });

        test('should save to storage after update', () => {
            taskRepository.tasks.set('task-1', mockEnhancedTask);
            mockStorage.save.mockClear();
            
            taskRepository.update('task-1', { title: 'Updated' });
            expect(mockStorage.save).toHaveBeenCalled();
        });

        test('should save to storage after delete', () => {
            taskRepository.tasks.set('task-1', mockEnhancedTask);
            mockStorage.save.mockClear();
            
            taskRepository.delete('task-1');
            expect(mockStorage.save).toHaveBeenCalled();
        });
    });
});