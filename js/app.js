/**
 * ==========================================
 * EXPENSE & BUDGET VISUALIZER - MAIN APPLICATION
 * ==========================================
 * 
 * A vanilla JavaScript SPA for tracking personal expenses
 * with real-time visualization and persistent Local Storage
 */

'use strict';

// ==========================================
// 1. STATE STORE & EVENT MANAGEMENT
// ==========================================

/**
 * Global State Store - Singleton pattern
 * Manages all application state and notifies listeners of changes
 */
class StateStore {
    constructor() {
        this.state = {
            transactions: [],
            categories: [
                { id: 'food', name: 'Food', color: '#FF6B6B', default: true },
                { id: 'transport', name: 'Transport', color: '#4ECDC4', default: true },
                { id: 'fun', name: 'Fun', color: '#FFE66D', default: true }
            ],
            spendingLimits: {},
            selectedMonth: this.getCurrentMonth()
        };
        
        this.listeners = [];
    }
    
    subscribe(listener) {
        this.listeners.push(listener);
    }
    
    unsubscribe(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }
    
    notify(action, data) {
        this.listeners.forEach(listener => {
            try {
                listener(action, data, this.state);
            } catch (error) {
                console.error('Error in state listener:', error);
            }
        });
    }
    
    getState() {
        return this.state;
    }
    
    setState(newState) {
        this.state = { ...this.state, ...newState };
    }
    
    getCurrentMonth() {
        const now = new Date();
        return {
            year: now.getFullYear(),
            month: now.getMonth() + 1
        };
    }
}

// Global state store instance
const stateStore = new StateStore();

// Event type constants
const EVENT_TYPES = {
    TRANSACTION_ADDED: 'transaction:added',
    TRANSACTION_DELETED: 'transaction:deleted',
    CATEGORY_ADDED: 'category:added',
    CATEGORY_DELETED: 'category:deleted',
    LIMIT_UPDATED: 'limit:updated',
    STATE_CHANGED: 'state:changed'
};

// ==========================================
// 2. LOCAL STORAGE INTERFACE
// ==========================================

/**
 * LocalStorage - Handles all persistent data storage
 */
const LocalStorage = {
    KEYS: {
        TRANSACTIONS: 'app_transactions',
        CATEGORIES: 'app_categories',
        SPENDING_LIMITS: 'app_spending_limits',
        METADATA: 'app_metadata'
    },
    
    /**
     * Load all data from Local Storage
     */
    loadFromStorage() {
        try {
            const transactions = JSON.parse(localStorage.getItem(this.KEYS.TRANSACTIONS)) || [];
            const categories = JSON.parse(localStorage.getItem(this.KEYS.CATEGORIES)) || [];
            const spendingLimits = JSON.parse(localStorage.getItem(this.KEYS.SPENDING_LIMITS)) || {};
            
            // Merge with default categories
            const defaultCategories = stateStore.state.categories.filter(c => c.default);
            const customCategories = categories.filter(c => !c.default);
            
            return {
                transactions,
                categories: [...defaultCategories, ...customCategories],
                spendingLimits
            };
        } catch (error) {
            console.error('Error loading from Local Storage:', error);
            return null;
        }
    },
    
    /**
     * Save all data to Local Storage
     */
    saveToStorage(state) {
        try {
            const customCategories = state.categories.filter(c => !c.default);
            localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
            localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(customCategories));
            localStorage.setItem(this.KEYS.SPENDING_LIMITS, JSON.stringify(state.spendingLimits));
            localStorage.setItem(this.KEYS.METADATA, JSON.stringify({
                version: '1.0',
                lastUpdated: Date.now()
            }));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                showErrorMessage('Storage penuh. Silakan clear data lama atau gunakan device berbeda.');
            } else {
                console.error('Error saving to Local Storage:', error);
            }
        }
    },
    
    /**
     * Clear all data from Local Storage (for debugging)
     */
    clearStorage() {
        try {
            Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
            console.log('Local Storage cleared');
        } catch (error) {
            console.error('Error clearing Local Storage:', error);
        }
    }
};

// ==========================================
// 3. UTILITY FUNCTIONS
// ==========================================

/**
 * Generate unique ID for transactions
 */
function generateId() {
    return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Format number to IDR currency format
 * Example: 150000 -> "Rp 150.000"
 */
function formatIDR(amount) {
    if (!amount || amount < 0) return 'Rp 0';
    
    const formatter = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    
    return formatter.format(amount);
}

/**
 * Get current date in YYYY-MM-DD format
 */
function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

/**
 * Get current time in HH:MM format
 */
function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Parse date string to display format
 */
function formatDate(dateString, includeTime = false) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    
    let formatted = date.toLocaleDateString('id-ID', options);
    
    // Include time if provided in transaction object
    if (includeTime && includeTime !== true) {
        formatted += ' ' + includeTime;
    }
    
    return formatted;
}

/**
 * Get month name from number
 */
function getMonthName(monthNumber) {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[monthNumber - 1];
}

/**
 * Show error message to user
 */
function showErrorMessage(message) {
    alert(message); // Simple alert for now, can be enhanced with toast notifications
}

/**
 * Show success message to user
 */
function showSuccessMessage(message) {
    console.log('Success:', message); // Can be enhanced with toast notifications
}

/**
 * parseMonth(year, month) - Parse year and month integers to formatted string
 * Returns month name in Indonesian format with year
 * Example: parseMonth(2024, 12) → 'Desember 2024'
 * 
 * Requirements: 7.1 (monthly summary display)
 * @param {number} year - Year (e.g., 2024)
 * @param {number} month - Month number (1-12)
 * @returns {string} Formatted month string (e.g., 'Desember 2024')
 */
function parseMonth(year, month) {
    const monthNames = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember'
    ];
    
    // Ensure month is valid (1-12)
    const validMonth = Math.max(1, Math.min(12, month));
    const monthName = monthNames[validMonth - 1];
    
    return `${monthName} ${year}`;
}

/**
 * getMonthKey(year, month) - Generate month key for storage
 * Returns 'YYYY-MM' format for use as key in spendingLimits storage
 * Example: getMonthKey(2024, 12) → '2024-12'
 * 
 * Requirements: 8.3 (spending limit storage by month)
 * @param {number} year - Year (e.g., 2024)
 * @param {number} month - Month number (1-12)
 * @returns {string} Month key in YYYY-MM format
 */
function getMonthKey(year, month) {
    const paddedMonth = String(month).padStart(2, '0');
    return `${year}-${paddedMonth}`;
}

// ==========================================
// 4. TRANSACTION MANAGEMENT
// ==========================================

/**
 * Add a new transaction
 */
function addTransaction(itemName, amount, category) {
    const state = stateStore.getState();
    
    const transaction = {
        id: generateId(),
        itemName,
        amount: parseFloat(amount),
        category,
        date: getCurrentDate(),
        timestamp: Date.now(),
        time: getCurrentTime()
    };
    
    state.transactions.unshift(transaction); // Add to beginning (newest first)
    stateStore.setState(state);
    LocalStorage.saveToStorage(state);
    
    stateStore.notify(EVENT_TYPES.TRANSACTION_ADDED, transaction);
}

/**
 * Delete a transaction
 */
function deleteTransaction(transactionId) {
    const state = stateStore.getState();
    const transaction = state.transactions.find(t => t.id === transactionId);
    
    state.transactions = state.transactions.filter(t => t.id !== transactionId);
    stateStore.setState(state);
    LocalStorage.saveToStorage(state);
    
    stateStore.notify(EVENT_TYPES.TRANSACTION_DELETED, transaction);
}

/**
 * Get transactions for a specific month
 */
function getMonthlyTransactions(year, month) {
    const state = stateStore.getState();
    const monthString = `${year}-${String(month).padStart(2, '0')}`;
    
    return state.transactions.filter(t => {
        return t.date.startsWith(monthString);
    });
}

/**
 * Calculate total spending
 */
function calculateTotalSpending() {
    const state = stateStore.getState();
    return state.transactions.reduce((total, t) => total + t.amount, 0);
}

/**
 * Calculate monthly spending
 */
function calculateMonthlySpending(year, month) {
    const transactions = getMonthlyTransactions(year, month);
    return transactions.reduce((total, t) => total + t.amount, 0);
}

// ==========================================
// 5. CATEGORY MANAGEMENT
// ==========================================

/**
 * Get all categories
 */
function getCategories() {
    return stateStore.getState().categories;
}

/**
 * Get category by ID
 */
function getCategoryById(categoryId) {
    return getCategories().find(c => c.id === categoryId);
}

/**
 * Add a custom category
 */
function addCustomCategory(categoryName, color) {
    const state = stateStore.getState();
    
    // Validate
    if (!categoryName || categoryName.trim() === '') {
        showErrorMessage('Nama kategori tidak boleh kosong');
        return false;
    }
    
    // Check for duplicate (case-insensitive)
    const isDuplicate = state.categories.some(c => 
        c.name.toLowerCase() === categoryName.toLowerCase()
    );
    
    if (isDuplicate) {
        showErrorMessage('Kategori sudah ada');
        return false;
    }
    
    if (!color || color.trim() === '') {
        showErrorMessage('Warna kategori tidak boleh kosong');
        return false;
    }
    
    const newCategory = {
        id: 'cat_' + Date.now(),
        name: categoryName,
        color: color,
        default: false
    };
    
    state.categories.push(newCategory);
    stateStore.setState(state);
    LocalStorage.saveToStorage(state);
    
    stateStore.notify(EVENT_TYPES.CATEGORY_ADDED, newCategory);
    return true;
}

/**
 * Delete a custom category
 */
function deleteCustomCategory(categoryId, reassignToCategory = null) {
    const state = stateStore.getState();
    const category = getCategoryById(categoryId);
    
    if (!category) return false;
    
    // Cannot delete default categories
    if (category.default) {
        showErrorMessage('Tidak bisa menghapus kategori default');
        return false;
    }
    
    // Check if category is in use
    const usedInTransactions = state.transactions.filter(t => t.category === categoryId);
    
    if (usedInTransactions.length > 0 && !reassignToCategory) {
        // Return the count so UI can show reassignment dialog
        return { inUse: true, count: usedInTransactions.length };
    }
    
    // Reassign transactions if needed
    if (reassignToCategory) {
        usedInTransactions.forEach(t => {
            t.category = reassignToCategory;
        });
    }
    
    // Remove category
    state.categories = state.categories.filter(c => c.id !== categoryId);
    stateStore.setState(state);
    LocalStorage.saveToStorage(state);
    
    stateStore.notify(EVENT_TYPES.CATEGORY_DELETED, category);
    return true;
}

/**
 * Get spending by category
 */
function getSpendingByCategory(transactions = null) {
    const txns = transactions || stateStore.getState().transactions;
    const spending = {};
    
    getCategories().forEach(cat => {
        spending[cat.id] = {
            name: cat.name,
            color: cat.color,
            amount: 0
        };
    });
    
    txns.forEach(t => {
        if (spending[t.category]) {
            spending[t.category].amount += t.amount;
        }
    });
    
    return spending;
}

// ==========================================
// 6. SPENDING LIMIT MANAGEMENT
// ==========================================

/**
 * Set spending limit for a month
 */
function setSpendingLimit(year, month, limitAmount) {
    const state = stateStore.getState();
    
    if (!limitAmount || limitAmount <= 0) {
        showErrorMessage('Limit harus angka positif');
        return false;
    }
    
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    state.spendingLimits[monthKey] = parseFloat(limitAmount);
    
    stateStore.setState(state);
    LocalStorage.saveToStorage(state);
    
    stateStore.notify(EVENT_TYPES.LIMIT_UPDATED, { month: monthKey, limit: limitAmount });
    return true;
}

/**
 * Get spending limit for a month
 */
function getSpendingLimit(year, month) {
    const state = stateStore.getState();
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    return state.spendingLimits[monthKey] || null;
}

/**
 * Calculate spending limit status
 */
function calculateLimitStatus(monthlySpending, limitAmount) {
    if (!limitAmount) {
        return {
            status: 'NOT_SET',
            message: 'Limit belum diatur',
            color: '#BDBDBD',
            remaining: null,
            percentage: 0
        };
    }
    
    const percentage = (monthlySpending / limitAmount) * 100;
    
    if (percentage < 80) {
        return {
            status: 'NORMAL',
            message: `Rp ${formatIDR(limitAmount - monthlySpending).replace('Rp ', '')} tersisa dari limit Rp ${formatIDR(limitAmount).replace('Rp ', '')}`,
            color: '#4CAF50',
            remaining: limitAmount - monthlySpending,
            percentage
        };
    } else if (percentage < 100) {
        return {
            status: 'WARNING',
            message: `Perhatian! Sudah ${Math.round(percentage)}% dari limit`,
            color: '#FF9800',
            remaining: limitAmount - monthlySpending,
            percentage
        };
    } else {
        return {
            status: 'EXCEEDED',
            message: `Limit terlampaui Rp ${formatIDR(monthlySpending - limitAmount).replace('Rp ', '')}`,
            color: '#F44336',
            remaining: monthlySpending - limitAmount,
            percentage
        };
    }
}

// ==========================================
// 7. RENDER FUNCTIONS
// ==========================================

/**
 * Render header with total spending
 */
function renderHeader() {
    const totalSpending = calculateTotalSpending();
    const totalElement = document.getElementById('totalSpendingDisplay');
    if (totalElement) {
        totalElement.textContent = formatIDR(totalSpending);
    }
}

/**
 * Render form with categories
 */
function renderForm() {
    const categorySelect = document.getElementById('category');
    if (!categorySelect) return;
    
    // Clear existing options (except first)
    while (categorySelect.options.length > 1) {
        categorySelect.remove(1);
    }
    
    // Add category options
    getCategories().forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        categorySelect.appendChild(option);
    });
}

/**
 * Render transaction list
 */
function renderTransactionList() {
    const state = stateStore.getState();
    const listContainer = document.getElementById('transactionList');
    const emptyState = document.getElementById('emptyState');
    
    if (!listContainer) return;
    
    // Clear list
    listContainer.innerHTML = '';
    
    if (state.transactions.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    state.transactions.forEach(transaction => {
        const category = getCategoryById(transaction.category);
        const li = document.createElement('li');
        li.className = 'transaction-item';
        li.dataset.transactionId = transaction.id;
        
        li.innerHTML = `
            <div class="transaction-content">
                <div class="transaction-main">
                    <span class="transaction-name">${escapeHtml(transaction.itemName)}</span>
                    <span class="transaction-category" style="background-color: ${category?.color || '#999'}">
                        ${category?.name || 'Unknown'}
                    </span>
                </div>
                <div class="transaction-meta">
                    <span class="transaction-amount">${formatIDR(transaction.amount)}</span>
                    <span class="transaction-date">${formatDate(transaction.date, transaction.time)}</span>
                </div>
            </div>
            <button class="btn-delete" data-delete-id="${transaction.id}">Hapus</button>
        `;
        
        listContainer.appendChild(li);
    });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Render monthly summary
 */
function renderMonthlySummary() {
    const state = stateStore.getState();
    const month = state.selectedMonth;
    
    const monthDisplay = document.getElementById('monthDisplay');
    const monthlyTotal = document.getElementById('monthlySummaryTotal');
    const transactionCount = document.getElementById('monthlyTransactionCount');
    
    if (monthDisplay) {
        monthDisplay.textContent = `${getMonthName(month.month)} ${month.year}`;
    }
    
    const monthlyTransactions = getMonthlyTransactions(month.year, month.month);
    const monthlySpending = calculateMonthlySpending(month.year, month.month);
    
    if (monthlyTotal) {
        monthlyTotal.textContent = formatIDR(monthlySpending);
    }
    
    if (transactionCount) {
        transactionCount.textContent = monthlyTransactions.length;
    }
    
    renderMiniPieChart();
}

/**
 * Render spending limit alert
 */
function renderSpendingLimitAlert() {
    const state = stateStore.getState();
    const month = state.selectedMonth;
    
    const limitStatusDisplay = document.getElementById('limitStatusDisplay');
    if (!limitStatusDisplay) return;
    
    const monthlySpending = calculateMonthlySpending(month.year, month.month);
    const limit = getSpendingLimit(month.year, month.month);
    const status = calculateLimitStatus(monthlySpending, limit);
    
    let statusClass = status.status.toLowerCase();
    if (statusClass === 'not_set') statusClass = 'not-set';
    
    limitStatusDisplay.className = `limit-status-display ${statusClass}`;
    limitStatusDisplay.innerHTML = `
        <div class="limit-status-text" style="color: ${status.color}">
            ${status.message}
        </div>
    `;
}

/*** Render main pie chart*/
function renderMainPieChart() {
    const canvas = document.getElementById('mainPieChart');
    const emptyMessage = document.getElementById('emptyMainChartMessage');

    if (!canvas) return;

    // Hapus grafik sebelumnya
    if (window.mainChart) {
        window.mainChart.destroy();
        window.mainChart = null;
    }

    const transactions = stateStore.getState().transactions;
    const spending = getSpendingByCategory(transactions);

    // Ambil kategori yang memiliki pengeluaran
    const chartData = Object.values(spending).filter(
        category => category.amount > 0
    );

    if (chartData.length === 0) {
        canvas.style.display = 'none';
        if (emptyMessage) emptyMessage.style.display = 'flex';
        return;
    }

    canvas.style.display = 'block';
    if (emptyMessage) emptyMessage.style.display = 'none';

    window.mainChart = new Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: {
            labels: chartData.map(item => item.name),
            datasets: [{
                data: chartData.map(item => item.amount),
                backgroundColor: chartData.map(item => item.color),
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce(
                                (sum, value) => sum + value, 0
                            );
                            const percentage = (
                                context.parsed / total * 100
                            ).toFixed(1);

                            return `${context.label}: ${formatIDR(context.parsed)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}
    // Destroy existing chart if it exists
    if (window.mainChart) {
        window.mainChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    window.mainChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const amount = formatIDR(context.parsed);
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${amount} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });


/*** Render mini pie chart*/
function renderMiniPieChart() {
    const canvas = document.getElementById('miniPieChart');
    const emptyMessage = document.getElementById('emptyMiniChartMessage');

    if (!canvas) return;

    // Hapus grafik sebelumnya
    if (window.miniChart) {
        window.miniChart.destroy();
        window.miniChart = null;
    }

    const state = stateStore.getState();
    const { year, month } = state.selectedMonth;

    // Hanya mengambil transaksi pada bulan yang dipilih
    const transactions = getMonthlyTransactions(year, month);
    const spending = getSpendingByCategory(transactions);

    const chartData = Object.values(spending).filter(
        category => category.amount > 0
    );

    if (chartData.length === 0) {
        canvas.style.display = 'none';
        if (emptyMessage) emptyMessage.style.display = 'flex';
        return;
    }

    canvas.style.display = 'block';
    if (emptyMessage) emptyMessage.style.display = 'none';

    window.miniChart = new Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: {
            labels: chartData.map(item => item.name),
            datasets: [{
                data: chartData.map(item => item.amount),
                backgroundColor: chartData.map(item => item.color),
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        padding: 10,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce(
                                (sum, value) => sum + value, 0
                            );
                            const percentage = (
                                context.parsed / total * 100
                            ).toFixed(1);

                            return `${context.label}: ${formatIDR(context.parsed)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Render category manager
 */
function renderCategoryManager() {
    const defaultList = document.getElementById('defaultCategoriesList');
    const customList = document.getElementById('customCategoriesList');
    
    if (!defaultList || !customList) return;
    
    // Render default categories
    defaultList.innerHTML = '';
    const defaultCats = getCategories().filter(c => c.default);
    defaultCats.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'category-item';
        div.innerHTML = `
            <span class="category-color" style="background-color: ${cat.color}"></span>
            <span class="category-name">${cat.name}</span>
            <span class="category-badge">(tidak bisa dihapus)</span>
        `;
        defaultList.appendChild(div);
    });
    
    // Render custom categories
    customList.innerHTML = '';
    const customCats = getCategories().filter(c => !c.default);
    if (customCats.length === 0) {
        customList.innerHTML = '<p style="color: #999; font-style: italic;">Tidak ada kategori custom</p>';
    } else {
        customCats.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'category-item';
            div.innerHTML = `
                <span class="category-color" style="background-color: ${cat.color}"></span>
                <span class="category-name">${cat.name}</span>
                <button class="category-delete-btn" data-delete-id="${cat.id}">Hapus</button>
            `;
            customList.appendChild(div);
        });
    }
}

/**
 * Update all dependent components
 */
function updateAllDependents() {
    renderHeader();
    renderTransactionList();
    renderMonthlySummary();
    renderSpendingLimitAlert();
    renderMainPieChart();
    renderMiniPieChart();
    renderForm();
    renderCategoryManager();
}

// ==========================================
// 8. EVENT HANDLERS
// ==========================================

/**
 * Setup form submission handler
 */
function setupFormHandlers() {
    const form = document.getElementById('transactionForm');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const itemName = document.getElementById('itemName').value.trim();
        const amount = document.getElementById('amount').value;
        const category = document.getElementById('category').value;
        
        // Clear previous errors
        document.getElementById('itemNameError').textContent = '';
        document.getElementById('amountError').textContent = '';
        document.getElementById('categoryError').textContent = '';
        
        let hasError = false;
        
        // Validate Item Name
        if (!itemName) {
            document.getElementById('itemNameError').textContent = 'Item Name wajib diisi';
            hasError = true;
        } else if (itemName.length > 50) {
            document.getElementById('itemNameError').textContent = 'Item Name maksimal 50 karakter';
            hasError = true;
        }
        
        // Validate Amount
        if (!amount || parseFloat(amount) <= 0) {
            document.getElementById('amountError').textContent = 'Jumlah harus angka positif';
            hasError = true;
        }
        
        // Validate Category
        if (!category) {
            document.getElementById('categoryError').textContent = 'Kategori wajib dipilih';
            hasError = true;
        }
        
        if (hasError) return;
        
        // Add transaction
        addTransaction(itemName, parseFloat(amount), category);
        
        // Reset form
        form.reset();
        document.getElementById('itemName').focus();
        
        updateAllDependents();
        showSuccessMessage('Transaksi berhasil ditambahkan');
    });
}

/**
 * Setup delete transaction handler
 */
function setupDeleteHandler() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete')) {
            const transactionId = e.target.dataset.deleteId;
            if (confirm('Hapus transaksi ini?')) {
                deleteTransaction(transactionId);
                updateAllDependents();
                showSuccessMessage('Transaksi berhasil dihapus');
            }
        }
    });
}

/**
 * Setup month navigation handlers
 */
function setupMonthNavigation() {
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    
    if (!prevBtn || !nextBtn) return;
    
    prevBtn.addEventListener('click', () => {
        const state = stateStore.getState();
        let { year, month } = state.selectedMonth;
        
        month--;
        if (month < 1) {
            month = 12;
            year--;
        }
        
        state.selectedMonth = { year, month };
        stateStore.setState(state);
        updateAllDependents();
    });
    
    nextBtn.addEventListener('click', () => {
        const state = stateStore.getState();
        let { year, month } = state.selectedMonth;
        
        month++;
        if (month > 12) {
            month = 1;
            year++;
        }
        
        state.selectedMonth = { year, month };
        stateStore.setState(state);
        updateAllDependents();
    });
}

/**
 * Setup add category handlers
 */
function setupAddCategoryHandlers() {
    const buttons = document.querySelectorAll('#addCategoryBtn, #addCategoryBtn2');
    const modal = document.getElementById('addCategoryModal');
    const closeBtn = document.getElementById('closeAddCategoryModal');
    const cancelBtn = document.getElementById('cancelCategoryBtn');
    const form = document.getElementById('addCategoryForm');
    
    if (!modal || !form) return;
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.display = 'flex';
            form.reset();
            document.getElementById('categoryNameError').textContent = '';
        });
    });
    
    closeBtn?.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    cancelBtn?.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const categoryName = document.getElementById('categoryName').value.trim();
        const categoryColor = document.getElementById('categoryColor').value;
        
        document.getElementById('categoryNameError').textContent = '';
        
        if (addCustomCategory(categoryName, categoryColor)) {
            modal.style.display = 'none';
            form.reset();
            updateAllDependents();
            showSuccessMessage('Kategori berhasil ditambahkan');
        }
    });
}

/**
 * Setup delete category handlers
 */
function setupDeleteCategoryHandlers() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-delete-btn')) {
            const categoryId = e.target.dataset.deleteId;
            const result = deleteCustomCategory(categoryId);
            
            if (result && result.inUse) {
                // Show reassignment dialog
                alert(`Kategori ini digunakan oleh ${result.count} transaksi. Fitur reassignment akan diimplementasikan di task berikutnya.`);
            } else if (result === true) {
                updateAllDependents();
                showSuccessMessage('Kategori berhasil dihapus');
            }
        }
    });
}

/**
 * Setup spending limit handlers
 */
function setupSpendingLimitHandlers() {
    const setBtn = document.getElementById('setLimitBtn');
    const editBtn = document.getElementById('editLimitBtn');
    const modal = document.getElementById('limitModal');
    const closeBtn = document.getElementById('closeLimitModal');
    const cancelBtn = document.getElementById('cancelLimitBtn');
    const form = document.getElementById('limitForm');
    
    if (!modal || !form) return;
    
    const openLimitModal = () => {
        const state = stateStore.getState();
        const month = state.selectedMonth;
        
        document.getElementById('limitMonth').value = `${getMonthName(month.month)} ${month.year}`;
        
        const existingLimit = getSpendingLimit(month.year, month.month);
        document.getElementById('limitAmount').value = existingLimit || '';
        document.getElementById('limitError').textContent = '';
        
        modal.style.display = 'flex';
    };
    
    setBtn?.addEventListener('click', openLimitModal);
    editBtn?.addEventListener('click', openLimitModal);
    
    closeBtn?.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    cancelBtn?.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const state = stateStore.getState();
        const month = state.selectedMonth;
        const limitAmount = document.getElementById('limitAmount').value;
        
        document.getElementById('limitError').textContent = '';
        
        if (setSpendingLimit(month.year, month.month, parseFloat(limitAmount))) {
            modal.style.display = 'none';
            form.reset();
            updateAllDependents();
            showSuccessMessage('Spending limit berhasil disimpan');
        } else {
            document.getElementById('limitError').textContent = 'Limit harus angka positif';
        }
    });
}

// ==========================================
// 9. APP INITIALIZATION
// ==========================================

/**
 * Initialize application
 */
function initializeApp() {
    console.log('Initializing Expense & Budget Visualizer...');
    
    // Load data from Local Storage
    const savedData = LocalStorage.loadFromStorage();
    if (savedData) {
        const state = stateStore.getState();
        state.transactions = savedData.transactions;
        state.categories = savedData.categories;
        state.spendingLimits = savedData.spendingLimits;
        stateStore.setState(state);
    }
    
    // Setup event listeners for state changes
    stateStore.subscribe((action, data, state) => {
        console.log('State changed:', action, data);
    });
    
    // Setup UI event handlers
    setupFormHandlers();
    setupDeleteHandler();
    setupMonthNavigation();
    setupAddCategoryHandlers();
    setupDeleteCategoryHandlers();
    setupSpendingLimitHandlers();
    
    // Initial render
    updateAllDependents();
    
    console.log('Application initialized successfully');
}

// ==========================================
// 10. START APPLICATION
// ==========================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}


// ============================================================================
// LOCAL STORAGE INTERFACE
// ============================================================================

/**
 * saveToLocalStorage() - Save application state to Browser Local Storage
 * Persists transactions, categories, spending limits, and metadata
 * Handles quota exceeded errors gracefully
 * 
 * Requirements: 9.1, 9.4 (persistent data storage)
 */
function saveToLocalStorage() {
  try {
    const state = stateStore.getState();
    
    const data = {
      app_transactions: state.transactions,
      app_categories: state.categories,
      app_spending_limits: state.spendingLimits,
      app_metadata: {
        version: '1.0',
        lastUpdated: Date.now()
      }
    };

    // Serialize to JSON and save to Local Storage
    Object.keys(data).forEach(key => {
      localStorage.setItem(key, JSON.stringify(data[key]));
    });
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      // Handle storage quota exceeded
      console.error('Storage penuh. Silakan clear data lama atau gunakan device berbeda.');
      alert('Storage penuh. Silakan clear data lama atau gunakan device berbeda.');
    } else {
      console.error('Error saving to Local Storage:', error);
    }
  }
}

/**
 * loadFromLocalStorage() - Load application state from Browser Local Storage
 * Restores transactions, categories, and spending limits
 * Validates data on load and handles missing/corrupted data
 * 
 * Requirements: 9.2, 9.3 (load data on app start, restore UI state)
 */
function loadFromLocalStorage() {
  try {
    // Load transactions
    const transactionsData = localStorage.getItem('app_transactions');
    if (transactionsData) {
      stateStore.setState('transactions', JSON.parse(transactionsData));
    } else {
      stateStore.setState('transactions', []);
    }

    // Load categories
    const categoriesData = localStorage.getItem('app_categories');
    if (categoriesData) {
      stateStore.setState('categories', JSON.parse(categoriesData));
    } else {
      stateStore.setState('categories', []);
    }

    // Load spending limits
    const limitsData = localStorage.getItem('app_spending_limits');
    if (limitsData) {
      stateStore.setState('spendingLimits', JSON.parse(limitsData));
    } else {
      stateStore.setState('spendingLimits', {});
    }

    return true;
  } catch (error) {
    console.error('Error loading from Local Storage:', error);
    return false;
  }
}

/**
 * clearLocalStorage() - Clear all application data from Local Storage
 * Useful for debugging and reset functionality
 * 
 * Requirements: Debug/reset utility
 */
function clearLocalStorage() {
  localStorage.removeItem('app_transactions');
  localStorage.removeItem('app_categories');
  localStorage.removeItem('app_spending_limits');
  localStorage.removeItem('app_metadata');
}


// ============================================================================
// CORE TRANSACTION MANAGEMENT
// ============================================================================

/**
 * addTransaction(itemName, amount, category) - Add new transaction
 * Generates unique ID, captures date/time, adds to state
 * Triggers cascade updates after addition
 * 
 * Requirements: 1.3, 1.8, 3.1
 * @param {string} itemName - Transaction item name
 * @param {number} amount - Transaction amount in rupiah
 * @param {string} category - Category ID
 * @returns {Object} The created transaction object
 */
function addTransaction(itemName, amount, category) {
  const transaction = {
    id: generateId(),
    itemName: itemName,
    amount: Number(amount),
    category: category,
    date: getCurrentDate(),
    timestamp: Date.now(),
    time: getCurrentTime()
  };

  const state = stateStore.getState();
  state.transactions.push(transaction);

  // Sort by timestamp descending (newest first)
  state.transactions.sort((a, b) => b.timestamp - a.timestamp);

  // Save to Local Storage
  saveToLocalStorage();

  // Notify listeners of transaction addition
  stateStore.notify(EVENT_TYPES.TRANSACTION_ADDED, transaction);

  // Trigger cascade updates
  updateAllDependents();

  return transaction;
}

/**
 * deleteTransaction(transactionId) - Delete transaction by ID
 * Removes transaction from state and triggers cascade updates
 * 
 * Requirements: 3.1, 3.2
 * @param {string} transactionId - Transaction ID to delete
 * @returns {Object|null} The deleted transaction or null if not found
 */
function deleteTransaction(transactionId) {
  const state = stateStore.getState();
  const transactionIndex = state.transactions.findIndex(t => t.id === transactionId);

  if (transactionIndex === -1) {
    console.warn(`Transaction ${transactionId} not found`);
    return null;
  }

  const deletedTransaction = state.transactions[transactionIndex];
  state.transactions.splice(transactionIndex, 1);

  // Save to Local Storage
  saveToLocalStorage();

  // Notify listeners of transaction deletion
  stateStore.notify(EVENT_TYPES.TRANSACTION_DELETED, deletedTransaction);

  // Trigger cascade updates
  updateAllDependents();

  return deletedTransaction;
}


// ============================================================================
// CATEGORY MANAGEMENT
// ============================================================================

/**
 * getCategories() - Get all categories (default + custom)
 * Returns merged array of default and custom categories
 * 
 * Requirements: 6.1
 * @returns {Array} Array of all categories
 */
function getCategories() {
  const defaultCategories = [
    { id: 'food', name: 'Food', color: '#FF6B6B', default: true },
    { id: 'transport', name: 'Transport', color: '#4ECDC4', default: true },
    { id: 'fun', name: 'Fun', color: '#FFE66D', default: true }
  ];

  const state = stateStore.getState();
  return [...defaultCategories, ...state.categories];
}

/**
 * getCategoryById(categoryId) - Get category by ID
 * @param {string} categoryId - Category ID to find
 * @returns {Object|null} Category object or null if not found
 */
function getCategoryById(categoryId) {
  const allCategories = getCategories();
  return allCategories.find(c => c.id === categoryId) || null;
}

/**
 * addCustomCategory(categoryName, color) - Add custom category
 * Validates name (unique, non-empty) and color
 * Generates unique category ID
 * 
 * Requirements: 6.2, 6.3, 6.4
 * @param {string} categoryName - Name of new category
 * @param {string} color - Hex color code (e.g., '#FF6B6B')
 * @returns {Object|null} Created category or null if validation fails
 */
function addCustomCategory(categoryName, color) {
  // Validate inputs
  if (!categoryName || categoryName.trim() === '') {
    console.error('Category name cannot be empty');
    return null;
  }

  if (!color || color === '') {
    console.error('Category color cannot be empty');
    return null;
  }

  // Check for duplicate category name (case-insensitive)
  const allCategories = getCategories();
  const isDuplicate = allCategories.some(
    c => c.name.toLowerCase() === categoryName.toLowerCase()
  );

  if (isDuplicate) {
    console.error('Category already exists');
    return null;
  }

  // Generate unique ID from category name (lowercase with dashes)
  const categoryId = categoryName.toLowerCase().replace(/\s+/g, '_');

  const newCategory = {
    id: categoryId,
    name: categoryName,
    color: color,
    default: false
  };

  const state = stateStore.getState();
  state.categories.push(newCategory);

  // Save to Local Storage
  saveToLocalStorage();

  // Notify listeners
  stateStore.notify(EVENT_TYPES.CATEGORY_ADDED, newCategory);

  // Trigger cascade updates
  updateAllDependents();

  return newCategory;
}

/**
 * deleteCustomCategory(categoryId) - Delete custom category
 * Only custom categories can be deleted (not defaults)
 * If in use, returns list of affected transactions
 * 
 * Requirements: 6.7, 6.8, 6.9
 * @param {string} categoryId - Category ID to delete
 * @param {string} [reassignTo] - Optional category ID to reassign transactions to
 * @returns {Object} Result object with status and affected transactions
 */
function deleteCustomCategory(categoryId, reassignTo = null) {
  // Check if category exists
  const category = getCategoryById(categoryId);
  if (!category) {
    return { status: 'error', message: 'Category not found' };
  }

  // Check if it's a default category
  if (category.default) {
    return { status: 'error', message: 'Cannot delete default category' };
  }

  const state = stateStore.getState();

  // Find transactions using this category
  const affectedTransactions = state.transactions.filter(t => t.category === categoryId);

  // If in use and no reassignment target, return affected transactions
  if (affectedTransactions.length > 0 && !reassignTo) {
    return {
      status: 'in_use',
      affectedCount: affectedTransactions.length,
      affectedTransactions: affectedTransactions
    };
  }

  // If reassignTo is provided, reassign transactions
  if (reassignTo && affectedTransactions.length > 0) {
    affectedTransactions.forEach(t => {
      t.category = reassignTo;
    });
  }

  // Remove category from custom categories
  state.categories = state.categories.filter(c => c.id !== categoryId);

  // Save to Local Storage
  saveToLocalStorage();

  // Notify listeners
  stateStore.notify(EVENT_TYPES.CATEGORY_DELETED, category);

  // Trigger cascade updates
  updateAllDependents();

  return {
    status: 'deleted',
    message: 'Category deleted successfully',
    reassignedCount: affectedTransactions.length
  };
}


// ============================================================================
// SPENDING LIMIT MANAGEMENT
// ============================================================================

/**
 * setSpendingLimit(year, month, limitAmount) - Set monthly spending limit
 * Validates amount > 0 and stores with YYYY-MM format key
 * 
 * Requirements: 8.3, 8.4, 8.5
 * @param {number} year - Year
 * @param {number} month - Month number (1-12)
 * @param {number} limitAmount - Limit amount in rupiah
 * @returns {boolean} True if successfully set
 */
function setSpendingLimit(year, month, limitAmount) {
  // Validate amount
  if (limitAmount <= 0) {
    console.error('Limit amount must be positive');
    return false;
  }

  const monthKey = getMonthKey(year, month);
  const state = stateStore.getState();

  state.spendingLimits[monthKey] = Number(limitAmount);

  // Save to Local Storage
  saveToLocalStorage();

  // Notify listeners
  stateStore.notify(EVENT_TYPES.LIMIT_UPDATED, { month: monthKey, limit: limitAmount });

  // Trigger cascade updates
  updateAllDependents();

  return true;
}

/**
 * getSpendingLimit(year, month) - Get spending limit for month
 * Returns limit amount or null if not set
 * 
 * Requirements: 8.9
 * @param {number} year - Year
 * @param {number} month - Month number (1-12)
 * @returns {number|null} Limit amount or null
 */
function getSpendingLimit(year, month) {
  const monthKey = getMonthKey(year, month);
  const state = stateStore.getState();
  return state.spendingLimits[monthKey] || null;
}

/**
 * calculateLimitStatus(monthlySpending, limitAmount) - Calculate spending limit status
 * Returns status object with status, message, color, remaining
 * 
 * Requirements: 8.7
 * @param {number} monthlySpending - Total monthly spending
 * @param {number} limitAmount - Monthly limit
 * @returns {Object} Status object
 */
function calculateLimitStatus(monthlySpending, limitAmount) {
  if (!limitAmount) {
    return {
      status: 'NOT_SET',
      message: 'Limit belum diatur',
      color: '#BDBDBD'
    };
  }

  const percentage = (monthlySpending / limitAmount) * 100;

  if (percentage < 80) {
    return {
      status: 'NORMAL',
      message: `Rp ${formatIDR(limitAmount - monthlySpending).replace('Rp ', '')} tersisa dari limit ${formatIDR(limitAmount)}`,
      color: '#4CAF50'
    };
  } else if (percentage < 100) {
    return {
      status: 'WARNING',
      message: `Perhatian! Sudah ${Math.round(percentage)}% dari limit`,
      color: '#FF9800'
    };
  } else {
    return {
      status: 'EXCEEDED',
      message: `Limit terlampaui ${formatIDR(monthlySpending - limitAmount)}`,
      color: '#F44336'
    };
  }
}


// ============================================================================
// MONTHLY DATA HELPERS
// ============================================================================

/**
 * getMonthlyTransactions(year, month) - Get transactions for specific month
 * Filters transactions by year and month
 * 
 * Requirements: 7.1
 * @param {number} year - Year
 * @param {number} month - Month number (1-12)
 * @returns {Array} Array of transactions for month
 */
function getMonthlyTransactions(year, month) {
  const state = stateStore.getState();
  return state.transactions.filter(t => {
    const txnDate = new Date(t.date);
    return txnDate.getFullYear() === year && 
           (txnDate.getMonth() + 1) === month;
  });
}

/**
 * calculateMonthlyTotal(year, month) - Calculate total spending for month
 * @param {number} year - Year
 * @param {number} month - Month number (1-12)
 * @returns {number} Total spending for month
 */
function calculateMonthlyTotal(year, month) {
  const monthlyTransactions = getMonthlyTransactions(year, month);
  return monthlyTransactions.reduce((sum, t) => sum + t.amount, 0);
}

/**
 * calculateTotalSpending() - Calculate total spending across all transactions
 * @returns {number} Total spending
 */
function calculateTotalSpending() {
  const state = stateStore.getState();
  return state.transactions.reduce((sum, t) => sum + t.amount, 0);
}


// ============================================================================
// RENDER FUNCTIONS (Placeholder implementations)
// ============================================================================

/**
 * renderHeader() - Render header with total spending
 * Calculates total and updates display
 * Requirements: 4.1, 4.2
 */
function renderHeader() {
  const totalSpending = calculateTotalSpending();
  const totalSpendingDisplay = document.getElementById('totalSpendingDisplay');
  if (totalSpendingDisplay) {
    totalSpendingDisplay.textContent = formatIDR(totalSpending);
  }
}

/**
 * renderForm() - Initialize form with category dropdown
 * Populates category options from getCategories()
 * Requirements: 1.1, 1.2
 */
function renderForm() {
  const categorySelect = document.getElementById('category');
  if (!categorySelect) return;

  // Clear existing options except first placeholder
  const currentOptions = Array.from(categorySelect.options);
  currentOptions.slice(1).forEach(opt => opt.remove());

  // Add category options
  const categories = getCategories();
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.name;
    categorySelect.appendChild(option);
  });
}

/**
 * renderTransactionList() - Render transaction list
 * Requirements: 2.1, 2.5
 */
function renderTransactionList() {
  const transactionList = document.getElementById('transactionList');
  const emptyState = document.getElementById('emptyState');
  
  if (!transactionList) return;

  const state = stateStore.getState();

  // Clear existing items
  transactionList.innerHTML = '';

  if (state.transactions.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  // Create transaction items
  state.transactions.forEach(txn => {
    const category = getCategoryById(txn.category);
    const categoryColor = category ? category.color : '#CCCCCC';
    const categoryName = category ? category.name : 'Unknown';

    const li = document.createElement('li');
    li.className = 'transaction-item';
    li.dataset.transactionId = txn.id;

    li.innerHTML = `
      <div class="transaction-content">
        <div class="transaction-main">
          <span class="transaction-name">${txn.itemName}</span>
          <span class="transaction-category" style="background-color: ${categoryColor};">
            ${categoryName}
          </span>
        </div>
        <div class="transaction-meta">
          <span class="transaction-amount">${formatIDR(txn.amount)}</span>
          <span class="transaction-date">${txn.date}</span>
        </div>
      </div>
      <button class="btn-delete" data-delete-id="${txn.id}">Hapus</button>
    `;

    transactionList.appendChild(li);
  });
}

/**
 * renderMonthlySummary() - Render monthly summary section
 * Requirements: 7.1
 */
function renderMonthlySummary() {
  const state = stateStore.getState();
  const { year, month } = state.selectedMonth;

  const monthDisplay = document.getElementById('monthDisplay');
  const monthlySummaryTotal = document.getElementById('monthlySummaryTotal');
  const monthlyTransactionCount = document.getElementById('monthlyTransactionCount');

  if (monthDisplay) {
    monthDisplay.textContent = parseMonth(year, month);
  }

  const monthlyTotal = calculateMonthlyTotal(year, month);
  const monthlyTransactions = getMonthlyTransactions(year, month);

  if (monthlySummaryTotal) {
    monthlySummaryTotal.textContent = formatIDR(monthlyTotal);
  }

  if (monthlyTransactionCount) {
    monthlyTransactionCount.textContent = monthlyTransactions.length;
  }
}

/**
 * renderSpendingLimitAlert() - Render spending limit status
 * Requirements: 8.1, 8.7
 */
function renderSpendingLimitAlert() {
  const state = stateStore.getState();
  const { year, month } = state.selectedMonth;

  const limitStatusDisplay = document.getElementById('limitStatusDisplay');
  if (!limitStatusDisplay) return;

  const monthlyTotal = calculateMonthlyTotal(year, month);
  const limit = getSpendingLimit(year, month);

  const status = calculateLimitStatus(monthlyTotal, limit);

  limitStatusDisplay.className = `limit-status-display ${status.status.toLowerCase()}`;
  limitStatusDisplay.innerHTML = `
    <div class="limit-status-text">${status.message}</div>
    <button class="btn btn-secondary" id="setLimitBtn">Set Limit</button>
  `;
}

/**
 * renderMainPieChart() - Render main pie chart
 * Requirements: 5.1, 5.6
 */
function renderMainPieChart() {
  console.log('renderMainPieChart() called');
  // This will be implemented in later tasks
}

/**
 * renderMiniPieChart() - Render mini pie chart for monthly summary
 * Requirements: 7.1, 7.8
 */
function renderMiniPieChart() {
  console.log('renderMiniPieChart() called');
  // This will be implemented in later tasks
}

/**
 * renderCategoryManager() - Render category manager section
 * Requirements: 6.1
 */
function renderCategoryManager() {
  console.log('renderCategoryManager() called');
  // This will be implemented in later tasks
}


// ============================================================================
// CASCADE UPDATE SYSTEM
// ============================================================================

/**
 * updateAllDependents() - Master cascade update function
 * Calls all update functions after state changes
 * Requirements: 3.2
 */
function updateAllDependents() {
  renderHeader();
  renderForm();
  renderTransactionList();
  renderMonthlySummary();
  renderSpendingLimitAlert();
  renderMainPieChart();
  renderMiniPieChart();
  renderCategoryManager();
}


// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

/**
 * initApp() - Application initialization function
 * Runs on DOMContentLoaded event
 * 
 * Steps:
 * 1. Load data from Local Storage
 * 2. Initialize default categories if empty
 * 3. Set current month as selected
 * 4. Setup event listeners for state changes
 * 5. Call initial render functions
 * 6. Attach DOM event handlers
 * 
 * Requirements: 9.2
 */
function initApp() {
  console.log('Initializing Expense & Budget Visualizer...');

  // Step 1: Load data from Local Storage
  loadFromLocalStorage();

  // Step 2: Initialize default categories if empty
  const state = stateStore.getState();
  if (state.categories.length === 0) {
    // Add default categories to custom categories array
    state.categories.push(
      { id: 'food', name: 'Food', color: '#FF6B6B', default: true },
      { id: 'transport', name: 'Transport', color: '#4ECDC4', default: true },
      { id: 'fun', name: 'Fun', color: '#FFE66D', default: true }
    );
    saveToLocalStorage();
  }

  // Step 3: Set current month as selected
  const now = new Date();
  state.selectedMonth = {
    year: now.getFullYear(),
    month: now.getMonth() + 1
  };

  // Step 4: Setup event listeners for state changes
  setupStateListeners();

  // Step 5: Call initial render functions
  updateAllDependents();

  // Step 6: Attach DOM event handlers
  attachEventHandlers();

  console.log('Application initialized successfully');
}

/**
 * setupStateListeners() - Setup listeners for state changes
 * Subscribers react to transaction, category, and limit events
 * 
 * Requirements: 9.1
 */
function setupStateListeners() {
  // Listener for transaction changes
  const transactionListener = (action, data, state) => {
    if (action === EVENT_TYPES.TRANSACTION_ADDED || 
        action === EVENT_TYPES.TRANSACTION_DELETED) {
      updateAllDependents();
    }
  };

  // Listener for category changes
  const categoryListener = (action, data, state) => {
    if (action === EVENT_TYPES.CATEGORY_ADDED || 
        action === EVENT_TYPES.CATEGORY_DELETED) {
      updateAllDependents();
    }
  };

  // Listener for spending limit changes
  const limitListener = (action, data, state) => {
    if (action === EVENT_TYPES.LIMIT_UPDATED) {
      renderSpendingLimitAlert();
    }
  };

  // Subscribe listeners
  stateStore.subscribe(transactionListener);
  stateStore.subscribe(categoryListener);
  stateStore.subscribe(limitListener);
}

/**
 * attachEventHandlers() - Attach DOM event handlers
 * Setup form submit, delete buttons, modal controls, month navigation
 * 
 * Requirements: Various (1.3, 3.1, etc.)
 */
function attachEventHandlers() {
  // Form submission
  const transactionForm = document.getElementById('transactionForm');
  if (transactionForm) {
    transactionForm.addEventListener('submit', handleFormSubmit);
  }

  // Transaction delete buttons (event delegation)
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-delete')) {
      const transactionId = e.target.dataset.deleteId;
      deleteTransaction(transactionId);
    }
  });

  // Month navigation
  const prevMonthBtn = document.getElementById('prevMonth');
  const nextMonthBtn = document.getElementById('nextMonth');

  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      handleMonthNavigation(-1);
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
      handleMonthNavigation(1);
    });
  }

  // Add category button
  const addCategoryBtns = document.querySelectorAll('#addCategoryBtn, #addCategoryBtn2');
  addCategoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      showAddCategoryModal();
    });
  });

  // Set limit button
  document.addEventListener('click', (e) => {
    if (e.target.id === 'setLimitBtn') {
      showSetLimitModal();
    }
  });

  // Close modals
  const closeAddCategoryModal = document.getElementById('closeAddCategoryModal');
  if (closeAddCategoryModal) {
    closeAddCategoryModal.addEventListener('click', () => {
      const modal = document.getElementById('addCategoryModal');
      if (modal) modal.style.display = 'none';
    });
  }

  const closeLimitModal = document.getElementById('closeLimitModal');
  if (closeLimitModal) {
    closeLimitModal.addEventListener('click', () => {
      const modal = document.getElementById('limitModal');
      if (modal) modal.style.display = 'none';
    });
  }

  // Add category form submission
  const addCategoryForm = document.getElementById('addCategoryForm');
  if (addCategoryForm) {
    addCategoryForm.addEventListener('submit', handleAddCategorySubmit);
  }

  // Set limit form submission
  const limitForm = document.getElementById('limitForm');
  if (limitForm) {
    limitForm.addEventListener('submit', handleSetLimitSubmit);
  }

  // Modal cancel buttons
  const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
  if (cancelCategoryBtn) {
    cancelCategoryBtn.addEventListener('click', () => {
      const modal = document.getElementById('addCategoryModal');
      if (modal) modal.style.display = 'none';
    });
  }

  const cancelLimitBtn = document.getElementById('cancelLimitBtn');
  if (cancelLimitBtn) {
    cancelLimitBtn.addEventListener('click', () => {
      const modal = document.getElementById('limitModal');
      if (modal) modal.style.display = 'none';
    });
  }
}

/**
 * handleFormSubmit() - Handle transaction form submission
 * Validates and adds transaction
 * 
 * Requirements: 1.3, 1.6, 1.9
 */
function handleFormSubmit(e) {
  e.preventDefault();

  const itemName = document.getElementById('itemName').value.trim();
  const amount = document.getElementById('amount').value;
  const category = document.getElementById('category').value;

  // Validate inputs
  const errors = validateTransactionForm(itemName, amount, category);

  if (Object.keys(errors).length > 0) {
    displayFormErrors(errors);
    return;
  }

  // Add transaction
  addTransaction(itemName, amount, category);

  // Reset form
  document.getElementById('transactionForm').reset();
  clearFormErrors();
  document.getElementById('itemName').focus();
}

/**
 * validateTransactionForm() - Validate transaction form inputs
 * Requirements: 1.4, 1.5, 1.9
 */
function validateTransactionForm(itemName, amount, category) {
  const errors = {};

  if (!itemName || itemName === '') {
    errors.itemName = 'Nama Item wajib diisi';
  } else if (itemName.length > 50) {
    errors.itemName = 'Nama Item maksimal 50 karakter';
  }

  if (!amount || amount === '') {
    errors.amount = 'Jumlah wajib diisi';
  } else if (Number(amount) <= 0) {
    errors.amount = 'Jumlah harus angka positif';
  }

  if (!category || category === '') {
    errors.category = 'Kategori wajib dipilih';
  }

  return errors;
}

/**
 * displayFormErrors() - Display form validation errors
 */
function displayFormErrors(errors) {
  clearFormErrors();

  if (errors.itemName) {
    const errorEl = document.getElementById('itemNameError');
    if (errorEl) {
      errorEl.textContent = errors.itemName;
      errorEl.classList.add('show');
    }
  }

  if (errors.amount) {
    const errorEl = document.getElementById('amountError');
    if (errorEl) {
      errorEl.textContent = errors.amount;
      errorEl.classList.add('show');
    }
  }

  if (errors.category) {
    const errorEl = document.getElementById('categoryError');
    if (errorEl) {
      errorEl.textContent = errors.category;
      errorEl.classList.add('show');
    }
  }
}

/**
 * clearFormErrors() - Clear all form error messages
 */
function clearFormErrors() {
  const errorElements = document.querySelectorAll('.error-message');
  errorElements.forEach(el => {
    el.textContent = '';
    el.classList.remove('show');
  });
}

/**
 * handleMonthNavigation() - Handle prev/next month button clicks
 * Requirements: 7.2
 */
function handleMonthNavigation(direction) {
  const state = stateStore.getState();
  let { year, month } = state.selectedMonth;

  month += direction;

  if (month > 12) {
    month = 1;
    year += 1;
  } else if (month < 1) {
    month = 12;
    year -= 1;
  }

  state.selectedMonth = { year, month };
  updateAllDependents();
}

/**
 * showAddCategoryModal() - Show add category modal
 * Requirements: 6.2
 */
function showAddCategoryModal() {
  const modal = document.getElementById('addCategoryModal');
  if (modal) {
    modal.style.display = 'flex';
    document.getElementById('categoryName').focus();
  }
}

/**
 * handleAddCategorySubmit() - Handle add category form submission
 * Requirements: 6.5
 */
function handleAddCategorySubmit(e) {
  e.preventDefault();

  const categoryName = document.getElementById('categoryName').value.trim();
  const categoryColor = document.getElementById('categoryColor').value;

  // Validate
  if (!categoryName || categoryName === '') {
    const errorEl = document.getElementById('categoryNameError');
    if (errorEl) {
      errorEl.textContent = 'Nama kategori wajib diisi';
      errorEl.classList.add('show');
    }
    return;
  }

  // Try to add category
  const result = addCustomCategory(categoryName, categoryColor);

  if (result) {
    // Close modal
    const modal = document.getElementById('addCategoryModal');
    if (modal) modal.style.display = 'none';

    // Reset form
    document.getElementById('addCategoryForm').reset();
    document.getElementById('categoryColor').value = '#FF6B6B';
  } else {
    // Display error
    const errorEl = document.getElementById('categoryNameError');
    if (errorEl) {
      errorEl.textContent = 'Kategori sudah ada atau input tidak valid';
      errorEl.classList.add('show');
    }
  }
}

/**
 * showSetLimitModal() - Show set spending limit modal
 * Requirements: 8.2
 */
function showSetLimitModal() {
  const state = stateStore.getState();
  const { year, month } = state.selectedMonth;

  const limitMonth = document.getElementById('limitMonth');
  if (limitMonth) {
    limitMonth.value = parseMonth(year, month);
  }

  const limitAmount = document.getElementById('limitAmount');
  const currentLimit = getSpendingLimit(year, month);
  if (limitAmount) {
    limitAmount.value = currentLimit || '';
  }

  const modal = document.getElementById('limitModal');
  if (modal) {
    modal.style.display = 'flex';
    limitAmount.focus();
  }
}

/**
 * handleSetLimitSubmit() - Handle set spending limit form submission
 * Requirements: 8.5, 8.6
 */
function handleSetLimitSubmit(e) {
  e.preventDefault();

  const limitAmount = document.getElementById('limitAmount').value;

  // Validate
  if (!limitAmount || Number(limitAmount) <= 0) {
    const errorEl = document.getElementById('limitError');
    if (errorEl) {
      errorEl.textContent = 'Limit harus angka positif';
      errorEl.classList.add('show');
    }
    return;
  }

  const state = stateStore.getState();
  const { year, month } = state.selectedMonth;

  // Set limit
  setSpendingLimit(year, month, Number(limitAmount));

  // Close modal
  const modal = document.getElementById('limitModal');
  if (modal) modal.style.display = 'none';

  // Reset form
  document.getElementById('limitForm').reset();
}


// ============================================================================
// PAGE LOAD EVENT
// ============================================================================

/**
 * Initialize app when DOM is fully loaded
 * Requirements: 9.2
 */
document.addEventListener('DOMContentLoaded', initApp);
