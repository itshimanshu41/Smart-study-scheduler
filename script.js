class StudyScheduler {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = {
            subject: '',
            difficulty: '',
            priority: '',
            status: ''
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderTasks();
        this.updateStats();
        this.setMinDate();
    }

    bindEvents() {
        // Formsubmission
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Filterr controls
        document.getElementById('filterSubject').addEventListener('change', (e) => {
            this.currentFilter.subject = e.target.value;
            this.renderTasks();
        });

        document.getElementById('filterDifficulty').addEventListener('change', (e) => {
            this.currentFilter.difficulty = e.target.value;
            this.renderTasks();
        });

        document.getElementById('filterPriority').addEventListener('change', (e) => {
            this.currentFilter.priority = e.target.value;
            this.renderTasks();
        });

        document.getElementById('filterStatus').addEventListener('change', (e) => {
            this.currentFilter.status = e.target.value;
            this.renderTasks();
        });

        // Clearfilters
        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });
    }

    setMinDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dueDate').min = today;
    }

    addTask() {
        const form = document.getElementById('taskForm');
        const formData = new FormData(form);

        const task = {
            id: Date.now(),
            title: formData.get('taskTitle'),
            subject: formData.get('subject'),
            difficulty: formData.get('difficulty'),
            priority: formData.get('priority'),
            dueDate: formData.get('dueDate'),
            estimatedTime: parseFloat(formData.get('estimatedTime')),
            description: formData.get('description'),
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        form.reset();
        this.setMinDate();
        this.showNotification('Task added successfully!', 'success');
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification('Task deleted successfully!', 'success');
        }
    }

    toggleComplete(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            const message = task.completed ? 'Task marked as completed!' : 'Task marked as pending!';
            this.showNotification(message, 'success');
        }
    }

    editTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            // Populate form with taskdata
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('subject').value = task.subject;
            document.getElementById('difficulty').value = task.difficulty;
            document.getElementById('priority').value = task.priority;
            document.getElementById('dueDate').value = task.dueDate;
            document.getElementById('estimatedTime').value = task.estimatedTime;
            document.getElementById('description').value = task.description;

            // Remove the task (will be re-added when form is submitted)
            this.deleteTask(id);

            // Scroll to form
            document.querySelector('.task-form').scrollIntoView({ behavior: 'smooth' });
        }
    }

    filterTasks() {
        return this.tasks.filter(task => {
            const matchesSubject = !this.currentFilter.subject || task.subject === this.currentFilter.subject;
            const matchesDifficulty = !this.currentFilter.difficulty || task.difficulty === this.currentFilter.difficulty;
            const matchesPriority = !this.currentFilter.priority || task.priority === this.currentFilter.priority;
            const matchesStatus = !this.currentFilter.status ||
                (this.currentFilter.status === 'completed' && task.completed) ||
                (this.currentFilter.status === 'pending' && !task.completed);

            return matchesSubject && matchesDifficulty && matchesPriority && matchesStatus;
        });
    }

    renderTasks() {
        const filteredTasks = this.filterTasks();
        const container = document.getElementById('taskContainer');

        if (filteredTasks.length === 0) {
            container.innerHTML = `
                <div class="no-tasks">
                    <p>${this.tasks.length === 0 ? 'No tasks added yet. Create your first task above!' : 'No tasks match your current filters.'}</p>
                </div>
            `;
            return;
        }

        // Sort tasks by priority and due date
        const sortedTasks = filteredTasks.sort((a, b) => {
            const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];

            if (priorityDiff !== 0) return priorityDiff;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });

        container.innerHTML = sortedTasks.map(task => this.createTaskCard(task)).join('');
    }

    createTaskCard(task) {
            const isOverdue = new Date(task.dueDate) < new Date() && !task.completed;
            const daysUntilDue = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));

            return `
            <div class="task-card ${task.completed ? 'completed' : ''}">
                <div class="task-header">
                    <div>
                        <h3 class="task-title ${task.completed ? 'completed-text' : ''}">${task.title}</h3>
                        <div class="task-meta">
                            <span class="task-badge badge-subject">${task.subject}</span>
                            <span class="task-badge badge-difficulty badge-${task.difficulty.toLowerCase()}">${task.difficulty}</span>
                            <span class="task-badge badge-priority badge-${task.priority.toLowerCase()}">${task.priority}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn ${task.completed ? 'btn-secondary' : 'btn-success'}" 
                                onclick="scheduler.toggleComplete(${task.id})">
                            ${task.completed ? 'Undo' : 'Complete'}
                        </button>
                        <button class="btn btn-secondary" onclick="scheduler.editTask(${task.id})">Edit</button>
                        <button class="btn btn-danger" onclick="scheduler.deleteTask(${task.id})">Delete</button>
                    </div>
                </div>
                
                ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
                
                <div class="task-details">
                    <div class="task-info">
                        <span><strong>Due:</strong> ${this.formatDate(task.dueDate)} ${isOverdue ? '(Overdue)' : daysUntilDue === 0 ? '(Due Today)' : daysUntilDue === 1 ? '(Due Tomorrow)' : daysUntilDue > 0 ? `(${daysUntilDue} days)` : ''}</span>
                        <span><strong>Time:</strong> ${task.estimatedTime} hours</span>
                        <span><strong>Created:</strong> ${this.formatDate(task.createdAt.split('T')[0])}</span>
                    </div>
                </div>
            </div>
        `;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    clearFilters() {
        this.currentFilter = {
            subject: '',
            difficulty: '',
            priority: '',
            status: ''
        };
        
        // Reset filter controls
        document.getElementById('filterSubject').value = '';
        document.getElementById('filterDifficulty').value = '';
        document.getElementById('filterPriority').value = '';
        document.getElementById('filterStatus').value = '';
        
        this.renderTasks();
        this.showNotification('Filters cleared!', 'success');
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        const totalHours = this.tasks.reduce((sum, task) => sum + task.estimatedTime, 0);
        
        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('pendingTasks').textContent = pendingTasks;
        document.getElementById('totalHours').textContent = totalHours.toFixed(1);
    }

    showNotification(message, type) {
        // Creat notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        // Adding animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Removing the notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    saveTasks() {
        
    }

    loadTasks() {
        // Note: In a real implementation, this would load from localStorage
        // For demo purposes, we'll start with empty array
        // const saved = localStorage.getItem('studyTasks');
        // return saved ? JSON.parse(saved) : [];
        return [];
    }
}

// Initialize the application
const scheduler = new StudyScheduler();

// Add some sample data for demonstration
scheduler.tasks = [
    {
        id: 1,
        title: "Complete Math Assignment",
        subject: "Mathematics",
        difficulty: "Medium",
        priority: "High",
        dueDate: "2025-07-10",
        estimatedTime: 2.5,
        description: "Chapter 5 exercises on quadratic equations",
        completed: false,
        createdAt: "2025-07-07T10:00:00"
    },
    {
        id: 2,
        title: "Read History Chapter",
        subject: "History",
        difficulty: "Easy",
        priority: "Medium",
        dueDate: "2025-07-12",
        estimatedTime: 1.5,
        description: "World War II timeline and key events",
        completed: false,
        createdAt: "2025-07-07T09:00:00"
    },
    {
        id: 3,
        title: "Programming Project",
        subject: "Programming",
        difficulty: "Hard",
        priority: "High",
        dueDate: "2025-07-15",
        estimatedTime: 5,
        description: "Build a web application using JavaScript and CSS",
        completed: true,
        createdAt: "2025-07-05T14:00:00"
    },
    {
        id: 4,
        title: "Science Lab Report",
        subject: "Science",
        difficulty: "Medium",
        priority: "Medium",
        dueDate: "2025-07-08",
        estimatedTime: 3,
        description: "Write report on chemical reactions experiment",
        completed: false,
        createdAt: "2025-07-06T11:00:00"
    }
];

// Render initial tasks and update stats
scheduler.renderTasks();
scheduler.updateStats();
