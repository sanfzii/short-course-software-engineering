const TaskView = require('../../src/views/TaskView');

// Mock Controllers
const mockTaskController = {
    getTasks: jest.fn(),
    getTaskStats: jest.fn(),
    createTask: jest.fn(),
    deleteTask: jest.fn(),
    getTask: jest.fn(),
    toggleTaskStatus: jest.fn(),
    searchTasks: jest.fn()
};

const mockUserController = {
    getUserById: jest.fn()
};

describe('TaskView', () => {
    let taskView;
    let confirmSpy;

    beforeEach(() => {
        // Setup DOM environment mostly matching index.html structure
        document.body.innerHTML = `
            <div id="app">
                <form id="taskForm">
                    <input name="title" value="Test Task">
                    <textarea name="description">Test Description</textarea>
                    <select name="category"><option value="work" selected>Work</option></select>
                    <select name="priority"><option value="high">High</option></select>
                    <input name="dueDate" type="date">
                    <input name="estimatedHours" type="number" value="2">
                    <input name="tags" value="tag1, tag2">
                    <select name="assigneeId"><option value="self">Self</option><option value="user1">User 1</option></select>
                    <button type="submit">Add Task</button>
                </form>
                
                <div class="filter-buttons">
                    <button class="filter-btn active" data-filter="all">All</button>
                    <button class="filter-btn" data-filter="completed">Completed</button>
                </div>
                
                <input id="searchInput" type="text">
                
                <select id="sortSelect">
                    <option value="createdAt-desc">Newest</option>
                    <option value="priority-desc">Priority</option>
                </select>
                
                <button id="clearAllTasks">Clear All</button>
                
                <div id="taskStats"></div>
                <div id="taskList"></div>
                <div id="messages"></div>
            </div>
        `;

        jest.clearAllMocks();
        confirmSpy = jest.spyOn(window, 'confirm');
        confirmSpy.mockImplementation(() => true);
        
        // Default success responses
        mockTaskController.getTasks.mockReturnValue({ success: true, data: [] });
        mockTaskController.getTaskStats.mockReturnValue({ 
            success: true, 
            data: { total: 0, byStatus: {}, byPriority: {}, overdue: 0, dueSoon: 0 } 
        });
        mockUserController.getUserById.mockReturnValue({ 
            success: true, 
            data: { username: 'testuser', fullName: 'Test User' } 
        });

        taskView = new TaskView(mockTaskController, mockUserController);
    });

    afterEach(() => {
        confirmSpy.mockRestore();
        // Clean up messages to prevent pollution across tests
        const msgs = document.getElementById('messages');
        if (msgs) msgs.innerHTML = '';
    });

    describe('Initialization', () => {
        test('should initialize elements correctly', () => {
            expect(taskView.taskForm).not.toBeNull();
            expect(taskView.taskList).not.toBeNull();
            expect(taskView.filterButtons.length).toBeGreaterThan(0);
        });

        test('should create messages container if missing', () => {
            document.body.innerHTML = ''; // Wipe DOM
            taskView = new TaskView(mockTaskController, mockUserController);
            expect(document.getElementById('messages')).not.toBeNull();
        });
    });

    describe('Render Tasks', () => {
        test('should handle empty task list', () => {
            mockTaskController.getTasks.mockReturnValue({ success: true, data: [] });
            taskView.renderTasks();
            expect(document.getElementById('taskList').innerHTML).toContain('Belum ada task');
        });

        test('should render task items correctly', () => {
            const mockTasks = [
                { 
                    id: '1', title: 'Task 1', priority: 'high', status: 'pending', 
                    category: 'work', tags: ['urgent'], isOverdue: false, 
                    createdAt: new Date(), description: 'Desc', estimatedHours: 2,
                    ownerId: 'u1', assigneeId: 'u1'
                }
            ];
            mockTaskController.getTasks.mockReturnValue({ success: true, data: mockTasks });
            
            taskView.renderTasks();
            
            const list = document.getElementById('taskList');
            expect(list.innerHTML).toContain('Task 1');
            expect(list.innerHTML).toContain('priority-high');
            expect(list.innerHTML).toContain('urgent');
            expect(list.innerHTML).toContain('Desc');
        });

        test('should handle error when fetching tasks', () => {
            mockTaskController.getTasks.mockReturnValue({ success: false, error: 'Fetch error' });
            taskView.renderTasks();
            expect(document.querySelector('.message-error').textContent).toBe('Fetch error');
        });

        test('should show assignee name if different from owner', () => {
            const mockTasks = [{ 
                id: '1', title: 'Task', tags: [], createdAt: new Date(), 
                ownerId: 'u1', assigneeId: 'u2' 
            }];
            mockTaskController.getTasks.mockReturnValue({ success: true, data: mockTasks });
            mockUserController.getUserById.mockReturnValue({ success: true, data: { fullName: 'Other User' } });
            
            taskView.renderTasks();
            expect(document.getElementById('taskList').innerHTML).toContain('Assigned to: Other User');
        });
    });

    describe('Form Submission', () => {
        test('should create task on valid submission', () => {
            mockTaskController.createTask.mockReturnValue({ success: true, message: 'Created' });
            const form = document.getElementById('taskForm');
            
            form.dispatchEvent(new Event('submit'));
            
            expect(mockTaskController.createTask).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Test Task',
                estimatedHours: 2,
                tags: ['tag1', 'tag2']
            }));
            expect(document.querySelector('.message-success')).not.toBeNull();
        });

        test('should handle form submission error', () => {
            mockTaskController.createTask.mockReturnValue({ success: false, error: 'Validation failed' });
            const form = document.getElementById('taskForm');
            
            form.dispatchEvent(new Event('submit'));
            
            expect(document.querySelector('.message-error').textContent).toBe('Validation failed');
        });

        test('should handle custom assignee selection', () => {
            document.querySelector('[name="assigneeId"]').value = 'user1';
            mockTaskController.createTask.mockReturnValue({ success: true });
            
            document.getElementById('taskForm').dispatchEvent(new Event('submit'));
            
            expect(mockTaskController.createTask).toHaveBeenCalledWith(expect.objectContaining({
                assigneeId: 'user1'
            }));
        });
    });

    describe('Interactions (Filter, Search, Sort)', () => {
        test('should update filter on button click', () => {
            const completedBtn = document.querySelector('[data-filter="completed"]');
            completedBtn.click();
            
            expect(taskView.currentFilter).toBe('completed');
            expect(completedBtn.classList.contains('active')).toBe(true);
            expect(mockTaskController.getTasks).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }));
        });

        test('should search tasks on input', () => {
            const input = document.getElementById('searchInput');
            input.value = 'find me';
            mockTaskController.searchTasks.mockReturnValue({ success: true, data: [] });
            
            input.dispatchEvent(new Event('input'));
            
            expect(mockTaskController.searchTasks).toHaveBeenCalledWith('find me');
        });

        test('should handle empty search', () => {
            const input = document.getElementById('searchInput');
            input.value = '';
            
            input.dispatchEvent(new Event('input'));
            
            expect(mockTaskController.getTasks).toHaveBeenCalled(); // Should fallback to normal render
        });

        test('should handle no search results', () => {
            const input = document.getElementById('searchInput');
            input.value = 'notfound';
            mockTaskController.searchTasks.mockReturnValue({ success: true, data: [] });
            
            input.dispatchEvent(new Event('input'));
            
            expect(document.getElementById('taskList').innerHTML).toContain('Tidak ada task yang ditemukan');
        });

        test('should update sort order', () => {
            const select = document.getElementById('sortSelect');
            select.value = 'priority-desc';
            
            select.dispatchEvent(new Event('change'));
            
            expect(taskView.currentSort).toBe('priority');
            expect(mockTaskController.getTasks).toHaveBeenCalledWith(expect.objectContaining({ sortBy: 'priority' }));
        });
        
        test('should clear all tasks when confirmed', () => {
            const clearBtn = document.getElementById('clearAllTasks');
            confirmSpy.mockReturnValue(true);
            
            clearBtn.click();
            
            expect(confirmSpy).toHaveBeenCalled();
            expect(mockTaskController.getTasks).toHaveBeenCalled(); // Should refresh
        });

        test('should not clear tasks when cancelled', () => {
            const clearBtn = document.getElementById('clearAllTasks');
            confirmSpy.mockReturnValue(false); // User cancels
            jest.clearAllMocks(); // Clear prior calls

            clearBtn.click();
            
            expect(mockTaskController.getTasks).not.toHaveBeenCalled();
        });
    });

    describe('Task Item Actions', () => {
        beforeEach(() => {
            // Render one task for action testing
            const mockTasks = [{ id: '1', title: 'Task', tags: [], createdAt: new Date() }];
            mockTaskController.getTasks.mockReturnValue({ success: true, data: mockTasks });
            taskView.renderTasks();
        });

        test('should toggle task status', () => {
            mockTaskController.toggleTaskStatus.mockReturnValue({ success: true, message: 'Toggled' });
            
            const btn = document.querySelector('.btn-toggle');
            btn.click();
            
            expect(mockTaskController.toggleTaskStatus).toHaveBeenCalledWith('1');
            expect(document.querySelector('.message-success')).not.toBeNull();
        });

        test('should handle toggle error', () => {
            mockTaskController.toggleTaskStatus.mockReturnValue({ success: false, error: 'Error' });
            document.querySelector('.btn-toggle').click();
            expect(document.querySelector('.message-error')).not.toBeNull();
        });

        test('should delete task when confirmed', () => {
            mockTaskController.getTask.mockReturnValue({ success: true, data: { title: 'Task' } });
            mockTaskController.deleteTask.mockReturnValue({ success: true, message: 'Deleted' });
            confirmSpy.mockReturnValue(true);

            document.querySelector('.btn-delete').click();

            expect(mockTaskController.deleteTask).toHaveBeenCalledWith('1');
        });

        test('should not delete task if getTask fails', () => {
            mockTaskController.getTask.mockReturnValue({ success: false, error: 'Not found' });
            document.querySelector('.btn-delete').click();
            expect(mockTaskController.deleteTask).not.toHaveBeenCalled();
        });

        test('should edit task (show alert for now)', () => {
            const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
            document.querySelector('.btn-edit').click();
            expect(alertSpy).toHaveBeenCalled();
            alertSpy.mockRestore();
        });
    });

    describe('Render Stats', () => {
        test('should render statistics correctly', () => {
            mockTaskController.getTaskStats.mockReturnValue({
                success: true,
                data: {
                    total: 10,
                    byStatus: { pending: 5, completed: 5 },
                    byPriority: { high: 2 },
                    overdue: 1,
                    dueSoon: 2
                }
            });

            taskView.renderStats();

            const stats = document.getElementById('taskStats');
            expect(stats.innerHTML).toContain('5'); // pending
            expect(stats.innerHTML).toContain('1'); // overdue
            expect(stats.innerHTML).toContain('overdue'); // Check class presence
        });

        test('should handle stats fetch error', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            mockTaskController.getTaskStats.mockReturnValue({ success: false, error: 'Stats error' });
            
            taskView.renderStats();
            
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('Utilities', () => {
        test('showMessage should auto-remove message', () => {
            jest.useFakeTimers();
            taskView.showMessage('Temp', 'info');
            
            expect(document.querySelector('.message-info')).not.toBeNull();
            
            jest.advanceTimersByTime(5000);
            
            expect(document.querySelector('.message-info')).toBeNull();
            jest.useRealTimers();
        });
    });
});