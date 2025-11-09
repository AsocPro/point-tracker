// Point Tracker App - Vanilla JavaScript

class PointTracker {
    constructor() {
        this.children = [];
        this.currentChild = null;
        this.isEditMode = false;
        this.pendingTransaction = null;
        this.currentTransactionAmount = '';

        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.renderChildren();
    }

    // LocalStorage Management
    loadData() {
        const data = localStorage.getItem('pointTrackerData');
        if (data) {
            const parsed = JSON.parse(data);
            this.children = parsed.children || [];
        }
    }

    saveData() {
        localStorage.setItem('pointTrackerData', JSON.stringify({
            children: this.children
        }));
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Main Page
        document.getElementById('editButton').addEventListener('click', () => this.toggleEditMode());
        document.getElementById('addChildButton').addEventListener('click', () => this.addChild());
        document.getElementById('newChildName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addChild();
        });

        // Number Pad Page
        document.getElementById('backButton').addEventListener('click', () => this.showMainPage());

        // Number pad buttons
        document.querySelectorAll('.num-button[data-num]').forEach(button => {
            button.addEventListener('click', () => this.addDigit(button.dataset.num));
        });

        document.querySelector('.num-button.clear').addEventListener('click', () => this.clearTransaction());
        document.querySelector('.num-button.backspace').addEventListener('click', () => this.backspace());

        // Action buttons
        document.getElementById('addPointsButton').addEventListener('click', () => this.prepareTransaction('add'));
        document.getElementById('removePointsButton').addEventListener('click', () => this.prepareTransaction('remove'));

        // Confirmation buttons
        document.getElementById('confirmTransaction').addEventListener('click', () => this.confirmTransaction());
        document.getElementById('cancelTransaction').addEventListener('click', () => this.cancelTransaction());

        // Modal buttons
        document.getElementById('modalConfirm').addEventListener('click', () => this.confirmDelete());
        document.getElementById('modalCancel').addEventListener('click', () => this.closeModal());
    }

    // Edit Mode
    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        const button = document.getElementById('editButton');
        const list = document.getElementById('childrenList');
        const form = document.getElementById('addChildForm');

        if (this.isEditMode) {
            button.textContent = 'Done';
            button.classList.add('done');
            list.classList.add('edit-mode');
            form.classList.remove('hidden');
        } else {
            button.textContent = 'Edit';
            button.classList.remove('done');
            list.classList.remove('edit-mode');
            form.classList.add('hidden');
            // Clear form
            document.getElementById('newChildName').value = '';
        }
    }

    // Child Management
    addChild() {
        const nameInput = document.getElementById('newChildName');
        const colorInput = document.getElementById('newChildColor');
        const name = nameInput.value.trim();

        if (!name) {
            alert('Please enter a name');
            return;
        }

        const child = {
            id: Date.now(),
            name: name,
            points: 0,
            color: colorInput.value,
            transactions: []
        };

        this.children.push(child);
        this.saveData();
        this.renderChildren();

        // Clear form
        nameInput.value = '';
        colorInput.value = '#FF6B6B';
    }

    deleteChild(id) {
        const child = this.children.find(c => c.id === id);
        if (!child) return;

        this.childToDelete = id;
        document.getElementById('modalMessage').textContent =
            `Are you sure you want to delete ${child.name}? This action is permanent and cannot be undone.`;
        document.getElementById('confirmModal').classList.remove('hidden');
    }

    confirmDelete() {
        if (this.childToDelete) {
            this.children = this.children.filter(c => c.id !== this.childToDelete);
            this.saveData();
            this.renderChildren();
            this.childToDelete = null;
        }
        this.closeModal();
    }

    closeModal() {
        document.getElementById('confirmModal').classList.add('hidden');
        this.childToDelete = null;
    }

    moveChild(id, direction) {
        const index = this.children.findIndex(c => c.id === id);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= this.children.length) return;

        // Swap elements
        [this.children[index], this.children[newIndex]] = [this.children[newIndex], this.children[index]];

        this.saveData();
        this.renderChildren();
    }

    // Rendering
    renderChildren() {
        const list = document.getElementById('childrenList');

        if (this.children.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <h2>No Children Added</h2>
                    <p>Click "Edit" to add your first child</p>
                </div>
            `;
            return;
        }

        list.innerHTML = this.children.map((child, index) => `
            <div class="child-item" style="border-left-color: ${child.color}"
                 onclick="app.openChild(${child.id})">
                <div class="child-info">
                    <h3>${this.escapeHtml(child.name)}</h3>
                    <div class="points">${child.points} points</div>
                </div>
                <div class="child-controls">
                    <button class="control-button up-button"
                            onclick="event.stopPropagation(); app.moveChild(${child.id}, 'up')"
                            ${index === 0 ? 'disabled' : ''}>▲</button>
                    <button class="control-button down-button"
                            onclick="event.stopPropagation(); app.moveChild(${child.id}, 'down')"
                            ${index === this.children.length - 1 ? 'disabled' : ''}>▼</button>
                    <button class="control-button delete-button"
                            onclick="event.stopPropagation(); app.deleteChild(${child.id})">×</button>
                </div>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Navigation
    openChild(id) {
        if (this.isEditMode) return;

        this.currentChild = this.children.find(c => c.id === id);
        if (!this.currentChild) return;

        this.showNumberPadPage();
    }

    showMainPage() {
        document.getElementById('mainPage').classList.add('active');
        document.getElementById('numberPadPage').classList.remove('active');
        this.currentChild = null;
        this.clearTransaction();
    }

    showNumberPadPage() {
        document.getElementById('mainPage').classList.remove('active');
        document.getElementById('numberPadPage').classList.add('active');

        // Set child header with background color
        const header = document.getElementById('childHeader');
        header.style.background = this.currentChild.color;

        document.getElementById('childName').textContent = this.currentChild.name;
        document.getElementById('currentPoints').textContent = `${this.currentChild.points} points`;

        this.renderTransactions();
        this.clearTransaction();
    }

    // Number Pad
    addDigit(digit) {
        // Limit to reasonable number length
        if (this.currentTransactionAmount.length >= 6) return;

        this.currentTransactionAmount += digit;
        this.updateTransactionDisplay();
    }

    backspace() {
        this.currentTransactionAmount = this.currentTransactionAmount.slice(0, -1);
        this.updateTransactionDisplay();
    }

    clearTransaction() {
        this.currentTransactionAmount = '';
        this.pendingTransaction = null;
        this.updateTransactionDisplay();
        this.hideConfirmSection();
    }

    updateTransactionDisplay() {
        const display = document.getElementById('transactionAmount');
        display.value = this.currentTransactionAmount || '0';

        const amount = parseInt(this.currentTransactionAmount) || 0;
        const addButton = document.getElementById('addPointsButton');
        const removeButton = document.getElementById('removePointsButton');

        if (amount > 0) {
            addButton.disabled = false;
            removeButton.disabled = false;
        } else {
            addButton.disabled = true;
            removeButton.disabled = true;
        }
    }

    // Transaction Management
    prepareTransaction(type) {
        const amount = parseInt(this.currentTransactionAmount);
        if (!amount || amount <= 0) return;

        this.pendingTransaction = { type, amount };

        const message = type === 'add'
            ? `Add ${amount} points to ${this.currentChild.name}?`
            : `Remove ${amount} points from ${this.currentChild.name}?`;

        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmSection').classList.remove('hidden');
    }

    confirmTransaction() {
        if (!this.pendingTransaction) return;

        const { type, amount } = this.pendingTransaction;

        if (type === 'add') {
            this.currentChild.points += amount;
        } else {
            this.currentChild.points -= amount;
            // Prevent negative points
            if (this.currentChild.points < 0) {
                this.currentChild.points = 0;
            }
        }

        // Add to transactions history
        this.currentChild.transactions.unshift({
            type,
            amount,
            timestamp: Date.now()
        });

        // Keep only last 3 transactions
        this.currentChild.transactions = this.currentChild.transactions.slice(0, 3);

        this.saveData();

        // Update display
        document.getElementById('currentPoints').textContent = `${this.currentChild.points} points`;
        this.renderTransactions();

        // Clear transaction
        this.clearTransaction();
    }

    cancelTransaction() {
        this.pendingTransaction = null;
        this.hideConfirmSection();
    }

    hideConfirmSection() {
        document.getElementById('confirmSection').classList.add('hidden');
    }

    renderTransactions() {
        const container = document.getElementById('transactionsList');

        if (!this.currentChild.transactions || this.currentChild.transactions.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 1rem;">No recent transactions</p>';
            return;
        }

        container.innerHTML = this.currentChild.transactions.map(t => {
            const time = this.formatTime(t.timestamp);
            const sign = t.type === 'add' ? '+' : '-';

            return `
                <div class="transaction-item ${t.type}">
                    <span class="amount">${sign}${t.amount}</span>
                    <span class="time">${time}</span>
                </div>
            `;
        }).join('');
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        // If today, show time
        if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // Otherwise show date
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

// Initialize app
const app = new PointTracker();
