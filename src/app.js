/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/**
 * Day 2 Main Application - MVC Implementation
 * * Orchestrates semua komponen:
 * - Storage Manager
 * - Repositories
 * - Controllers
 * - Views
 * - User Authentication
 */

// Global application state
let app = {
    storage: null,
    userRepository: null,
    taskRepository: null,
    userController: null,
    taskController: null,
    taskView: null,
    currentUser: null
};

/**
 * Initialize aplikasi
 */
function initializeApp() {
    console.log('🚀 Initializing Day 2 Task Management System...');
    
    try {
        // Initialize storage manager
        app.storage = new EnhancedStorageManager('taskAppDay2', '2.0');
        console.log('✅ Storage manager initialized');
        
        // Initialize repositories
        app.userRepository = new UserRepository(app.storage);
        app.taskRepository = new TaskRepository(app.storage);
        console.log('✅ Repositories initialized');
        
        // Initialize controllers
        app.userController = new UserController(app.userRepository);
        app.taskController = new TaskController(app.taskRepository, app.userRepository);
        console.log('✅ Controllers initialized');
        
        // Initialize view
        app.taskView = new TaskView(app.taskController, app.userController);
        console.log('✅ Views initialized');
        
        // Setup authentication event listeners
        setupAuthEventListeners();
        
        // Create demo user jika belum ada
        createDemoUserIfNeeded();
        
        // Show login section
        showLoginSection();
        
        // NEW: Render initial category stats (jika ada data tersimpan)
        renderCategoryStats();
        
        console.log('✅ Day 2 Application initialized successfully!');
        
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        showMessage('Gagal menginisialisasi aplikasi: ' + error.message, 'error');
    }
}

/**
 * Setup authentication event listeners
 */
function setupAuthEventListeners() {
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    // Register button
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', showRegisterModal);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Username input (Enter key)
    const usernameInput = document.getElementById('usernameInput');
    if (usernameInput) {
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Register modal close
    const closeRegisterModal = document.getElementById('closeRegisterModal');
    const cancelRegister = document.getElementById('cancelRegister');
    if (closeRegisterModal) {
        closeRegisterModal.addEventListener('click', hideRegisterModal);
    }
    if (cancelRegister) {
        cancelRegister.addEventListener('click', hideRegisterModal);
    }
    
    // Quick action buttons
    const showOverdueBtn = document.getElementById('showOverdueBtn');
    const showDueSoonBtn = document.getElementById('showDueSoonBtn');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const refreshTasks = document.getElementById('refreshTasks');
    
    if (showOverdueBtn) {
        showOverdueBtn.addEventListener('click', showOverdueTasks);
    }
    if (showDueSoonBtn) {
        showDueSoonBtn.addEventListener('click', showDueSoonTasks);
    }
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportAppData);
    }
    if (refreshTasks) {
        refreshTasks.addEventListener('click', () => app.taskView.refresh());
    }

    // ==========================================
    // NEW: Category Filter Listeners (Day 4)
    // ==========================================
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', handleCategoryFilter);
    });
}

/**
 * Handle user login
 */
function handleLogin() {
    const usernameInput = document.getElementById('usernameInput');
    const username = usernameInput.value.trim();
    
    if (!username) {
        showMessage('Username wajib diisi', 'error');
        return;
    }
    
    const response = app.userController.login(username);
    
    if (response.success) {
        app.currentUser = response.data;
        
        // Set current user di task controller
        app.taskController.setCurrentUser(app.currentUser.id);
        
        // Show main content
        showMainContent();
        
        // Load user list untuk assign dropdown
        loadUserListForAssign();
        
        // Refresh views
        app.taskView.refresh();
        
        showMessage(response.message, 'success');
    } else {
        showMessage(response.error, 'error');
    }
}

/**
 * Handle user logout
 */
function handleLogout() {
    const response = app.userController.logout();
    
    app.currentUser = null;
    
    // Hide main content
    hideMainContent();
    
    // Show login section
    showLoginSection();
    
    showMessage(response.message, 'info');
}

/**
 * Show register modal
 */
function showRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * Hide register modal
 */
function hideRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Reset form
    const form = document.getElementById('registerForm');
    if (form) {
        form.reset();
    }
}

/**
 * Handle user registration
 */
function handleRegister(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = {
        username: formData.get('username')?.trim(),
        email: formData.get('email')?.trim(),
        fullName: formData.get('fullName')?.trim()
    };
    
    const response = app.userController.register(userData);
    
    if (response.success) {
        hideRegisterModal();
        showMessage(response.message, 'success');
        
        // Auto-fill username untuk login
        const usernameInput = document.getElementById('usernameInput');
        if (usernameInput) {
            usernameInput.value = userData.username;
        }
    } else {
        showMessage(response.error, 'error');
    }
}

/**
 * Show login section
 */
function showLoginSection() {
    const loginSection = document.getElementById('loginSection');
    const userInfo = document.getElementById('userInfo');
    const mainContent = document.getElementById('mainContent');
    
    if (loginSection) loginSection.style.display = 'flex';
    if (userInfo) userInfo.style.display = 'none';
    if (mainContent) mainContent.style.display = 'none';
    
    // Clear username input
    const usernameInput = document.getElementById('usernameInput');
    if (usernameInput) {
        usernameInput.value = '';
        usernameInput.focus();
    }
}

/**
 * Show main content
 */
function showMainContent() {
    const loginSection = document.getElementById('loginSection');
    const userInfo = document.getElementById('userInfo');
    const mainContent = document.getElementById('mainContent');
    const welcomeMessage = document.getElementById('welcomeMessage');
    
    if (loginSection) loginSection.style.display = 'none';
    if (userInfo) userInfo.style.display = 'flex';
    if (mainContent) mainContent.style.display = 'block';
    
    if (welcomeMessage && app.currentUser) {
        welcomeMessage.textContent = `Selamat datang, ${app.currentUser.fullName || app.currentUser.username}!`;
    }

    // NEW: Update category stats saat user masuk
    renderCategoryStats();
}

/**
 * Hide main content
 */
function hideMainContent() {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.style.display = 'none';
    }
}

/**
 * Load user list untuk assign dropdown
 */
function loadUserListForAssign() {
    const response = app.userController.getAllUsers();
    
    if (response.success) {
        const assigneeSelect = document.getElementById('taskAssignee');
        if (assigneeSelect) {
            // Clear existing options except "self"
            assigneeSelect.innerHTML = '<option value="self">Diri Sendiri</option>';
            
            // Add other users
            response.data.forEach(user => {
                if (user.id !== app.currentUser.id) {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = user.fullName || user.username;
                    assigneeSelect.appendChild(option);
                }
            });
        }
    }
}

/**
 * Show overdue tasks
 */
function showOverdueTasks() {
    const response = app.taskController.getOverdueTasks();
    
    if (response.success) {
        if (response.count === 0) {
            showMessage('Tidak ada task yang overdue', 'info');
        } else {
            showMessage(`Ditemukan ${response.count} task yang overdue`, 'warning');
            // Filter view untuk menampilkan overdue tasks
            // Implementasi ini bisa diperbaiki dengan menambah filter khusus
        }
    } else {
        showMessage(response.error, 'error');
    }
}

/**
 * Show tasks due soon
 */
function showDueSoonTasks() {
    const response = app.taskController.getTasksDueSoon(3);
    
    if (response.success) {
        if (response.count === 0) {
            showMessage('Tidak ada task yang akan due dalam 3 hari', 'info');
        } else {
            showMessage(`Ditemukan ${response.count} task yang akan due dalam 3 hari`, 'warning');
        }
    } else {
        showMessage(response.error, 'error');
    }
}

/**
 * Export app data
 */
function exportAppData() {
    const exportData = app.storage.exportData();
    
    if (exportData) {
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `task-app-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showMessage('Data berhasil diekspor', 'success');
    } else {
        showMessage('Gagal mengekspor data', 'error');
    }
}

/**
 * Create demo user jika belum ada
 */
function createDemoUserIfNeeded() {
    const users = app.userRepository.findAll();
    
    if (users.length === 0) {
        try {
            // Buat demo user
            app.userRepository.create({
                username: 'demo',
                email: 'demo@example.com',
                fullName: 'Demo User'
            });
            
            app.userRepository.create({
                username: 'john',
                email: 'john@example.com',
                fullName: 'John Doe'
            });
            
            console.log('✅ Demo users created');
        } catch (error) {
            console.error('Failed to create demo users:', error);
        }
    }
}

/**
 * Show message to user
 */
function showMessage(message, type = 'info') {
    if (app.taskView) {
        app.taskView.showMessage(message, type);
    } else {
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

/**
 * Handle errors globally
 */
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showMessage('Terjadi kesalahan pada aplikasi', 'error');
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showMessage('Terjadi kesalahan pada aplikasi', 'error');
});

// ==========================================
// NEW: Day 4 Features Implementation
// ==========================================

/**
 * Handle category filter changes
 */
function handleCategoryFilter(event) {
    const category = event.target.dataset.category;
    
    // Update active category button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Clear other filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Render tasks filtered by category
    renderTaskList('category', category);
}

/**
 * Update renderTaskList function untuk support category filtering
 * Updated for Day 2 Compatibility: Uses app.taskRepository
 */
function renderTaskList(filterType = 'all', filterValue = null) {
    const taskListContainer = document.getElementById('taskList');
    if (!taskListContainer) return;
    
    // Gunakan repository dari app instance
    let tasks = app.taskRepository.findAll();
    
    // Apply filters
    switch (filterType) {
    case 'pending':
        tasks = tasks.filter(task => !task.completed);
        break;
    case 'completed':
        tasks = tasks.filter(task => task.completed);
        break;
    case 'high':
        tasks = tasks.filter(task => task.priority === 'high');
        break;
    case 'medium':
        tasks = tasks.filter(task => task.priority === 'medium');
        break;
    case 'low':
        tasks = tasks.filter(task => task.priority === 'low');
        break;
    case 'category':
        tasks = tasks.filter(task => task.category === filterValue);
        break;
    }
    
    // Sort tasks by creation date (newest first)
    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (tasks.length === 0) {
        const filterText = filterType === 'category' ? 
            `in ${filterValue} category` : 
            `with ${filterType} filter`;
            
        taskListContainer.innerHTML = `
            <div class="empty-state">
                <p>No tasks found ${filterText}</p>
                <small>Create your first task using the form above</small>
            </div>
        `;
        return;
    }
    
    const taskHTML = tasks.map(task => createTaskHTML(task)).join('');
    taskListContainer.innerHTML = taskHTML;
}

/**
 * Update createTaskHTML function untuk include category display
 * Updated for Day 2 Compatibility: Uses app.taskController events in onclick
 */
function createTaskHTML(task) {
    // Helper untuk escape HTML agar aman
    const escapeHtml = (unsafe) => {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    const priorityClass = `priority-${task.priority}`;
    const completedClass = task.completed ? 'completed' : '';
    // Handle category jika belum ada (backward compatibility)
    const category = task.category || 'other';
    const categoryClass = `category-${category}`;
    const createdDate = new Date(task.createdAt).toLocaleDateString();
    
    // Get category display name
    const categoryDisplayNames = {
        'work': 'Work',
        'personal': 'Personal',
        'study': 'Study',
        'health': 'Health',
        'finance': 'Finance',
        'shopping': 'Shopping',
        'other': 'Other'
    };
    
    const categoryDisplay = categoryDisplayNames[category] || category;
    
    return `
        <div class="task-item ${priorityClass} ${completedClass}" data-task-id="${task.id}">
            <div class="task-content">
                <div class="task-header">
                    <h3 class="task-title">${escapeHtml(task.title)}</h3>
                    <div class="task-badges">
                        <span class="task-priority">${task.priority}</span>
                        <span class="task-category ${categoryClass}">${categoryDisplay}</span>
                    </div>
                </div>
                ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
                <div class="task-meta">
                    <small>Created: ${createdDate}</small>
                    ${task.completed ? `<small>Completed: ${new Date(task.updatedAt).toLocaleDateString()}</small>` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="btn btn-toggle" onclick="app.taskController.toggleTask('${task.id}'); app.taskView.refresh();" title="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
                    ${task.completed ? '↶' : '✓'}
                </button>
                <button class="btn btn-delete" onclick="app.taskController.deleteTask('${task.id}'); app.taskView.refresh();" title="Delete task">
                    🗑️
                </button>
            </div>
        </div>
    `;
}

/**
 * Render category statistics
 * Updated for Day 2 Compatibility: Uses app.taskRepository
 */
function renderCategoryStats() {
    // Cari container categoryStats, jika belum ada inject ke stats-section
    let statsContainer = document.getElementById('categoryStats');
    
    // Fallback: jika container belum ada di HTML, kita coba inject manual (safety)
    if (!statsContainer) {
        const mainStats = document.getElementById('taskStats');
        if (mainStats && mainStats.parentNode) {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = '<div id="categoryStats"></div>';
            mainStats.parentNode.appendChild(wrapper.firstChild);
            statsContainer = document.getElementById('categoryStats');
        } else {
            return; // Tidak bisa render
        }
    }
    
    const tasks = app.taskRepository.findAll();
    const categoryStats = {};
    
    // Initialize categories
    const categories = ['work', 'personal', 'study', 'health', 'finance', 'shopping', 'other'];
    categories.forEach(cat => {
        categoryStats[cat] = { total: 0, completed: 0 };
    });
    
    // Count tasks by category
    tasks.forEach(task => {
        const cat = task.category || 'other';
        if (categoryStats[cat]) {
            categoryStats[cat].total++;
            if (task.completed) {
                categoryStats[cat].completed++;
            }
        }
    });
    
    // Render stats
    const statsHTML = Object.entries(categoryStats)
        .filter(([category, stats]) => stats.total > 0)
        .map(([category, stats]) => {
            const displayNames = {
                'work': 'Work',
                'personal': 'Personal', 
                'study': 'Study',
                'health': 'Health',
                'finance': 'Finance',
                'shopping': 'Shopping',
                'other': 'Other'
            };
            
            return `
                <div class="category-stat-item">
                    <h4>${displayNames[category]}</h4>
                    <div class="stat-number">${stats.total}</div>
                    <small>${stats.completed} completed</small>
                </div>
            `;
        }).join('');
    
    if (statsHTML) {
        statsContainer.innerHTML = `
            <h3>Tasks by Category</h3>
            <div class="category-stats">${statsHTML}</div>
        `;
    } else {
        statsContainer.innerHTML = '';
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);

// Export untuk testing (jika diperlukan)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeApp,
        handleLogin,
        handleLogout,
        handleRegister,
        app
    };
}