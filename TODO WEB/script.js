/**
 * Orbit Tasks - Main Script
 * Focuses on clean, readable code for beginners.
 */

// --- 1. Select DOM Elements ---
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const itemsLeftLabel = document.getElementById('itemsLeft');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const filterBtns = document.querySelectorAll('.filter-btn');
const themeBtns = document.querySelectorAll('.theme-btn');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

// --- 2. App State ---
let tasks = [];
let currentFilter = 'all'; // 'all', 'active', 'completed'

// --- 3. Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Load Theme
    const savedTheme = localStorage.getItem('orbitTheme') || 'ocean';
    setTheme(savedTheme);

    // Load Tasks
    const savedTasks = localStorage.getItem('orbitTasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
    renderTasks();
});

// --- 4. Core Functions (CRUD) ---

/**
 * Adds a new task to the list
 */
function addTask() {
    const text = taskInput.value.trim();
    if (text === '') return; // Don't add empty tasks

    const newTask = {
        id: Date.now(), // Unique ID based on timestamp
        text: text,
        completed: false,
        createdAt: new Date().toLocaleDateString()
    };

    tasks.unshift(newTask); // Add to the top of the list
    saveAndRender();
    taskInput.value = ''; // Clear input
    taskInput.focus();
}

/**
 * Toggles the completed status of a task
 */
function toggleTask(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    saveAndRender();
}

/**
 * Deletes a task by ID
 */
function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveAndRender();
}

/**
 * Updates task text (Edit feature)
 */
function editTask(id, newText) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, text: newText };
        }
        return task;
    });
    saveAndRender();
}

/**
 * Clears all completed tasks
 */
function clearCompleted() {
    tasks = tasks.filter(task => !task.completed);
    saveAndRender();
}

// --- 5. Data Persistence ---

function saveAndRender() {
    localStorage.setItem('orbitTasks', JSON.stringify(tasks));
    renderTasks();
}

// --- 6. Rendering Logic ---

function renderTasks() {
    // 1. Filter tasks
    let filteredTasks = tasks;
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(task => !task.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(task => task.completed);
    }

    // 2. Clear current list
    taskList.innerHTML = '';

    // 3. Handle Empty State
    if (filteredTasks.length === 0) {
        const emptyMsg = currentFilter === 'completed' ? "No completed tasks yet." : 
                         currentFilter === 'active' ? "No pending tasks! Great job." : 
                         "No tasks yet. Start your journey!";
        taskList.innerHTML = `
            <li class="empty-state">
                <i class="fa-regular fa-clipboard"></i>
                <p>${emptyMsg}</p>
            </li>
        `;
    } else {
        // 4. Create HTML for each task
        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.dataset.id = task.id;

            li.innerHTML = `
                <div class="task-check-wrapper">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                </div>
                <div class="task-text-container">
                    <span class="task-text">${escapeHtml(task.text)}</span>
                    <span class="task-date">${task.createdAt}</span>
                </div>
                <div class="task-actions">
                    <button class="action-btn edit-btn" title="Edit">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn delete-btn" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;

            // Add Event Listeners to the new elements
            const checkbox = li.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => toggleTask(task.id));

            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering other clicks
                deleteTask(task.id);
            });

            const editBtn = li.querySelector('.edit-btn');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                enableEditMode(li, task.id, task.text);
            });

            taskList.appendChild(li);
        });
    }

    // 5. Update Stats
    updateStats();
}

function updateStats() {
    const activeCount = tasks.filter(t => !t.completed).length;
    const itemsText = activeCount === 1 ? 'item' : 'items';
    itemsLeftLabel.textContent = `${activeCount} ${itemsText} left`;

    // Progress Bar
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${percent}%`;
}

// --- 7. Helper Functions ---

/**
 * Enables inline editing for a task
 */
function enableEditMode(liElement, id, currentText) {
    if (liElement.classList.contains('editing')) return;

    liElement.classList.add('editing');
    const textContainer = liElement.querySelector('.task-text-container');
    const originalContent = textContainer.innerHTML;

    textContainer.innerHTML = `
        <input type="text" class="edit-input" value="${escapeHtml(currentText)}">
    `;
    
    const input = textContainer.querySelector('.edit-input');
    input.focus();

    // Save on Enter or Blur
    const saveEdit = () => {
        const newText = input.value.trim();
        if (newText) {
            editTask(id, newText); // Will re-render
        } else {
            // Revert if empty
            textContainer.innerHTML = originalContent;
            liElement.classList.remove('editing');
        }
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveEdit();
    });
    
    // Handle click outside or blur - simple blur might trigger unwanted saves if clicking buttons,
    // so we'll just stick to Enter for now or basic blur.
    input.addEventListener('blur', saveEdit);
}

function setTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    localStorage.setItem('orbitTheme', themeName);
    
    // Update active button state
    themeBtns.forEach(btn => {
        if (btn.dataset.theme === themeName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Security: Prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// --- 8. Event Listeners (Global) ---

addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask();
});

clearCompletedBtn.addEventListener('click', clearCompleted);

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active state
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update filter and render
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        setTheme(btn.dataset.theme);
    });
});
