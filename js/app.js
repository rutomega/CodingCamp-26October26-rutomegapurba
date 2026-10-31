
'use strict';

// ==========================================
// 1. STATE MANAGEMENT
// ==========================================

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

    getCurrentMonth() {
        const now = new Date();
        return {
            year: now.getFullYear(),
            month: now.getMonth() + 1
        };
    }

    getState() {
        return this.state;
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    notify(action, data) {
        this.listeners.forEach(listener => {
            try {
                listener(action, data, this.state);
            } catch (error) {
                console.error('State listener error:', error);
            }
        });
    }
}

const stateStore = new StateStore();

const EVENT_TYPES = {
    TRANSACTION_ADDED: 'transaction:added',
    TRANSACTION_DELETED: 'transaction:deleted',
    CATEGORY_ADDED: 'category:added',
    CATEGORY_DELETED: 'category:deleted',
    LIMIT_UPDATED: 'limit:updated'
};

// Chart instances
let mainChart = null;
let miniChart = null;


// ==========================================
// 2. LOCAL STORAGE
// ==========================================

const STORAGE_KEYS = {
    TRANSACTIONS: 'app_transactions',
    CATEGORIES: 'app_categories',
    LIMITS: 'app_spending_limits'
};

function loadFromStorage() {
    try {
        const transactions = JSON.parse(
            localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)
        ) || [];

        const savedCategories = JSON.parse(
            localStorage.getItem(STORAGE_KEYS.CATEGORIES)
        ) || [];

        const spendingLimits = JSON.parse(
            localStorage.getItem(STORAGE_KEYS.LIMITS)
        ) || {};

        const defaultCategories = [
            { id: 'food', name: 'Food', color: '#FF6B6B', default: true },
            { id: 'transport', name: 'Transport', color: '#4ECDC4', default: true },
            { id: 'fun', name: 'Fun', color: '#FFE66D', default: true }
        ];

        const customCategories = savedCategories.filter(
            category => !category.default
        );

        stateStore.setState({
            transactions,
            categories: [...defaultCategories, ...customCategories],
            spendingLimits
        });

    } catch (error) {
        console.error('Error loading Local Storage:', error);
    }
}

function saveToStorage() {
    try {
        const state = stateStore.getState();

        const customCategories = state.categories.filter(
            category => !category.default
        );

        localStorage.setItem(
            STORAGE_KEYS.TRANSACTIONS,
            JSON.stringify(state.transactions)
        );

        localStorage.setItem(
            STORAGE_KEYS.CATEGORIES,
            JSON.stringify(customCategories)
        );

        localStorage.setItem(
            STORAGE_KEYS.LIMITS,
            JSON.stringify(state.spendingLimits)
        );

    } catch (error) {
        console.error('Error saving Local Storage:', error);
        alert('Gagal menyimpan data. Periksa penyimpanan browser.');
    }
}


// ==========================================
// 3. UTILITY FUNCTIONS
// ==========================================

function generateId() {
    return 'id_' + Date.now() + '_' +
        Math.random().toString(36).substring(2, 9);
}

function formatIDR(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount || 0);
}

function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function getCurrentTime() {
    const now = new Date();

    return String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0');
}

function getMonthName(month) {
    const months = [
        'Januari', 'Februari', 'Maret', 'April',
        'Mei', 'Juni', 'Juli', 'Agustus',
        'September', 'Oktober', 'November', 'Desember'
    ];

    return months[month - 1];
}

function parseMonth(year, month) {
    return `${getMonthName(month)} ${year}`;
}

function getMonthKey(year, month) {
    return `${year}-${String(month).padStart(2, '0')}`;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => {
        const entities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };

        return entities[character];
    });
}

function showErrorMessage(message) {
    alert(message);
}

function showSuccessMessage(message) {
    console.log('Success:', message);
}


// ==========================================
// 4. TRANSACTION MANAGEMENT
// ==========================================

function addTransaction(itemName, amount, category) {
    const state = stateStore.getState();

    const transaction = {
        id: generateId(),
        itemName: itemName.trim(),
        amount: Number(amount),
        category,
        date: getCurrentDate(),
        time: getCurrentTime(),
        timestamp: Date.now()
    };

    state.transactions.unshift(transaction);

    saveToStorage();

    stateStore.notify(EVENT_TYPES.TRANSACTION_ADDED, transaction);
    updateAllDependents();

    return transaction;
}

function deleteTransaction(transactionId) {
    const state = stateStore.getState();

    const index = state.transactions.findIndex(
        transaction => transaction.id === transactionId
    );

    if (index === -1) return;

    const deleted = state.transactions.splice(index, 1)[0];

    saveToStorage();

    stateStore.notify(EVENT_TYPES.TRANSACTION_DELETED, deleted);
    updateAllDependents();
}

function getMonthlyTransactions(year, month) {
    const monthKey = getMonthKey(year, month);

    return stateStore.getState().transactions.filter(transaction => {
        return transaction.date &&
            transaction.date.startsWith(monthKey);
    });
}

function calculateTotalSpending() {
    return stateStore.getState().transactions.reduce(
        (total, transaction) => total + Number(transaction.amount || 0),
        0
    );
}

function calculateMonthlySpending(year, month) {
    return getMonthlyTransactions(year, month).reduce(
        (total, transaction) => total + Number(transaction.amount || 0),
        0
    );
}


// ==========================================
// 5. CATEGORY MANAGEMENT
// ==========================================

function getCategories() {
    return stateStore.getState().categories;
}

function getCategoryById(categoryId) {
    return getCategories().find(
        category => category.id === categoryId
    );
}

function addCustomCategory(name, color) {
    const state = stateStore.getState();

    if (!name || !name.trim()) {
        showErrorMessage('Nama kategori tidak boleh kosong.');
        return false;
    }

    const duplicate = state.categories.some(
        category => category.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (duplicate) {
        showErrorMessage('Kategori sudah ada.');
        return false;
    }

    const category = {
        id: generateId(),
        name: name.trim(),
        color,
        default: false
    };

    state.categories.push(category);

    saveToStorage();

    stateStore.notify(EVENT_TYPES.CATEGORY_ADDED, category);
    updateAllDependents();

    return true;
}

function deleteCustomCategory(categoryId, reassignTo = null) {
    const state = stateStore.getState();
    const category = getCategoryById(categoryId);

    if (!category || category.default) {
        showErrorMessage('Kategori default tidak dapat dihapus.');
        return false;
    }

    const usedTransactions = state.transactions.filter(
        transaction => transaction.category === categoryId
    );

    if (usedTransactions.length > 0 && !reassignTo) {
        return {
            inUse: true,
            count: usedTransactions.length
        };
    }

    if (reassignTo) {
        usedTransactions.forEach(transaction => {
            transaction.category = reassignTo;
        });
    }

    state.categories = state.categories.filter(
        item => item.id !== categoryId
    );

    saveToStorage();

    stateStore.notify(EVENT_TYPES.CATEGORY_DELETED, category);
    updateAllDependents();

    return true;
}

function getSpendingByCategory(transactions) {
    const spending = {};

    getCategories().forEach(category => {
        spending[category.id] = {
            name: category.name,
            color: category.color,
            amount: 0
        };
    });

    transactions.forEach(transaction => {
        const category = spending[transaction.category];

        if (category) {
            category.amount += Number(transaction.amount || 0);
        }
    });

    return spending;
}


// ==========================================
// 6. SPENDING LIMIT
// ==========================================

function setSpendingLimit(year, month, amount) {
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
        showErrorMessage('Limit harus lebih besar dari nol.');
        return false;
    }

    const state = stateStore.getState();
    const key = getMonthKey(year, month);

    state.spendingLimits[key] = Number(amount);

    saveToStorage();

    stateStore.notify(EVENT_TYPES.LIMIT_UPDATED, {
        month: key,
        limit: Number(amount)
    });

    updateAllDependents();

    return true;
}

function getSpendingLimit(year, month) {
    const key = getMonthKey(year, month);

    return stateStore.getState().spendingLimits[key] || null;
}

function calculateLimitStatus(spending, limit) {
    if (!limit) {
        return {
            status: 'NOT_SET',
            message: 'Limit belum diatur',
            color: '#BDBDBD'
        };
    }

    const percentage = (spending / limit) * 100;

    if (percentage < 80) {
        return {
            status: 'NORMAL',
            message: `${formatIDR(limit - spending)} tersisa dari limit ${formatIDR(limit)}`,
            color: '#4CAF50'
        };
    }

    if (percentage < 100) {
        return {
            status: 'WARNING',
            message: `Perhatian! Sudah ${Math.round(percentage)}% dari limit.`,
            color: '#FF9800'
        };
    }

    return {
        status: 'EXCEEDED',
        message: `Limit terlampaui ${formatIDR(spending - limit)}.`,
        color: '#F44336'
    };
}


// ==========================================
// 7. RENDER HEADER & TRANSACTIONS
// ==========================================

function renderHeader() {
    const element = document.getElementById('totalSpendingDisplay');

    if (element) {
        element.textContent = formatIDR(calculateTotalSpending());
    }
}

function renderForm() {
    const select = document.getElementById('category');

    if (!select) return;

    select.innerHTML = '<option value="">Pilih Kategori</option>';

    getCategories().forEach(category => {
        const option = document.createElement('option');

        option.value = category.id;
        option.textContent = category.name;

        select.appendChild(option);
    });
}

function renderTransactionList() {
    const list = document.getElementById('transactionList');
    const empty = document.getElementById('emptyState');

    if (!list) return;

    const transactions = stateStore.getState().transactions;

    list.innerHTML = '';

    if (transactions.length === 0) {
        if (empty) empty.style.display = 'block';
        return;
    }

    if (empty) empty.style.display = 'none';

    transactions.forEach(transaction => {
        const category = getCategoryById(transaction.category);

        const li = document.createElement('li');
        li.className = 'transaction-item';

        li.innerHTML = `
            <div class="transaction-content">
                <div class="transaction-main">
                    <span class="transaction-name">
                        ${escapeHtml(transaction.itemName)}
                    </span>

                    <span class="transaction-category"
                        style="background-color: ${category?.color || '#999'}">
                        ${escapeHtml(category?.name || 'Unknown')}
                    </span>
                </div>

                <div class="transaction-meta">
                    <span class="transaction-amount">
                        ${formatIDR(transaction.amount)}
                    </span>

                    <span class="transaction-date">
                        ${transaction.date} ${transaction.time || ''}
                    </span>
                </div>
            </div>

            <button class="btn-delete"
                data-delete-id="${transaction.id}">
                Hapus
            </button>
        `;

        list.appendChild(li);
    });
}


// ==========================================
// 8. MONTHLY SUMMARY
// ==========================================

function renderMonthlySummary() {
    const month = stateStore.getState().selectedMonth;

    const display = document.getElementById('monthDisplay');
    const totalElement = document.getElementById('monthlySummaryTotal');
    const countElement = document.getElementById('monthlyTransactionCount');

    const transactions = getMonthlyTransactions(month.year, month.month);

    if (display) {
        display.textContent = parseMonth(month.year, month.month);
    }

    if (totalElement) {
        totalElement.textContent = formatIDR(
            calculateMonthlySpending(month.year, month.month)
        );
    }

    if (countElement) {
        countElement.textContent = transactions.length;
    }
}


// ==========================================
// 9. SPENDING LIMIT ALERT DISPLAY
// ==========================================

function renderSpendingLimitAlert() {
    const month = stateStore.getState().selectedMonth;

    const display = document.getElementById('limitStatusDisplay');

    if (!display) return;

    const spending = calculateMonthlySpending(month.year, month.month);
    const limit = getSpendingLimit(month.year, month.month);

    const status = calculateLimitStatus(spending, limit);

    let statusClass = status.status.toLowerCase().replace('_', '-');

    display.className = `limit-status-display ${statusClass}`;

    display.innerHTML = `
        <div class="limit-status-text" style="color: ${status.color}">
            ${status.message}
        </div>
    `;
}


// ==========================================
// 10. PIE CHART HELPER
// ==========================================

function renderPieChart(canvasId, emptyMessageId, transactions, chartType) {
    const canvas = document.getElementById(canvasId);
    const emptyMessage = document.getElementById(emptyMessageId);

    if (!canvas) {
        console.error(`Canvas ${canvasId} tidak ditemukan.`);
        return null;
    }

    // Destroy previous chart
    if (chartType === 'main' && mainChart) {
        mainChart.destroy();
        mainChart = null;
    }

    if (chartType === 'mini' && miniChart) {
        miniChart.destroy();
        miniChart = null;
    }

    const spending = getSpendingByCategory(transactions);

    const chartData = Object.values(spending).filter(
        category => category.amount > 0
    );

    if (chartData.length === 0) {
        canvas.style.display = 'none';

        if (emptyMessage) {
            emptyMessage.style.display = 'flex';
        }

        return null;
    }

    canvas.style.display = 'block';

    if (emptyMessage) {
        emptyMessage.style.display = 'none';
    }

    if (typeof Chart === 'undefined') {
        console.error('Chart.js belum berhasil dimuat.');
        return null;
    }

    return new Chart(canvas.getContext('2d'), {
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
                        padding: 15,
                        usePointStyle: true
                    }
                },

                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce(
                                (sum, value) => sum + value,
                                0
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


// ==========================================
// 11. MAIN PIE CHART
// ==========================================

function renderMainPieChart() {
    const transactions = stateStore.getState().transactions;

    mainChart = renderPieChart(
        'mainPieChart',
        'emptyMainChartMessage',
        transactions,
        'main'
    );
}


// ==========================================
// 12. MONTHLY MINI PIE CHART
// ==========================================

function renderMiniPieChart() {
    const month = stateStore.getState().selectedMonth;

    const transactions = getMonthlyTransactions(
        month.year,
        month.month
    );

    miniChart = renderPieChart(
        'miniPieChart',
        'emptyMiniChartMessage',
        transactions,
        'mini'
    );
}


// ==========================================
// 13. CATEGORY MANAGER
// ==========================================

function renderCategoryManager() {
    const defaultList = document.getElementById('defaultCategoriesList');
    const customList = document.getElementById('customCategoriesList');

    if (!defaultList || !customList) return;

    defaultList.innerHTML = '';
    customList.innerHTML = '<h4>Kategori Custom</h4>';

    getCategories().forEach(category => {
        const div = document.createElement('div');

        div.className = 'category-item';

        div.innerHTML = `
            <span class="category-color"
                style="background-color: ${category.color}">
            </span>

            <span class="category-name">
                ${escapeHtml(category.name)}
            </span>

            ${category.default
                ? '<span class="category-badge">(tidak bisa dihapus)</span>'
                : `<button class="category-delete-btn"
                    data-delete-id="${category.id}">Hapus</button>`
            }
        `;

        if (category.default) {
            defaultList.appendChild(div);
        } else {
            customList.appendChild(div);
        }
    });

    if (!customList.querySelector('.category-item')) {
        const message = document.createElement('p');
        message.textContent = 'Tidak ada kategori custom';
        customList.appendChild(message);
    }
}


// ==========================================
// 14. UPDATE ALL COMPONENTS
// ==========================================

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


// ==========================================
// 15. TRANSACTION FORM
// ==========================================

function setupTransactionForm() {
    const form = document.getElementById('transactionForm');

    if (!form) return;

    form.addEventListener('submit', event => {
        event.preventDefault();

        const itemName = document.getElementById('itemName').value.trim();
        const amount = Number(document.getElementById('amount').value);
        const category = document.getElementById('category').value;

        document.getElementById('itemNameError').textContent = '';
        document.getElementById('amountError').textContent = '';
        document.getElementById('categoryError').textContent = '';

        let hasError = false;

        if (!itemName) {
            document.getElementById('itemNameError').textContent =
                'Nama Item wajib diisi';

            hasError = true;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            document.getElementById('amountError').textContent =
                'Jumlah harus angka positif';

            hasError = true;
        }

        if (!category) {
            document.getElementById('categoryError').textContent =
                'Kategori wajib dipilih';

            hasError = true;
        }

        if (hasError) return;

        addTransaction(itemName, amount, category);

        form.reset();
        document.getElementById('itemName').focus();

        showSuccessMessage('Transaksi berhasil ditambahkan');
    });
}


// ==========================================
// 16. DELETE TRANSACTION
// ==========================================

function setupDeleteHandler() {
    document.addEventListener('click', event => {
        const button = event.target.closest('.btn-delete');

        if (!button) return;

        const id = button.dataset.deleteId;

        if (confirm('Hapus transaksi ini?')) {
            deleteTransaction(id);
            showSuccessMessage('Transaksi berhasil dihapus');
        }
    });
}


// ==========================================
// 17. MONTH NAVIGATION
// ==========================================

function setupMonthNavigation() {
    document.getElementById('prevMonth')?.addEventListener('click', () => {
        changeMonth(-1);
    });

    document.getElementById('nextMonth')?.addEventListener('click', () => {
        changeMonth(1);
    });
}

function changeMonth(direction) {
    const state = stateStore.getState();

    let { year, month } = state.selectedMonth;

    month += direction;

    if (month > 12) {
        month = 1;
        year++;
    } else if (month < 1) {
        month = 12;
        year--;
    }

    state.selectedMonth = { year, month };

    updateAllDependents();
}


// ==========================================
// 18. CATEGORY MODAL
// ==========================================

function setupCategoryHandlers() {
    const modal = document.getElementById('addCategoryModal');
    const form = document.getElementById('addCategoryForm');

    document.querySelectorAll('#addCategoryBtn, #addCategoryBtn2')
        .forEach(button => {
            button.addEventListener('click', () => {
                modal.style.display = 'flex';
            });
        });

    document.getElementById('closeAddCategoryModal')
        ?.addEventListener('click', () => {
            modal.style.display = 'none';
        });

    document.getElementById('cancelCategoryBtn')
        ?.addEventListener('click', () => {
            modal.style.display = 'none';
        });

    form?.addEventListener('submit', event => {
        event.preventDefault();

        const name = document.getElementById('categoryName').value.trim();
        const color = document.getElementById('categoryColor').value;

        if (addCustomCategory(name, color)) {
            modal.style.display = 'none';
            form.reset();

            document.getElementById('categoryColor').value = '#FF6B6B';
        }
    });
}


// ==========================================
// 19. DELETE CATEGORY
// ==========================================

function setupDeleteCategoryHandler() {
    document.addEventListener('click', event => {
        const button = event.target.closest('.category-delete-btn');

        if (!button) return;

        const result = deleteCustomCategory(button.dataset.deleteId);

        if (result && result.inUse) {
            alert(
                `Kategori ini digunakan oleh ${result.count} transaksi. ` +
                'Pindahkan transaksi tersebut ke kategori lain terlebih dahulu.'
            );
        }
    });
}


// ==========================================
// 20. SPENDING LIMIT MODAL
// ==========================================

function setupLimitHandlers() {
    const modal = document.getElementById('limitModal');
    const form = document.getElementById('limitForm');

    function openModal() {
        const month = stateStore.getState().selectedMonth;

        document.getElementById('limitMonth').value =
            parseMonth(month.year, month.month);

        document.getElementById('limitAmount').value =
            getSpendingLimit(month.year, month.month) || '';

        document.getElementById('limitError').textContent = '';

        modal.style.display = 'flex';
    }

    document.getElementById('setLimitBtn')
        ?.addEventListener('click', openModal);

    document.getElementById('editLimitBtn')
        ?.addEventListener('click', openModal);

    document.getElementById('closeLimitModal')
        ?.addEventListener('click', () => {
            modal.style.display = 'none';
        });

    document.getElementById('cancelLimitBtn')
        ?.addEventListener('click', () => {
            modal.style.display = 'none';
        });

    form?.addEventListener('submit', event => {
        event.preventDefault();

        const amount = Number(
            document.getElementById('limitAmount').value
        );

        const month = stateStore.getState().selectedMonth;

        if (!Number.isFinite(amount) || amount <= 0) {
            document.getElementById('limitError').textContent =
                'Limit harus angka positif';

            return;
        }

        if (setSpendingLimit(month.year, month.month, amount)) {
            modal.style.display = 'none';
            form.reset();
        }
    });
}


// ==========================================
// 21. APPLICATION INITIALIZATION
// ==========================================

function initializeApp() {
    console.log('Initializing Expense & Budget Visualizer...');

    // Load saved data first
    loadFromStorage();

    // Setup event handlers once
    setupTransactionForm();
    setupDeleteHandler();
    setupMonthNavigation();
    setupCategoryHandlers();
    setupDeleteCategoryHandler();
    setupLimitHandlers();

    // Render application
    updateAllDependents();

    console.log('Application initialized successfully');
}


// ==========================================
// 22. START APPLICATION
// ==========================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
} else {
    initializeApp();
}
