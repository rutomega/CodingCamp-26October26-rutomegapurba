# Design Document: Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a client-side single-page application (SPA) built with vanilla JavaScript, HTML5, and CSS3. The application enables users to track personal expenses with real-time visualization, monthly budgeting, and persistent storage via Browser Local Storage.

### Key Design Principles

1. **Client-Side Only**: No backend, no database, no external API calls (except Chart.js CDN)
2. **Persistent Storage**: All data automatically saved to Local Storage on every change
3. **Real-Time Updates**: UI reflects changes immediately across all sections
4. **Responsive Design**: Single codebase that adapts seamlessly from mobile (320px) to desktop (1920px+)
5. **Vanilla JavaScript**: Pure ES6+ without frameworks or heavy dependencies
6. **Separation of Concerns**: Clear component structure with distinct responsibilities

---

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     EXPENSE & BUDGET VISUALIZER                 │
│                      (Single Page Application)                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼────────┐  ┌──▼────────┐  ┌──▼────────────┐
        │   UI LAYER     │  │   STATE   │  │ PERSISTENCE  │
        │  (Components)  │  │ MANAGEMENT│  │    LAYER     │
        └────────────────┘  └───────────┘  └──────────────┘
                │               │               │
        ┌───────▼────────┐  ┌──▼────────┐  ┌──▼────────────┐
        │ • Header       │  │ • Global  │  │ • LocalStorage│
        │ • Form Input   │  │   State   │  │ • Serialization
        │ • Transaction  │  │ • State   │  │ • Load/Save  │
        │   List         │  │   Updates │  │   Operations │
        │ • Charts       │  │ • Event   │  │ • Error      │
        │ • Monthly      │  │   Handlers│  │   Handling   │
        │   Summary      │  │           │  │              │
        │ • Budget Alert │  │           │  │              │
        └────────────────┘  └───────────┘  └──────────────┘
```

### Application Layers

#### 1. Presentation Layer (UI Components)
Responsible for rendering and user interactions. No business logic.

**Components:**
- Header (Total Spending Display)
- Input Form Section
- Transaction List
- Monthly Summary
- Spending Limit Alert
- Pie Chart Visualization
- Category Manager

#### 2. State Management Layer
Centralized state management without Redux or similar patterns.

**Responsibilities:**
- Store application state
- Handle state mutations
- Trigger re-renders via event publishing
- Manage cascade updates

#### 3. Persistence Layer
Interface between application and Browser Local Storage.

**Responsibilities:**
- Serialize/deserialize data
- Handle storage read/write
- Error handling for quota exceeded
- Data validation on load

---

## Components and Interfaces

### 1. Header Component - Total Spending Display

**Responsibility:**
Display global total spending across all transactions. Always visible at top of page.

**Input:**
- `totalSpending` (number): Sum of all transaction amounts

**Output:**
- DOM element: `<div class="header">`
  - Displays "Rp X.XXX" or "Rp X.XXX.XXX" format
  - Large, bold, prominent styling

**Dependencies:**
- None (presentation only)

**State Management:**
- Receives read-only `totalSpending` from global state
- Updates via state change event listener

**Update Trigger:**
- Transaction added
- Transaction deleted
- On app initialization (load from storage)

**HTML Structure:**
```html
<header class="header">
  <div class="header-container">
    <h1 class="header-title">Total Pengeluaran</h1>
    <div class="header-amount" id="totalSpendingDisplay">Rp 0</div>
  </div>
</header>
```

---

### 2. Input Form Section

**Responsibility:**
Capture user input for new transactions. Validate inputs and trigger add transaction.

**Input Fields:**
- Item Name (text, max 50 chars)
- Amount (number, positive only)
- Category (dropdown with dynamic options)

**Output:**
- Transaction object: `{ id, itemName, amount, category, date, timestamp }`
- Auto-timestamp on submission

**Dependencies:**
- Categories list (from state)
- Validation utilities

**State Management:**
- Form state (values, errors) - component-level state
- Submit event triggers global state update
- Auto-clear on success

**Validation Rules:**
1. Item Name: Required, non-empty, max 50 chars
2. Amount: Required, positive number, > 0
3. Category: Required, valid category

**Event Flow:**
```
User Input → Validate → Valid?
                ├─ No → Display field errors
                └─ Yes → Create transaction → Save to state → Clear form
```

**HTML Structure:**
```html
<section class="input-section">
  <form id="transactionForm" class="form">
    <div class="form-group">
      <label for="itemName">Nama Item *</label>
      <input type="text" id="itemName" name="itemName" max="50" required>
      <span class="error-message" id="itemNameError"></span>
    </div>
    
    <div class="form-group">
      <label for="amount">Jumlah (Rp) *</label>
      <input type="number" id="amount" name="amount" min="1" required>
      <span class="error-message" id="amountError"></span>
    </div>
    
    <div class="form-group">
      <label for="category">Kategori *</label>
      <select id="category" name="category" required>
        <option value="">Pilih Kategori</option>
      </select>
      <span class="error-message" id="categoryError"></span>
    </div>
    
    <button type="submit" class="btn btn-primary">Tambah Transaksi</button>
  </form>
  
  <div class="category-management">
    <button type="button" class="btn btn-secondary" id="addCategoryBtn">
      + Tambah Kategori Baru
    </button>
  </div>
</section>
```

---

### 3. Transaction List

**Responsibility:**
Display all transactions sorted by date (newest first). Support deletion and visual hover effects.

**Input:**
- `transactions` (array): All transactions from state
- `categories` (object): Category name and color mapping

**Output:**
- DOM list of transaction items
- Delete button per transaction

**Dependencies:**
- Category color mapping
- Format utility functions

**State Management:**
- Read-only access to transactions array
- Listen to transaction changes
- Re-render on add/delete

**Display Format:**
```
[Item Name] | [Category Color] [Category] | [Amount in IDR] | [Date]
                                                    [Delete Button]
```

**Scroll Behavior:**
- Independent scrolling (doesn't affect header)
- Max height: 1 viewport height or less
- Sticky header on scroll (form stays visible)

**Empty State:**
- Message: "Belum ada transaksi"
- Icon/visual indicator

**HTML Structure:**
```html
<section class="transaction-list-section">
  <h2>Daftar Transaksi</h2>
  <div class="transaction-list-container">
    <ul class="transaction-list" id="transactionList">
      <!-- Transaction items rendered here -->
    </ul>
    <div class="empty-state" id="emptyState" style="display: none;">
      <p>Belum ada transaksi</p>
    </div>
  </div>
</section>

<!-- Transaction item template (rendered via JS) -->
<li class="transaction-item" data-transaction-id="${transactionId}">
  <div class="transaction-content">
    <div class="transaction-main">
      <span class="transaction-name">${itemName}</span>
      <span class="transaction-category" style="background-color: ${categoryColor};">
        ${categoryName}
      </span>
    </div>
    <div class="transaction-meta">
      <span class="transaction-amount">${formattedAmount}</span>
      <span class="transaction-date">${formattedDate}</span>
    </div>
  </div>
  <button class="btn btn-delete" data-delete-id="${transactionId}">Hapus</button>
</li>
```

---

### 4. Monthly Summary Section

**Responsibility:**
Show spending for selected month with transaction count and mini pie chart.

**Input:**
- `selectedMonth` (date object): Current selected month/year
- `monthlyTransactions` (array): Transactions for selected month
- `categories` (object): Category info

**Output:**
- DOM section with month selector, spending total, count, mini chart

**Dependencies:**
- Chart.js for mini pie chart
- Format utilities

**State Management:**
- Component-level: selected month
- Global listener for transactions change
- Update mini chart when transactions change

**Features:**
1. Month/Year Selector: Previous/Next buttons or dropdown
2. Total Spending for Selected Month (IDR format)
3. Transaction Count
4. Mini Pie Chart (responsive size)
5. Tooltip on chart hover

**Default Behavior:**
- Show current month on app load
- Update when user changes month
- Show empty state if no transactions in selected month

**HTML Structure:**
```html
<section class="monthly-summary-section">
  <h2>Ringkasan Bulanan</h2>
  
  <div class="month-selector">
    <button class="btn-prev" id="prevMonth">← Bulan Sebelumnya</button>
    <span class="month-display" id="monthDisplay">Desember 2024</span>
    <button class="btn-next" id="nextMonth">Bulan Berikutnya →</button>
  </div>
  
  <div class="summary-stats">
    <div class="stat-card">
      <span class="stat-label">Total Pengeluaran</span>
      <span class="stat-value" id="monthlySummaryTotal">Rp 0</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">Jumlah Transaksi</span>
      <span class="stat-value" id="monthlyTransactionCount">0</span>
    </div>
  </div>
  
  <div class="chart-container mini-chart-container">
    <canvas id="miniPieChart"></canvas>
    <div class="empty-chart-message" id="emptyChartMessage">
      Belum ada data
    </div>
  </div>
</section>
```

---

### 5. Spending Limit Alert

**Responsibility:**
Display spending limit status and allow user to set/edit limit for selected month.

**Input:**
- `selectedMonth` (date): Selected month
- `monthlySpending` (number): Total spending for selected month
- `spendingLimit` (number): Limit for selected month (if set)

**Output:**
- Status display with color-coded alert
- Set/Edit button

**Dependencies:**
- None

**State Management:**
- Listen to spending limit changes
- Listen to monthly spending changes
- Update status display

**Alert States:**

| State | Condition | Color | Message |
|-------|-----------|-------|---------|
| NORMAL | 0-79% | Green (#4CAF50) | Rp X tersisa dari limit Rp Y |
| WARNING | 80-99% | Orange (#FF9800) | Perhatian! Sudah 80% dari limit |
| EXCEEDED | ≥100% | Red (#F44336) | Limit terlampaui Rp X |
| NOT SET | No limit | Gray | Limit belum diatur |

**Modal for Setting Limit:**
```
┌──────────────────────────────────┐
│  Set Spending Limit              │
├──────────────────────────────────┤
│  Bulan: [December 2024]          │
│  Amount: [input] Rp              │
│                                  │
│  [Cancel Button] [Save Button]   │
└──────────────────────────────────┘
```

**HTML Structure:**
```html
<section class="spending-limit-section">
  <div class="limit-status-card" id="limitStatusCard">
    <div class="limit-status-header">
      <h3>Batas Pengeluaran Bulanan</h3>
      <button class="btn-icon btn-edit" id="editLimitBtn">✏️ Edit</button>
    </div>
    <div class="limit-status-display" id="limitStatusDisplay">
      <div class="limit-status-text">Limit belum diatur</div>
      <button class="btn btn-secondary" id="setLimitBtn">Set Limit</button>
    </div>
  </div>
</section>

<!-- Modal (hidden by default) -->
<div class="modal" id="limitModal" style="display: none;">
  <div class="modal-content">
    <div class="modal-header">
      <h2>Set Spending Limit</h2>
      <button class="btn-close" id="closeLimitModal">&times;</button>
    </div>
    <form id="limitForm" class="form">
      <div class="form-group">
        <label for="limitMonth">Bulan</label>
        <input type="text" id="limitMonth" disabled>
      </div>
      <div class="form-group">
        <label for="limitAmount">Limit Amount (Rp) *</label>
        <input type="number" id="limitAmount" min="1" required>
        <span class="error-message" id="limitError"></span>
      </div>
      <div class="modal-buttons">
        <button type="button" class="btn btn-secondary" id="cancelLimitBtn">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary">
          Save Limit
        </button>
      </div>
    </form>
  </div>
</div>
```

---

### 6. Pie Chart Visualization

**Responsibility:**
Display main pie chart showing category distribution for all transactions or filtered view.

**Input:**
- `transactions` (array): All transactions to visualize
- `categories` (object): Category colors

**Output:**
- Canvas element with Chart.js pie chart
- Tooltip on hover

**Dependencies:**
- Chart.js library (from CDN)

**Chart Configuration:**
```javascript
{
  type: 'pie',
  data: {
    labels: ['Food', 'Transport', 'Fun', ...customCategories],
    datasets: [{
      data: [foodTotal, transportTotal, funTotal, ...],
      backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFE66D', ...],
      borderColor: '#fff',
      borderWidth: 2
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: Rp ${formatIDR(context.raw)} (${context.label}%)`
          }
        }
      },
      legend: {
        position: 'bottom'
      }
    }
  }
}
```

**Empty State:**
Message: "Belum ada data" (no chart rendered)

**Update Behavior:**
- Destroys existing chart and creates new on data change
- Smooth transition (fade effect)

**HTML Structure:**
```html
<section class="pie-chart-section">
  <h2>Distribusi Pengeluaran</h2>
  <div class="chart-container" id="chartContainer">
    <canvas id="mainPieChart"></canvas>
    <div class="empty-chart-message" id="emptyMainChartMessage" 
         style="display: none;">
      Belum ada data
    </div>
  </div>
</section>
```

---

### 7. Category Manager

**Responsibility:**
Display category list, allow add/delete custom categories, manage category colors.

**Input:**
- `categories` (object): All categories with defaults + custom
- `categoryTransactionCounts` (object): Usage count per category

**Output:**
- Category list UI
- Add category modal
- Delete confirmation modal

**Dependencies:**
- None

**State Management:**
- Listen to category changes
- Listen to transaction changes (for usage counts)
- Update category list display

**Features:**

1. **Default Categories** (non-deletable):
   - Food (#FF6B6B)
   - Transport (#4ECDC4)
   - Fun (#FFE66D)

2. **Custom Categories**:
   - Can be added by user
   - Each has unique color
   - Can be deleted if not in use or with reassignment

3. **Add Category Modal**:
   - Category name input (required, unique, case-insensitive)
   - Color picker (hex input or preset colors)
   - Validation error display

4. **Delete Custom Category**:
   - If not in use → Direct deletion
   - If in use → Show warning dialog with reassignment options

**Delete Flow:**
```
User clicks delete
    ↓
Is category in use? 
    ├─ No → Show confirmation → Delete
    └─ Yes → Show warning with usage count
            → Select new category for reassignment
            → Reassign all transactions
            → Delete original category
```

**HTML Structure:**
```html
<section class="category-manager-section">
  <h3>Kategori</h3>
  
  <div class="categories-list">
    <div class="categories-default">
      <h4>Default Categories</h4>
      <div class="category-item" data-category="food">
        <span class="category-color" style="background-color: #FF6B6B;"></span>
        <span class="category-name">Food</span>
        <span class="category-badge">(tidak bisa dihapus)</span>
      </div>
      <!-- More default categories -->
    </div>
    
    <div class="categories-custom" id="customCategoriesList">
      <h4>Custom Categories</h4>
      <!-- Custom categories rendered here -->
    </div>
  </div>
  
  <button class="btn btn-secondary" id="addCategoryBtn">
    + Tambah Kategori
  </button>
</section>

<!-- Add Category Modal -->
<div class="modal" id="addCategoryModal" style="display: none;">
  <div class="modal-content">
    <div class="modal-header">
      <h2>Tambah Kategori Baru</h2>
      <button class="btn-close" id="closeAddCategoryModal">&times;</button>
    </div>
    <form id="addCategoryForm" class="form">
      <div class="form-group">
        <label for="categoryName">Nama Kategori *</label>
        <input type="text" id="categoryName" required>
        <span class="error-message" id="categoryNameError"></span>
      </div>
      <div class="form-group">
        <label for="categoryColor">Pilih Warna</label>
        <div class="color-picker">
          <input type="color" id="categoryColor" value="#FF6B6B">
        </div>
      </div>
      <div class="modal-buttons">
        <button type="button" class="btn btn-secondary" id="cancelCategoryBtn">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary">
          Add Category
        </button>
      </div>
    </form>
  </div>
</div>

<!-- Delete Category Modal -->
<div class="modal" id="deleteCategoryModal" style="display: none;">
  <div class="modal-content">
    <div class="modal-header">
      <h2>Hapus Kategori</h2>
    </div>
    <div class="modal-body">
      <p id="deleteCategoryMessage"></p>
      <div id="reassignSection" style="display: none;">
        <label for="reassignCategory">Reassign transaksi ke kategori:</label>
        <select id="reassignCategory"></select>
      </div>
    </div>
    <div class="modal-buttons">
      <button type="button" class="btn btn-secondary" id="cancelDeleteBtn">
        Cancel
      </button>
      <button type="button" class="btn btn-danger" id="confirmDeleteBtn">
        Delete
      </button>
    </div>
  </div>
</div>
```

---

## Data Models

### 1. Transaction Object

```javascript
{
  id: "txn_1704067200000_f7a2b8",  // UUID format: txn_timestamp_random
  itemName: "Makan di Restoran",
  amount: 125000,
  category: "food",
  date: "2023-12-31",              // ISO format (YYYY-MM-DD)
  timestamp: 1704067200000,         // Unix timestamp (milliseconds)
  time: "14:30"                     // HH:MM format for display
}
```

### 2. Category Object

```javascript
{
  id: "food",
  name: "Food",
  color: "#FF6B6B",
  default: true,
  transactionCount: 5,              // Computed, not stored
  totalSpending: 425000             // Computed, not stored
}
```

### 3. Spending Limit Object

```javascript
{
  month: "2024-12",                 // YYYY-MM format (key in limits object)
  year: 2024,
  month_name: 12,
  limit: 5000000                    // Amount in rupiah
}
```

### 4. Local Storage Schema

```javascript
// Top-level storage structure
{
  "app_transactions": [
    { id, itemName, amount, category, date, timestamp, time },
    ...
  ],
  
  "app_categories": [
    { id, name, color, default: true/false },
    ...
  ],
  
  "app_spending_limits": {
    "2024-12": 5000000,             // Key: YYYY-MM, Value: amount
    "2024-11": 3000000,
    ...
  },
  
  "app_metadata": {
    version: "1.0",
    lastUpdated: 1704067200000
  }
}
```

### 5. Global Application State

```javascript
const AppState = {
  // Data
  transactions: [],
  categories: [],
  spendingLimits: {},
  
  // UI State
  selectedMonth: { year: 2024, month: 12 },
  selectedCategoryFilter: null,
  uiMode: 'normal' // or 'editing'
}
```

### 6. Example Local Storage Content

```json
{
  "app_transactions": [
    {
      "id": "txn_1704067200000_abc123",
      "itemName": "Makan di Restoran Asoi",
      "amount": 125000,
      "category": "food",
      "date": "2023-12-31",
      "timestamp": 1704067200000,
      "time": "14:30"
    },
    {
      "id": "txn_1704050800000_def456",
      "itemName": "Bensin",
      "amount": 75000,
      "category": "transport",
      "date": "2023-12-31",
      "timestamp": 1704050800000,
      "time": "10:00"
    }
  ],
  
  "app_categories": [
    {
      "id": "food",
      "name": "Food",
      "color": "#FF6B6B",
      "default": true
    },
    {
      "id": "transport",
      "name": "Transport",
      "color": "#4ECDC4",
      "default": true
    },
    {
      "id": "fun",
      "name": "Fun",
      "color": "#FFE66D",
      "default": true
    },
    {
      "id": "utilities",
      "name": "Utilities",
      "color": "#A29BFE",
      "default": false
    }
  ],
  
  "app_spending_limits": {
    "2023-12": 5000000,
    "2023-11": 4500000
  },
  
  "app_metadata": {
    "version": "1.0",
    "lastUpdated": 1704067200000
  }
}
```

---

## State Management

### State Architecture (Vanilla JS Pattern)

Without frameworks, state management uses an **Event-Driven Observer Pattern**:

```javascript
// State Store (Singleton)
class StateStore {
  constructor() {
    this.state = {
      transactions: [],
      categories: [],
      spendingLimits: {},
      selectedMonth: { year: 2024, month: 12 }
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
      listener(action, data, this.state);
    });
  }
  
  getState() {
    return this.state;
  }
  
  setState(newState) {
    this.state = { ...this.state, ...newState };
  }
}
```

### State Update Flow

```
User Action (click, submit, etc.)
    ↓
Event Handler in Component
    ↓
Validate/Process
    ↓
Call StateStore.dispatch(action, data)
    ↓
StateStore updates state
    ↓
StateStore.notify() → All listeners called
    ↓
Component listeners re-render relevant sections
    ↓
Persistence layer saves to Local Storage
```

### Global State Mutations

#### Add Transaction
```javascript
function addTransaction(itemName, amount, category) {
  const transaction = {
    id: generateId(),
    itemName,
    amount,
    category,
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now(),
    time: getCurrentTime()
  };
  
  state.transactions.push(transaction);
  state.transactions.sort((a, b) => b.timestamp - a.timestamp);
  
  // Cascade updates
  notifyListeners('transaction:added', transaction);
  saveToLocalStorage();
  updateAllDependents();
}
```

#### Delete Transaction
```javascript
function deleteTransaction(transactionId) {
  const transaction = state.transactions.find(t => t.id === transactionId);
  state.transactions = state.transactions.filter(t => t.id !== transactionId);
  
  // Cascade updates
  notifyListeners('transaction:deleted', transaction);
  saveToLocalStorage();
  updateAllDependents();
}
```

#### Update Spending Limit
```javascript
function updateSpendingLimit(year, month, limitAmount) {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  if (limitAmount > 0) {
    state.spendingLimits[monthKey] = limitAmount;
  } else {
    delete state.spendingLimits[monthKey];
  }
  
  notifyListeners('limit:updated', { month: monthKey, limit: limitAmount });
  saveToLocalStorage();
  updateAllDependents();
}
```

### Cascade Update Mechanism

When a transaction is added/deleted, these updates cascade:

```javascript
function updateAllDependents() {
  const state = getState();
  
  // 1. Update Total Spending
  updateTotalSpending();
  
  // 2. Update Monthly Summary (current month + all visible months)
  updateMonthlySummary();
  
  // 3. Update Pie Chart (main)
  updateMainPieChart();
  
  // 4. Update Mini Pie Chart (monthly summary)
  updateMiniPieChart();
  
  // 5. Update Spending Limit Alert (if current month)
  updateSpendingLimitAlert();
  
  // 6. Update Transaction List
  renderTransactionList();
}
```

### Component-Level State Management

Each component can maintain local state for UI-specific concerns:

```javascript
// Form Component Local State
const FormComponent = {
  state: {
    itemName: '',
    amount: '',
    category: '',
    errors: {}
  },
  
  methods: {
    updateField(fieldName, value) {
      this.state[fieldName] = value;
      this.clearFieldError(fieldName);
    },
    
    validate() {
      // Local validation logic
    },
    
    submit() {
      if (this.validate()) {
        // Call global state update
        addTransaction(this.state.itemName, this.state.amount, this.state.category);
        this.reset();
      }
    },
    
    reset() {
      this.state = { itemName: '', amount: '', category: '', errors: {} };
      this.render();
    }
  }
}
```

### Event Handling Strategy

**Event Delegation** for efficiency:

```javascript
// Single event listener for multiple deletions
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-delete')) {
    const transactionId = e.target.dataset.deleteId;
    deleteTransaction(transactionId);
  }
  
  if (e.target.id === 'setLimitBtn') {
    showLimitModal();
  }
});
```

### Performance Considerations

1. **Debounce render updates**: Batch multiple state changes
2. **Virtual DOM-like approach**: Only update changed DOM elements
3. **Lazy render**: Render transaction list items on demand
4. **Chart reuse**: Destroy and recreate charts only on data change

---

## Layout Architecture

### Responsive Breakpoints

```
┌─────────────────────────────────────────────┐
│ Mobile         │ Tablet      │ Desktop      │
│ ≤480px         │ 481-1024px  │ >1024px      │
├─────────────────────────────────────────────┤
│ Single column  │ 2 columns   │ Grid layout  │
└─────────────────────────────────────────────┘
```

### Mobile Layout (≤480px)

**Single Column, Stacked Vertical:**

```
┌──────────────────────────┐
│   HEADER                 │
│  Total Spending: Rp 0    │
└──────────────────────────┘

┌──────────────────────────┐
│   INPUT FORM             │
│   [Item Name]            │
│   [Amount]               │
│   [Category]             │
│   [Submit Button]        │
│   [Add Category Button]  │
└──────────────────────────┘

┌──────────────────────────┐
│   MONTHLY SUMMARY        │
│   [< Month >]            │
│   Total: Rp X.XXX        │
│   Count: X transaksi     │
│   [Mini Pie Chart]       │
└──────────────────────────┘

┌──────────────────────────┐
│   SPENDING LIMIT ALERT   │
│   Status: Green/Orange/  │
│   Red Message            │
│   [Edit Button]          │
└──────────────────────────┘

┌──────────────────────────┐
│   TRANSACTION LIST       │
│   (scrollable)           │
│   [Txn 1]                │
│   [Txn 2]                │
│   [Txn 3]                │
│   ... (max height: 1 vh) │
└──────────────────────────┘

┌──────────────────────────┐
│   MAIN PIE CHART         │
│   (responsive width)     │
│   [Chart Canvas]         │
└──────────────────────────┘

┌──────────────────────────┐
│   CATEGORY MANAGER       │
│   [Default Categories]   │
│   [Custom Categories]    │
│   [+ Add Category]       │
└──────────────────────────┘
```

**CSS Grid/Flexbox Approach:**
```css
.mobile-layout {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.header {
  flex-shrink: 0;         /* Sticky at top */
  position: sticky;
  top: 0;
  z-index: 100;
}

.transaction-list-container {
  max-height: 100vh;
  overflow-y: auto;
  flex: 1;
}

.chart-container {
  width: 100%;
  max-width: 100%;
}
```

**Touch Targets:**
- Minimum 44px height for buttons
- Minimum 40px x 40px for interactive elements
- Adequate spacing (16px) between touchable elements

---

### Tablet Layout (481-1024px)

**Two Column Layout:**

```
┌─────────────────────────────────────────┐
│          HEADER                         │
│       Total Spending: Rp 0              │
└─────────────────────────────────────────┘

┌─────────────────┬───────────────────────┐
│                 │                       │
│  LEFT COLUMN    │   RIGHT COLUMN        │
│  ─────────────  │   ─────────────────   │
│  INPUT FORM     │   TRANSACTION LIST    │
│                 │   (scrollable)        │
│  MONTHLY        │                       │
│  SUMMARY        │                       │
│                 │                       │
│  SPENDING       │                       │
│  LIMIT ALERT    │                       │
│                 │                       │
│  CATEGORY       │                       │
│  MANAGER        │                       │
│                 │                       │
└─────────────────┴───────────────────────┘

┌─────────────────────────────────────────┐
│         MAIN PIE CHART                  │
│         (full width, responsive)        │
└─────────────────────────────────────────┘
```

**CSS Grid Approach:**
```css
@media (min-width: 481px) and (max-width: 1024px) {
  .app-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    padding: 2rem;
  }
  
  .left-column {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .right-column {
    display: flex;
    flex-direction: column;
  }
  
  .transaction-list-container {
    max-height: 500px;
    overflow-y: auto;
  }
  
  .main-pie-chart {
    grid-column: 1 / -1;  /* Span both columns */
  }
}
```

---

### Desktop Layout (>1024px)

**Dashboard Grid Layout:**

```
┌───────────────────────────────────────────────────────────────────┐
│                         HEADER                                    │
│                    Total Spending: Rp 0                           │
└───────────────────────────────────────────────────────────────────┘

┌──────────────────────┬──────────────────┬─────────────────────────┐
│                      │                  │                         │
│   INPUT FORM         │  MONTHLY         │   PIE CHART             │
│   (Compact)          │  SUMMARY         │   (Main)                │
│                      │                  │                         │
├──────────────────────┼──────────────────┼─────────────────────────┤
│                      │                  │                         │
│   SPENDING LIMIT     │  CATEGORY        │   TRANSACTION LIST      │
│   ALERT              │  MANAGER         │   (scrollable, tall)    │
│                      │                  │                         │
└──────────────────────┴──────────────────┴─────────────────────────┘
```

**CSS Grid Approach:**
```css
@media (min-width: 1025px) {
  .app-container {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: auto auto auto;
    gap: 2rem;
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .header {
    grid-column: 1 / -1;
  }
  
  .input-form {
    grid-column: 1;
    grid-row: 2;
  }
  
  .monthly-summary {
    grid-column: 2;
    grid-row: 2;
  }
  
  .main-pie-chart {
    grid-column: 3;
    grid-row: 2 / 4;
  }
  
  .spending-limit {
    grid-column: 1;
    grid-row: 3;
  }
  
  .category-manager {
    grid-column: 2;
    grid-row: 3;
  }
  
  .transaction-list {
    grid-column: 3;
    grid-row: 2 / 4;
  }
}
```

---

### Responsive Typography

```css
/* Mobile */
@media (max-width: 480px) {
  h1 { font-size: 24px; }
  h2 { font-size: 18px; }
  h3 { font-size: 16px; }
  body { font-size: 14px; }
}

/* Tablet */
@media (min-width: 481px) and (max-width: 1024px) {
  h1 { font-size: 28px; }
  h2 { font-size: 20px; }
  h3 { font-size: 18px; }
  body { font-size: 15px; }
}

/* Desktop */
@media (min-width: 1025px) {
  h1 { font-size: 32px; }
  h2 { font-size: 24px; }
  h3 { font-size: 20px; }
  body { font-size: 16px; }
}
```

---

### Responsive Components Details

#### Pie Chart Resizing
```css
.chart-container {
  position: relative;
  width: 100%;
  max-width: 400px;  /* Max width on desktop */
  aspect-ratio: 1;   /* Keep square */
}

@media (max-width: 480px) {
  .chart-container {
    max-width: 280px;
  }
}

@media (min-width: 481px) and (max-width: 1024px) {
  .chart-container {
    max-width: 320px;
  }
}
```

#### Transaction List Cards
```css
.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;  /* Mobile */
  border-radius: 8px;
  transition: background-color 0.3s;
}

.transaction-item:hover {
  background-color: #f5f5f5;
}

@media (min-width: 481px) {
  .transaction-item {
    padding: 16px;
  }
}

@media (min-width: 1025px) {
  .transaction-item {
    padding: 14px 20px;
  }
}
```

---

## Visual Design Specification

### Color Scheme

#### Category Colors
```
┌──────────────┬────────────┬─────────────────┐
│ Category     │ Hex Code   │ RGB             │
├──────────────┼────────────┼─────────────────┤
│ Food         │ #FF6B6B    │ rgb(255, 107, 107) │
│ Transport    │ #4ECDC4    │ rgb(78, 205, 196)  │
│ Fun          │ #FFE66D    │ rgb(255, 230, 109) │
└──────────────┴────────────┴─────────────────┘
```

#### UI Color Palette
```
Primary:      #007AFF (Blue)         - Main actions, links
Secondary:    #5AC8FA (Light Blue)   - Secondary buttons
Success:      #4CAF50 (Green)        - Confirmations, normal alerts
Warning:      #FF9800 (Orange)       - Cautions, 80% alerts
Danger:       #F44336 (Red)          - Errors, exceeded alerts
Background:   #FAFAFA (Light Gray)   - Page background
Surface:      #FFFFFF (White)        - Card/panel backgrounds
Border:       #E0E0E0 (Light Gray)   - Subtle borders
Text:         #212121 (Dark Gray)    - Primary text
Text Light:   #757575 (Medium Gray)  - Secondary text
```

#### Custom Category Colors (Preset Palette)
```javascript
const colorPalette = [
  '#FF6B6B', '#FF8C42', '#FFD93D', '#6BCB77',
  '#4D96FF', '#7C7CED', '#B96FD7', '#E85D7A',
  '#87B9FF', '#FFB88C', '#A8E6CF', '#FFD3B6'
];
```

---

### Typography

#### Font Family
```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
               'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

#### Font Sizes & Weights

| Element | Mobile | Tablet | Desktop | Weight |
|---------|--------|--------|---------|--------|
| H1 (Page Title) | 24px | 28px | 32px | **bold** (700) |
| H2 (Section Title) | 18px | 20px | 24px | **bold** (700) |
| H3 (Subsection) | 16px | 18px | 20px | **semibold** (600) |
| Body Text | 14px | 15px | 16px | regular (400) |
| Label | 13px | 14px | 14px | regular (400) |
| Small Text | 12px | 12px | 13px | regular (400) |
| Button Text | 14px | 15px | 16px | **semibold** (600) |

#### Line Heights
```css
h1, h2, h3 { line-height: 1.2; }
body       { line-height: 1.5; }
label      { line-height: 1.4; }
```

---

### Spacing & Sizing

#### Base Unit: 8px
```
Spacing scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px

Usage:
  4px   - Very tight spacing (borders, dividers)
  8px   - Tight spacing (icon gaps, small element margins)
  12px  - Compact spacing (form groups, list items)
  16px  - Standard spacing (section padding, medium gaps)
  24px  - Comfortable spacing (section gaps, card margins)
  32px  - Large spacing (major section separation)
  48px+  - Extra large spacing (between main content blocks)
```

#### Component Sizing Guidelines

| Component | Width | Height | Padding |
|-----------|-------|--------|---------|
| Button (standard) | min 100px | 40px (mobile), 44px (touch) | 12px 24px |
| Button (small) | min 80px | 32px | 8px 16px |
| Input Field | 100% | 40px | 8px 12px |
| Form Label | 100% | - | 0 0 8px 0 |
| Card | 100% (mobile), 90% (tablet), fixed (desktop) | auto | 16px |
| Header | 100vw | 60px | 16px |
| Transaction Item | 100% | 56px (mobile), 64px (desktop) | 12px |

---

### Visual Elements

#### Card Design
```css
.card {
  background-color: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 16px;
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}
```

#### Button Styles

**Primary Button:**
```css
.btn-primary {
  background-color: #007AFF;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #0051D5;
}

.btn-primary:active {
  background-color: #003BA3;
}

.btn-primary:disabled {
  background-color: #CCCCCC;
  cursor: not-allowed;
}
```

**Secondary Button:**
```css
.btn-secondary {
  background-color: #E8E8E8;
  color: #212121;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: #D0D0D0;
}
```

**Delete Button:**
```css
.btn-delete {
  background-color: #F44336;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  opacity: 0;  /* Hidden by default */
  transition: opacity 0.2s;
}

.transaction-item:hover .btn-delete {
  opacity: 1;
}
```

#### Form Field Styling
```css
input, select {
  width: 100%;
  padding: 12px;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
  font-family: inherit;
}

input:focus, select:focus {
  outline: none;
  border-color: #007AFF;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

input.error {
  border-color: #F44336;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #212121;
}

.error-message {
  display: block;
  color: #F44336;
  font-size: 12px;
  margin-top: 4px;
}
```

#### Empty States
```css
.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: #757575;
}

.empty-state-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state-message {
  font-size: 18px;
  font-weight: 500;
}
```

#### Loading States
```css
.skeleton {
  background: linear-gradient(
    90deg,
    #F0F0F0 25%,
    #E0E0E0 50%,
    #F0F0F0 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

#### Alert/Notification Design

**Success Alert:**
```css
.alert-success {
  background-color: #E8F5E9;
  border-left: 4px solid #4CAF50;
  color: #2E7D32;
  padding: 12px 16px;
  border-radius: 4px;
  font-size: 14px;
}
```

**Error Alert:**
```css
.alert-error {
  background-color: #FFEBEE;
  border-left: 4px solid #F44336;
  color: #C62828;
  padding: 12px 16px;
  border-radius: 4px;
  font-size: 14px;
}
```

**Warning Alert:**
```css
.alert-warning {
  background-color: #FFF3E0;
  border-left: 4px solid #FF9800;
  color: #E65100;
  padding: 12px 16px;
  border-radius: 4px;
  font-size: 14px;
}
```

---

## User Flows & Interactions

### 1. Add Transaction Flow

```
┌─ User enters Item Name
│
├─ User enters Amount
│
├─ User selects Category (from dropdown)
│
└─ User clicks Submit button
    │
    ├─ Validate all fields
    │  ├─ Item Name: required, non-empty, max 50 chars
    │  ├─ Amount: required, positive number
    │  └─ Category: required, valid selection
    │
    ├─ Validation passed?
    │  │
    │  ├─ NO → Display field-specific error messages
    │  │       User corrects input
    │  │       Retry
    │  │
    │  └─ YES → Create transaction object with:
    │          - Auto-generated ID
    │          - Current date/timestamp
    │          - All field values
    │
    ├─ Add to transactions array (in-memory state)
    │
    ├─ Sort transactions by date (newest first)
    │
    ├─ Trigger cascade updates:
    │  ├─ Update Total Spending display
    │  ├─ Update Monthly Summary (if same month)
    │  ├─ Update Pie Charts (main + mini)
    │  ├─ Update Transaction List
    │  └─ Update Spending Limit Alert
    │
    ├─ Save to Local Storage
    │
    ├─ Clear form fields
    │
    ├─ Set focus to Item Name field
    │
    └─ Show success message: "Transaksi berhasil ditambahkan!"
```

### 2. Delete Transaction Flow

```
┌─ User hovers over transaction item in list
│  └─ Delete button appears (fade in)
│
├─ User clicks Delete button
│
├─ Confirm deletion (optional confirmation modal)
│
├─ Remove transaction from array
│
├─ Trigger cascade updates:
│  ├─ Update Total Spending display
│  ├─ Update Monthly Summary
│  ├─ Update Pie Charts
│  ├─ Update Transaction List
│  ├─ Check if list is now empty
│  │  └─ Show empty state if true
│  └─ Update Spending Limit Alert
│
├─ Save to Local Storage
│
└─ Show success message: "Transaksi berhasil dihapus"
```

### 3. View Monthly Summary Flow

```
┌─ App loads → Display current month (today's month)
│
├─ User clicks "Bulan Berikutnya" (next month)
│  │
│  ├─ Update selected month in state
│  │
│  ├─ Re-calculate transactions for new month
│  │
│  ├─ Update display:
│  │  ├─ Month/Year label
│  │  ├─ Total spending for month
│  │  ├─ Transaction count
│  │  └─ Mini pie chart
│  │
│  ├─ Fetch spending limit for new month (if exists)
│  │
│  └─ Update Spending Limit Alert status for new month
│
└─ User clicks "Bulan Sebelumnya" (previous month)
   └─ Same process as above
```

### 4. Add Custom Category Flow

```
┌─ User clicks "+ Add Category Baru" button
│  └─ Add Category Modal appears
│
├─ User enters category name
│  └─ (Example: "Utilities", "Entertainment")
│
├─ User optionally selects color
│  ├─ Default color: first unused color from palette
│  └─ User can pick custom color via color picker
│
├─ User clicks Save button
│
├─ Validate:
│  ├─ Name: required, non-empty
│  ├─ Uniqueness: not duplicate (case-insensitive)
│  └─ Length: reasonable (e.g., max 30 chars)
│
├─ Validation passed?
│  │
│  ├─ NO → Show specific error message (e.g., "Kategori sudah ada")
│  │       User corrects input
│  │       Retry
│  │
│  └─ YES → Create category object:
│          { id, name, color, default: false }
│
├─ Add to categories array
│
├─ Update UI:
│  ├─ Add to category dropdown in form
│  ├─ Add to category list display
│  └─ Regenerate pie chart colors
│
├─ Save to Local Storage
│
├─ Close modal
│
└─ Show success message: "Kategori berhasil ditambahkan"
```

### 5. Delete Custom Category Flow

```
┌─ User clicks delete button on custom category
│
├─ Check if category is in use (referenced by any transaction)
│
├─ In use?
│  │
│  ├─ NO → Show confirmation modal
│  │       "Hapus kategori [name]?"
│  │       ├─ User clicks Cancel → Close modal
│  │       └─ User clicks Delete → Proceed to delete
│  │
│  └─ YES → Show reassignment modal
│          "Kategori ini dipakai X transaksi"
│          "Pilih kategori pengganti:"
│          ├─ Display dropdown with other categories
│          ├─ User selects new category
│          │
│          ├─ User clicks Cancel → Close modal
│          │
│          └─ User clicks Delete → Reassign all transactions
│             ├─ Update all transactions with old category
│             │  to new category
│             ├─ Delete old category
│             ├─ Update UI:
│             │  ├─ Remove from category list
│             │  ├─ Update transaction list (category changed)
│             │  ├─ Regenerate pie chart
│             │  └─ Update pie chart colors
│             ├─ Save to Local Storage
│             └─ Show success message
│
└─ Close modal
```

### 6. Set/Edit Spending Limit Flow

```
┌─ User clicks "Set Limit" or "Edit" button
│  └─ Spending Limit Modal appears
│
├─ Modal shows:
│  ├─ Selected month/year (read-only)
│  ├─ Current limit if exists (pre-filled)
│  └─ Input field for new limit
│
├─ User enters limit amount
│  └─ (Example: 5000000 for Rp 5 juta)
│
├─ User clicks Save button
│
├─ Validate:
│  ├─ Amount: required, positive number, > 0
│  └─ Format check
│
├─ Validation passed?
│  │
│  ├─ NO → Show error: "Jumlah harus angka positif"
│  │
│  └─ YES → Update spending limit
│          ├─ Store in state: { "2024-12": 5000000 }
│          ├─ Save to Local Storage
│          └─ Close modal
│
├─ Re-calculate spending limit alert status
│  ├─ Compare monthly spending vs new limit
│  ├─ Determine alert state (normal/warning/exceeded)
│  └─ Update alert display with new status
│
└─ Show success message
```

---

### Interaction Patterns

#### Form Submission
- **Enter Key**: Submitting form on Enter (not just clicking button)
- **Tab Navigation**: Tab through form fields in order
- **Focus Management**: Focus returns to first field after successful submission
- **Error Display**: Field-specific error messages appear inline
- **Auto-Clear**: Form clears only on successful submission

#### Dropdown Selections
- **Keyboard Support**: Arrow keys to navigate options
- **Option Highlighting**: Current selection highlighted
- **Click to Select**: Click option to select
- **Closed by Default**: Dropdown closes after selection

#### Chart Interactions
- **Hover Tooltip**: Show `Category: Rp X.XXX (Y%)` on hover
- **Responsive Resize**: Chart resizes with window
- **Click Legend**: Click legend to highlight/hide slice (optional)

#### Delete Confirmations
- **Modal Dialog**: Confirm before delete (destructive action)
- **Accessible Focus**: Focus on modal, not dismissible by background click
- **Keyboard: Escape**: Close modal on Escape key
- **Clear Buttons**: "Cancel" and "Delete" buttons clearly labeled

#### Error Handling Display
- **Field Errors**: Red border/background on form fields
- **Message Errors**: Inline error messages below fields
- **Toast Alerts**: Success/error notifications (top-right corner)
- **Auto-Dismiss**: Alerts disappear after 3-4 seconds

---

## Technical Implementation Details

### Technologies & Libraries

| Technology | Version | Purpose |
|-----------|---------|---------|
| HTML5 | Latest | Markup structure |
| CSS3 | Latest | Styling, Flexbox, Grid |
| JavaScript (ES6+) | ES2020+ | Application logic |
| Chart.js | 4.x | Pie chart rendering |

### Folder Structure

```
project-root/
├── index.html                    # Main HTML file (single file)
├── css/
│   └── style.css                 # All CSS (single file)
├── js/
│   └── app.js                    # All JavaScript logic (single file)
├── README.md                     # Documentation
└── .gitignore                    # Git ignore file
```

### Key Implementation Considerations

#### Single vs Modular JavaScript
**Chosen Approach: Modular within Single File**

Organize code in `js/app.js` with clear sections (not separate files):

```javascript
// ============================================
// 1. STATE MANAGEMENT
// ============================================
const StateStore = { /* ... */ };

// ============================================
// 2. DOM UTILITIES
// ============================================
const DOMUtils = { /* ... */ };

// ============================================
// 3. STORAGE (Local Storage)
// ============================================
const StorageService = { /* ... */ };

// ============================================
// 4. COMPONENTS
// ============================================
const Components = {
  Header: { /* ... */ },
  InputForm: { /* ... */ },
  TransactionList: { /* ... */ },
  // ... other components
};

// ============================================
// 5. EVENT HANDLERS
// ============================================
const EventHandlers = { /* ... */ };

// ============================================
// 6. INITIALIZATION
// ============================================
function initApp() { /* ... */ }

// ============================================
// 7. APP EXPORT (for testing)
// ============================================
window.app = { /* public API */ };
```

#### CSS Approach: Flexbox vs Grid Breakdown

**Mobile (≤480px):**
- Flexbox for main layout (flex-direction: column)
- Flexbox for form groups (flex-direction: row)
- No grid needed (single column)

**Tablet (481-1024px):**
- CSS Grid for 2-column layout
- Flexbox for component internals

**Desktop (>1024px):**
- CSS Grid for complex dashboard layout
- Flexbox for component details

```css
/* Mobile-first approach */
.app-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 481px) {
  .app-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1025px) {
  .app-container {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: auto auto auto;
  }
}
```

#### Local Storage Serialization
```javascript
// Saving
function saveToLocalStorage() {
  const data = {
    transactions: state.transactions,
    categories: state.categories,
    spendingLimits: state.spendingLimits,
    metadata: { version: '1.0', lastUpdated: Date.now() }
  };
  localStorage.setItem('app_data', JSON.stringify(data));
}

// Loading
function loadFromLocalStorage() {
  try {
    const data = JSON.parse(localStorage.getItem('app_data'));
    if (data) {
      state.transactions = data.transactions || [];
      state.categories = data.categories || [];
      state.spendingLimits = data.spendingLimits || {};
      return true;
    }
  } catch (error) {
    console.error('Failed to load from storage:', error);
    showErrorMessage('Gagal memuat data dari storage');
    return false;
  }
}
```

#### Chart.js Integration
```javascript
// Main Pie Chart
let mainChart = null;

function renderMainPieChart() {
  const ctx = document.getElementById('mainPieChart').getContext('2d');
  
  // Destroy existing chart if any
  if (mainChart) {
    mainChart.destroy();
  }
  
  const chartData = preparePieChartData(state.transactions);
  
  mainChart = new Chart(ctx, {
    type: 'pie',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = formatIDR(context.raw);
              const percent = (context.raw / total * 100).toFixed(1);
              return `${label}: ${value} (${percent}%)`;
            }
          }
        }
      }
    }
  });
}
```

#### Event Delegation Strategy
```javascript
// Single delegated listener for efficiency
document.addEventListener('click', handleGlobalClick);
document.addEventListener('change', handleGlobalChange);

function handleGlobalClick(event) {
  // Form submission
  if (event.target.closest('#transactionForm')) {
    // ... handle form
  }
  
  // Delete transaction
  if (event.target.classList.contains('btn-delete')) {
    const id = event.target.dataset.deleteId;
    deleteTransaction(id);
  }
  
  // Set limit
  if (event.target.id === 'setLimitBtn') {
    showLimitModal();
  }
  
  // ... more handlers
}

function handleGlobalChange(event) {
  // Update form field
  if (event.target.name === 'itemName') {
    formState.itemName = event.target.value;
  }
  
  // ... more handlers
}
```

#### DOM Manipulation Approach
```javascript
// Batch DOM updates
function renderTransactionList(transactions) {
  const container = document.getElementById('transactionList');
  
  // Clear and rebuild (or use DocumentFragment for efficiency)
  const fragment = document.createDocumentFragment();
  
  transactions.forEach(txn => {
    const li = createTransactionElement(txn);
    fragment.appendChild(li);
  });
  
  container.innerHTML = '';
  container.appendChild(fragment);
}

// Template literals for element creation
function createTransactionElement(txn) {
  const li = document.createElement('li');
  li.className = 'transaction-item';
  li.dataset.transactionId = txn.id;
  li.innerHTML = `
    <div class="transaction-content">
      <span class="transaction-name">${escapeHtml(txn.itemName)}</span>
      <span class="transaction-category" style="background-color: ${txn.categoryColor}">
        ${txn.categoryName}
      </span>
    </div>
    <div class="transaction-meta">
      <span class="transaction-amount">${formatIDR(txn.amount)}</span>
      <span class="transaction-date">${formatDate(txn.date)}</span>
    </div>
    <button class="btn btn-delete" data-delete-id="${txn.id}">Hapus</button>
  `;
  return li;
}

// Utility to escape HTML
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
```

#### Performance Considerations

1. **Debounce Render Updates:**
   ```javascript
   function debounce(func, wait) {
     let timeout;
     return function executedFunction(...args) {
       const later = () => {
         clearTimeout(timeout);
         func(...args);
       };
       clearTimeout(timeout);
       timeout = setTimeout(later, wait);
     };
   }
   
   const debouncedRender = debounce(renderUI, 300);
   ```

2. **Virtual DOM-like Approach:**
   - Only update changed DOM elements
   - Use `element.textContent` instead of re-rendering
   - Minimize DOM reflows

3. **Lazy Render:**
   - Render transaction list items on demand (if > 100 items)
   - Use intersection observer for lazy loading

4. **Chart Reuse:**
   - Destroy and recreate charts only on data change
   - Keep chart instances in variables

---

## Responsive Design Strategy

### Breakpoints

```javascript
const breakpoints = {
  mobile: 480,      // ≤480px
  tablet: 1024,     // 481-1024px
  desktop: 1025     // >1024px
};

function getCurrentBreakpoint() {
  const width = window.innerWidth;
  if (width <= breakpoints.mobile) return 'mobile';
  if (width <= breakpoints.tablet) return 'tablet';
  return 'desktop';
}
```

### Media Queries Strategy

**Mobile-First Approach:**
```css
/* Base styles (mobile) */
.app-container {
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

/* Tablet breakpoint */
@media (min-width: 481px) {
  .app-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 1.5rem;
    gap: 1.5rem;
  }
}

/* Desktop breakpoint */
@media (min-width: 1025px) {
  .app-container {
    grid-template-columns: 1fr 1fr 1fr;
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }
}
```

### Flexible Containers

```css
/* Instead of fixed widths */
.form-container {
  width: 100%;           /* Full width on mobile */
  max-width: 600px;      /* Cap width on larger screens */
  margin: 0 auto;        /* Center when capped */
}

/* For charts */
.chart-container {
  position: relative;
  width: 100%;
  max-width: 400px;
  aspect-ratio: 1 / 1;   /* Keep square aspect ratio */
}

/* For cards */
.card {
  width: calc(100% - 2rem);  /* Full width with padding */
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}
```

---

## Error Handling & Edge Cases

### Empty Transaction List
**Scenario:** No transactions added yet

**Handling:**
```javascript
if (transactions.length === 0) {
  document.getElementById('transactionList').style.display = 'none';
  document.getElementById('emptyState').style.display = 'block';
  document.getElementById('totalSpendingDisplay').textContent = 'Rp 0';
  hideCharts();
}
```

**UI Display:**
- Message: "Belum ada transaksi"
- Icon/visual indicator
- Charts hidden or show "Belum ada data"
- Total spending: "Rp 0"

---

### Empty Month (No Transactions)
**Scenario:** Selected month has no transactions

**Handling:**
```javascript
function updateMonthlySummary(selectedMonth) {
  const monthTransactions = filterTransactionsByMonth(selectedMonth);
  
  if (monthTransactions.length === 0) {
    document.getElementById('monthlySummaryTotal').textContent = 'Rp 0';
    document.getElementById('monthlyTransactionCount').textContent = '0';
    document.getElementById('emptyChartMessage').style.display = 'block';
    document.getElementById('miniPieChart').style.display = 'none';
  } else {
    // Render normally
  }
}
```

**UI Display:**
- Total spending: "Rp 0"
- Transaction count: "0"
- Mini pie chart: "Belum ada data"

---

### Local Storage Quota Exceeded
**Scenario:** Browser storage quota full

**Handling:**
```javascript
function saveToLocalStorage() {
  try {
    localStorage.setItem('app_data', JSON.stringify(data));
  } catch (error) {
    if (error.name === 'QuotaExceededError' || 
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      showErrorMessage(
        'Storage penuh. Silakan clear data lama atau gunakan device berbeda.'
      );
      return false;
    }
    throw error;
  }
}
```

**UI Display:**
- Error message in toast/alert
- Transaction not saved
- User informed to clear old data

---

### Form Validation Errors
**Scenario:** User submits incomplete/invalid form

**Handling:**
```javascript
function validateForm() {
  const errors = {};
  
  if (!formState.itemName.trim()) {
    errors.itemName = 'Item Name wajib diisi';
  }
  
  if (!formState.amount || formState.amount <= 0 || isNaN(formState.amount)) {
    errors.amount = 'Jumlah harus angka positif';
  }
  
  if (!formState.category) {
    errors.category = 'Kategori wajib dipilih';
  }
  
  return { isValid: Object.keys(errors).length === 0, errors };
}

function displayErrors(errors) {
  document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
  
  Object.entries(errors).forEach(([field, message]) => {
    document.getElementById(`${field}Error`).textContent = message;
    document.getElementById(field).classList.add('error');
  });
}
```

**UI Display:**
- Field-specific error messages below inputs
- Field borders highlighted in red
- Submit button remains enabled (user can retry)

---

### Invalid Data on Load
**Scenario:** Corrupted or invalid data in Local Storage

**Handling:**
```javascript
function loadFromLocalStorage() {
  try {
    const data = JSON.parse(localStorage.getItem('app_data'));
    
    // Validate data structure
    if (!Array.isArray(data.transactions)) throw new Error('Invalid transactions');
    if (!Array.isArray(data.categories)) throw new Error('Invalid categories');
    if (typeof data.spendingLimits !== 'object') throw new Error('Invalid limits');
    
    // Validate transaction objects
    data.transactions.forEach(txn => {
      if (!txn.id || !txn.itemName || !txn.amount || !txn.category) {
        throw new Error('Invalid transaction object');
      }
    });
    
    return data;
  } catch (error) {
    console.error('Data corruption detected:', error);
    showWarningMessage('Data rusak. Sistem akan di-reset.');
    localStorage.removeItem('app_data');
    return getDefaultAppState();
  }
}

function getDefaultAppState() {
  return {
    transactions: [],
    categories: getDefaultCategories(),
    spendingLimits: {},
    metadata: { version: '1.0', lastUpdated: Date.now() }
  };
}
```

---

### Item Name > 50 Characters
**Scenario:** User tries to add item name longer than 50 chars

**Handling:**
```javascript
// HTML input constraint
<input type="text" id="itemName" maxlength="50" required>

// JavaScript validation
if (formState.itemName.length > 50) {
  errors.itemName = 'Item Name maksimal 50 karakter';
}

// Display truncated in list
function displayTransactionName(name) {
  if (name.length > 40) {
    return name.substring(0, 37) + '...';  // Ellipsis for visual indication
  }
  return name;
}

// Full name in tooltip
<span title="${fullName}">${displayedName}</span>
```

---

### Category Deletion with In-Use Items
**Scenario:** User tries to delete category with active transactions

**Handling:**
```javascript
function canDeleteCategory(categoryId) {
  const usageCount = state.transactions.filter(t => t.category === categoryId).length;
  return usageCount === 0;
}

function deleteCategory(categoryId) {
  if (!canDeleteCategory(categoryId)) {
    const usageCount = state.transactions.filter(t => t.category === categoryId).length;
    showReassignmentModal(categoryId, usageCount);
    return;
  }
  
  // Safe to delete
  state.categories = state.categories.filter(c => c.id !== categoryId);
  saveToLocalStorage();
  updateUI();
}

function reassignAndDeleteCategory(oldCategoryId, newCategoryId) {
  // Reassign all transactions
  state.transactions.forEach(txn => {
    if (txn.category === oldCategoryId) {
      txn.category = newCategoryId;
    }
  });
  
  // Delete category
  state.categories = state.categories.filter(c => c.id !== oldCategoryId);
  
  saveToLocalStorage();
  updateUI();
}
```

---

## Error Handling

### Form Validation Errors

**Item Name Validation:**
- Empty check: "Item Name wajib diisi"
- Max length (50 chars): Enforced via HTML `maxlength` attribute
- Display: Inline error message below field with red text

**Amount Validation:**
- Empty check: "Jumlah wajib diisi"
- Positive number check: "Jumlah harus angka positif"
- Type validation: Reject non-numeric input
- Display: Inline error message below field

**Category Validation:**
- Selection required: "Kategori wajib dipilih"
- Valid option check: Must be from available categories
- Display: Inline error message below field

**Error Recovery:**
- Clear errors when user corrects field
- Form remains on page (doesn't navigate away)
- User can retry submission

### Data Integrity Errors

**Local Storage Quota Exceeded:**
- Error message: "Storage penuh. Silakan clear data lama atau gunakan device berbeda."
- Handling: Transaction not saved, user informed
- Recovery: User must clear old data manually or use different device

**Data Corruption on Load:**
- Detect invalid JSON or structure
- Show warning: "Data rusak. Sistem akan di-reset."
- Action: Reset to default state, preserve as much valid data as possible
- Recovery: Fresh app state initialized

**Invalid Transaction Object:**
- Check: All required fields present (id, itemName, amount, category, date, timestamp)
- Action: Remove corrupted transaction from state
- Logging: Log error to console for debugging

### User Action Confirmations

**Delete Transaction:**
- Confirmation modal optional (nice-to-have)
- Success message after deletion
- Cascade updates verified before deletion

**Delete Custom Category with In-Use Items:**
- Warning modal: "Kategori ini dipakai X transaksi"
- Force reassignment to another category
- Clear confirmation required

**Set Spending Limit:**
- Validation: Amount must be positive integer
- Error display: "Jumlah harus angka positif"
- Success confirmation: "Limit berhasil disimpan"

### Empty States

**No Transactions:**
- Message: "Belum ada transaksi"
- Icon/visual indicator
- Charts hidden
- Total Spending: "Rp 0"

**No Transactions in Selected Month:**
- Message: "Belum ada transaksi di bulan ini"
- Mini pie chart: "Belum ada data"
- Monthly total: "Rp 0"
- Transaction count: "0"

**No Spending Limit Set:**
- Message: "Limit belum diatur"
- Button: "Set Limit"
- Status display: Normal state (no color coding)

---

## Correctness Properties

### Property 1: Not Suitable for Property-Based Testing

This feature does not utilize property-based testing. The Expense & Budget Visualizer is a UI-centric state management application without pure algorithmic logic suitable for universal property verification across randomized inputs.

**Rationale:**
- Core functionality involves DOM manipulation, form handling, and browser APIs (not pure functions)
- Relies on Local Storage I/O operations (not deterministic logic)
- Integrates external Chart.js library (not application logic)
- No universal "for all inputs" properties applicable

**See Testing Strategy section for appropriate example-based and integration testing approaches.**

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9**

---

## Testing Strategy

**Validation Functions:**
- `validateFormInput()`: Test all validation rules with valid/invalid inputs
- `validateCategoryName()`: Test unique, empty, length constraints
- `validateSpendingLimit()`: Test positive amount validation

**Format Functions:**
- `formatIDR()`: Test Rp 0, Rp 100, Rp 1.000, Rp 1.000.000+ formats
- `formatDate()`: Test date formatting with various dates
- `generateTransactionId()`: Test ID uniqueness and format

**State Management:**
- `addTransaction()`: Test adding valid transaction, updating state
- `deleteTransaction()`: Test removal, cascade updates
- `updateSpendingLimit()`: Test limit storage and retrieval
- `filterTransactionsByMonth()`: Test month filtering logic

**Storage Functions:**
- `saveToLocalStorage()`: Test serialization, error handling
- `loadFromLocalStorage()`: Test deserialization, corruption handling
- `migrateOldData()`: Test backward compatibility (if applicable)

**Category Management:**
- `addCategory()`: Test unique names, color assignment
- `deleteCategory()`: Test with/without in-use items
- `reassignTransactions()`: Test bulk category reassignment

### Integration Testing Approach

**Transaction Workflow:**
1. Add transaction → Verify in list → Delete → Verify removal
2. Add transaction → Verify total spending updated
3. Add transaction → Verify pie chart updated
4. Add transaction to month → Verify monthly summary updated

**Category Workflow:**
1. Add custom category → Verify in dropdown
2. Use category in transaction → Verify in pie chart
3. Delete unused category → Verify removal
4. Delete used category → Reassign → Verify transactions updated

**Responsive Layout:**
1. Resize to mobile (480px) → Verify single-column layout
2. Resize to tablet (750px) → Verify two-column layout
3. Resize to desktop (1200px) → Verify grid layout
4. Test on actual mobile device (iOS Safari, Android Chrome)

**Browser Compatibility:**
- Chrome (latest): Full compatibility
- Firefox (latest): Full compatibility
- Edge (latest): Full compatibility
- Safari (latest): Full compatibility

### Manual Testing Checklist

**Form Input:**
- [ ] Submit empty form → Show validation errors
- [ ] Enter text in Amount field → Show error
- [ ] Enter negative amount → Show error
- [ ] Enter 0 amount → Show error
- [ ] Fill all fields correctly → Submit succeeds
- [ ] After submit → Form clears and focus on Item Name

**Transaction List:**
- [ ] New transaction appears at top of list
- [ ] Hover on transaction → Delete button appears
- [ ] Click delete → Transaction removed
- [ ] Transaction list scrolls independently
- [ ] Empty state displays when no transactions

**Total Spending:**
- [ ] Displays "Rp 0" initially
- [ ] Updates immediately after adding transaction
- [ ] Correct calculation with multiple transactions
- [ ] Correct format (Rp X.XXX, Rp X.XXX.XXX)

**Pie Charts:**
- [ ] Main chart updates when transactions added
- [ ] Hover on slice → Tooltip shows category and amount
- [ ] Colors match category assignments
- [ ] Empty state when no transactions
- [ ] Responsive resize on window resize

**Monthly Summary:**
- [ ] Shows current month on load
- [ ] Navigation buttons work (prev/next month)
- [ ] Monthly total calculated correctly
- [ ] Transaction count correct
- [ ] Mini chart updates with month selection

**Spending Limit:**
- [ ] Set limit shows in summary
- [ ] Green status when 0-79% of limit
- [ ] Orange status when 80-99% of limit
- [ ] Red status when ≥100% of limit
- [ ] Edit limit updates display

**Custom Categories:**
- [ ] Can add category with name and color
- [ ] Duplicate name rejected
- [ ] Category appears in dropdown
- [ ] Category used in pie chart
- [ ] Can delete unused category
- [ ] Delete used category shows reassignment dialog

**Responsive Design:**
- [ ] Mobile (480px): Single column, all elements visible
- [ ] Tablet (750px): Two columns, good spacing
- [ ] Desktop (1200px): Grid layout, balanced

**Data Persistence:**
- [ ] Add transaction → Refresh → Data still there
- [ ] Add category → Refresh → Category still there
- [ ] Set limit → Refresh → Limit still there
- [ ] Clear browser cache → Data lost (expected)

---

## Summary of Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Single JS File** | Simplicity, ease of deployment, no build process |
| **Event-Driven State** | Observer pattern for reactivity without framework |
| **Local Storage** | Simple persistence, no backend needed |
| **CSS Flexbox + Grid** | Responsive layouts, modern browser support |
| **Chart.js Library** | Proven, lightweight chart solution |
| **Mobile-First CSS** | Progressive enhancement, better performance |
| **IDR Format** | Requirement-driven, clear financial display |
| **Component-like Structure** | Organization without framework complexity |

---

