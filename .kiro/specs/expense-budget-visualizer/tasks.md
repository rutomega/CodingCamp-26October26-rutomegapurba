# Implementation Plan: Expense & Budget Visualizer

## Overview

This implementation plan breaks down the Expense & Budget Visualizer application into actionable coding tasks. The application is a vanilla JavaScript SPA that tracks personal expenses with real-time visualization, monthly budgeting, and persistent Local Storage. Tasks are organized in 8 phases: Project Setup, Core Data Management, UI Component Rendering, Interactive Features, State & Cascade Updates, Responsive Design, Polish & Testing, and Final Integration.

---

## Tasks

### PHASE 1: PROJECT SETUP & INFRASTRUCTURE

- [ ] 1. Project Structure & HTML Setup
  - [-] 1.1 Create folder structure (css/, js/, assets/ if needed)
    - Create directory structure with css and js folders
    - _Requirements: 12.6_

  - [-] 1.2 Create index.html with semantic HTML structure
    - Build base HTML template with proper meta tags (viewport, charset)
    - Include Chart.js from CDN
    - Add semantic HTML sections: header, main, footer
    - _Requirements: 12.1, 12.6_

  - [-] 1.3 Link CSS and JS files in index.html
    - Link css/style.css file
    - Link js/app.js file at end of body
    - Verify no console errors on page load
    - _Requirements: 12.1, 12.6_

- [ ] 2. CSS Foundation & Design Tokens
  - [-] 2.1 Create css/style.css with CSS variables for design tokens
    - Define color palette: category colors (Food #FF6B6B, Transport #4ECDC4, Fun #FFE66D), UI colors, alert colors
    - Define typography system: font-family, font-sizes (12px body, 16px headings), font-weights
    - Define spacing units (8px base system: 8px, 16px, 24px, 32px)
    - Define responsive breakpoints (480px, 1024px)
    - _Requirements: 11.1, 11.5, 11.6_

  - [-] 2.2 Add CSS reset and basic normalize styles
    - Box-sizing reset (border-box)
    - Remove default margins and paddings
    - Set base font and line-height
    - _Requirements: 11.6_

  - [-] 2.3 Create utility classes for common patterns
    - Hidden state (.hidden display: none)
    - Container width constraints
    - Flex and grid utilities
    - _Requirements: 11.2_

- [ ] 3. JavaScript Architecture Setup
  - [-] 3.1 Create js/app.js with State Store and event system
    - Implement StateStore singleton class with subscribe/unsubscribe/notify methods
    - Initialize global state object with empty transactions, categories, spendingLimits arrays
    - Setup event type constants (transaction:added, transaction:deleted, category:added, etc)
    - _Requirements: 1.3, 9.1_

  - [-] 3.2 Implement Local Storage interface
    - Create saveToLocalStorage() function
    - Create loadFromLocalStorage() function
    - Create clearLocalStorage() function (for debugging/reset)
    - Handle data serialization and deserialization
    - _Requirements: 9.1, 9.3_

  - [-] 3.3 Create utility functions module
    - generateId() - UUID generation for transactions
    - formatIDR(amount) - Format numbers to Rp X.XXX format
    - getCurrentDate() - Get current date in YYYY-MM-DD format
    - getCurrentTime() - Get current time in HH:MM format
    - parseMonth(year, month) - Parse month string
    - _Requirements: 1.8, 4.4_

- [ ] 4. Application Initialization
  - [ ] 4.1 Create app initialization function
    - Load data from Local Storage on app start
    - Initialize default categories (Food, Transport, Fun) if first time
    - Initialize event listeners for state changes
    - Call initial render functions for all components
    - _Requirements: 9.2_

---

### PHASE 2: CORE FEATURES - DATA MANAGEMENT

- [ ] 5. Local Storage Integration & Persistence
  - [~] 5.1 Implement data save/load cycle
    - Implement saveToLocalStorage() with error handling for quota exceeded
    - Implement loadFromLocalStorage() with data validation on load
    - Setup auto-save on every state change
    - _Requirements: 9.1, 9.4, 9.5_

  - [~] 5.2 Add error handling for Local Storage
    - Catch quota exceeded errors
    - Display user-friendly error message
    - Implement fallback behavior
    - _Requirements: 9.5_

- [ ] 6. Transaction Management (Core CRUD)
  - [~] 6.1 Implement addTransaction() function
    - Accept itemName, amount, category parameters
    - Generate unique transaction ID
    - Capture current date and time
    - Add to state.transactions array
    - Trigger cascade updates
    - _Requirements: 1.3, 1.8, 3.1_

  - [~] 6.2 Implement deleteTransaction() function
    - Accept transactionId parameter
    - Find and remove transaction from array
    - Trigger cascade updates
    - _Requirements: 3.1, 3.2_

  - [~] 6.3 Implement transaction sorting (newest first)
    - Sort transactions by timestamp descending
    - Call after each transaction add/delete
    - _Requirements: 2.4_

- [ ] 7. Category Management - Default & Custom
  - [~] 7.1 Implement getCategories() function
    - Return default categories: Food, Transport, Fun
    - Merge with custom categories from state
    - Include category name, id, color, default flag
    - _Requirements: 6.1_

  - [~] 7.2 Implement addCustomCategory() function
    - Accept categoryName and color parameters
    - Validate: non-empty name, unique (case-insensitive), non-empty color
    - Generate unique category ID
    - Add to state.categories
    - Trigger state update
    - _Requirements: 6.2, 6.3, 6.4_

  - [~] 7.3 Implement deleteCustomCategory() function
    - Accept categoryId parameter
    - Validate: only custom categories can be deleted (not defaults)
    - Check if category is in use by any transactions
    - If in use: return list of affected transactions for reassignment
    - If not in use: delete directly
    - Trigger state update
    - _Requirements: 6.7, 6.8, 6.9_

  - [~] 7.4 Implement reassignTransactions() function
    - Accept oldCategoryId, newCategoryId parameters
    - Find all transactions with oldCategoryId
    - Update their category to newCategoryId
    - Trigger cascade updates
    - _Requirements: 6.7_

- [ ] 8. Spending Limit Management
  - [~] 8.1 Implement setSpendingLimit() function
    - Accept year, month, limitAmount parameters
    - Validate limitAmount > 0
    - Store in state.spendingLimits object with "YYYY-MM" format key
    - Trigger state update
    - _Requirements: 8.3, 8.4, 8.5_

  - [~] 8.2 Implement getSpendingLimit() function
    - Accept year, month parameters
    - Return limit amount or null if not set
    - _Requirements: 8.9_

  - [~] 8.3 Implement calculateLimitStatus() function
    - Accept monthlySpending and limitAmount parameters
    - Return status object: { status: 'NORMAL'|'WARNING'|'EXCEEDED', message, color, remaining }
    - NORMAL: 0-79% → "Rp X tersisa dari limit Rp Y"
    - WARNING: 80-99% → "Perhatian! Sudah 80% dari limit"
    - EXCEEDED: ≥100% → "Limit terlampaui Rp X"
    - _Requirements: 8.7_

---

### PHASE 3: UI COMPONENTS - STATIC RENDERING

- [ ] 9. Header Component (Total Spending Display)
  - [~] 9.1 Create renderHeader() function
    - Calculate total spending from all transactions
    - Format amount in IDR (Rp X.XXX format)
    - Render to #totalSpendingDisplay element
    - Apply large, bold, prominent styling
    - _Requirements: 4.1, 4.4_

  - [~] 9.2 Setup header update listener
    - Subscribe to state changes
    - Call renderHeader() when transactions change
    - _Requirements: 4.2_

- [ ] 10. Input Form Component
  - [~] 10.1 Create HTML form structure with 3 fields
    - Item Name input (text, max 50 chars)
    - Amount input (type number, min 1)
    - Category dropdown (populated from categories)
    - Submit button
    - Error message containers for each field
    - _Requirements: 1.1_

  - [~] 10.2 Implement form validation logic
    - Validate Item Name: required, non-empty, max 50 chars
    - Validate Amount: required, positive number, > 0
    - Validate Category: required, valid category selection
    - Display field-specific error messages
    - _Requirements: 1.4, 1.5, 1.9_

  - [~] 10.3 Create renderForm() function
    - Populate category dropdown from getCategories()
    - Clear previous error messages
    - Ensure form displays correctly
    - _Requirements: 1.1, 1.2_

  - [~] 10.4 Implement form reset functionality
    - Clear all field values
    - Clear all error messages
    - Set focus to Item Name field
    - _Requirements: 1.6_

- [ ] 11. Transaction List Component
  - [~] 11.1 Create renderTransactionList() function
    - Loop through state.transactions
    - Create transaction item HTML for each: name, amount (IDR), category (color badge), date
    - Include delete button per transaction
    - Append to #transactionList element
    - _Requirements: 2.1_

  - [~] 11.2 Implement empty state display
    - Show "Belum ada transaksi" message when transactions array is empty
    - Hide message when transactions exist
    - _Requirements: 2.5_

  - [~] 11.3 Setup transaction list scrollability
    - Set container max-height for independent scrolling
    - Prevent horizontal scroll
    - Keep header sticky (not affected by transaction list scroll)
    - _Requirements: 2.2, 2.3_

  - [~] 11.4 Implement category color display per transaction
    - Get category color from state.categories
    - Apply as background color in transaction item
    - _Requirements: 2.7, 5.6_

  - [~] 11.5 Setup transaction list update listener
    - Subscribe to transaction changes
    - Call renderTransactionList() on add/delete
    - _Requirements: 2.1_

- [ ] 12. Monthly Summary Component
  - [~] 12.1 Create renderMonthlySummary() function
    - Display month/year selector with prev/next buttons
    - Calculate and display total monthly spending (IDR format)
    - Calculate and display transaction count for month
    - Render mini pie chart for month
    - _Requirements: 7.1_

  - [~] 12.2 Implement month navigation
    - Store selected month in component state
    - Implement prev/next button handlers
    - Update summary display when month changes
    - Sync with Spending Limit Alert for selected month
    - _Requirements: 7.2_

  - [~] 12.3 Implement monthly data filtering
    - Filter transactions by selected year and month
    - Calculate total spending for filtered transactions
    - Count filtered transactions
    - _Requirements: 7.1_

  - [~] 12.4 Implement default to current month
    - On app initialization, set selected month to current month
    - Show current month's data
    - _Requirements: 7.6_

  - [~] 12.5 Setup monthly summary update listener
    - Subscribe to transaction and limit changes
    - Re-render when selected month has changes
    - _Requirements: 7.4_

- [ ] 13. Spending Limit Alert Component
  - [~] 13.1 Create renderSpendingLimitAlert() function
    - Get spending limit for selected month
    - Calculate current status (NORMAL/WARNING/EXCEEDED/NOT SET)
    - Display status with appropriate color
    - Display message and remaining/exceeded amount
    - Include Set/Edit button
    - _Requirements: 8.1, 8.7_

  - [~] 13.2 Implement limit status color coding
    - GREEN (#4CAF50) for NORMAL (0-79%)
    - ORANGE (#FF9800) for WARNING (80-99%)
    - RED (#F44336) for EXCEEDED (≥100%)
    - GRAY for NOT SET
    - _Requirements: 8.7_

  - [~] 13.3 Setup limit alert update listener
    - Subscribe to spending limit and transaction changes
    - Re-render when monthly spending or limit changes
    - _Requirements: 8.8_

- [ ] 14. Main Pie Chart Component
  - [~] 14.1 Create renderMainPieChart() function
    - Initialize Chart.js pie chart for all transactions
    - Group transactions by category and calculate totals
    - Assign colors from category definitions
    - Display chart in #mainPieChart canvas
    - _Requirements: 5.1, 5.6_

  - [~] 14.2 Implement pie chart tooltips
    - Show "Category Name: Rp X.XXX (Y%)" on hover
    - Use Chart.js tooltip callbacks
    - _Requirements: 5.3_

  - [~] 14.3 Implement empty state for pie chart
    - Show "Belum ada data" message when no transactions
    - Hide chart when no data
    - _Requirements: 5.4_

  - [~] 14.4 Setup pie chart update listener
    - Subscribe to transaction changes
    - Destroy existing chart and create new on data change
    - _Requirements: 5.2, 5.7_

- [ ] 15. Mini Pie Chart Component (Monthly Summary)
  - [~] 15.1 Create renderMiniPieChart() function
    - Initialize Chart.js pie chart for selected month transactions
    - Filter transactions by selected month
    - Group by category and calculate totals
    - Display in smaller size than main chart
    - _Requirements: 7.1, 7.8_

  - [~] 15.2 Implement mini chart responsiveness
    - Use smaller canvas size than main chart
    - Maintain readability at smaller size
    - Adjust legend position for space efficiency
    - _Requirements: 7.8_

  - [~] 15.3 Implement mini chart tooltips
    - Show "Category Name: Rp X.XXX (Y%)" on hover
    - _Requirements: 7.5_

  - [~] 15.4 Setup mini chart update listener
    - Subscribe to transaction and month changes
    - Update chart when selected month changes
    - Update chart when transactions change
    - _Requirements: 7.4_

- [ ] 16. Category Manager Component
  - [~] 16.1 Create renderCategoryManager() function
    - Display default categories (Food, Transport, Fun) with non-deletable badge
    - Display custom categories with delete buttons
    - Show category color indicators
    - Include "Add Category" button
    - _Requirements: 6.1_

  - [~] 16.2 Display category usage count (optional)
    - Calculate transaction count per category
    - Display count near each category
    - _Requirements: 6.7_

  - [~] 16.3 Setup category manager update listener
    - Subscribe to category and transaction changes
    - Re-render when categories are added/deleted
    - _Requirements: 6.9_

---

### PHASE 4: UI INTERACTIONS & MODALS

- [ ] 17. Add Category Modal & Form
  - [~] 17.1 Create showAddCategoryModal() function
    - Display modal overlay with form
    - Category name input field
    - Color picker input (type="color")
    - Save and Cancel buttons
    - _Requirements: 6.2_

  - [~] 17.2 Implement add category form validation
    - Validate name: non-empty, not duplicate (case-insensitive), max reasonable length
    - Validate color: non-empty hex value
    - Display error messages for validation failures
    - _Requirements: 6.3, 6.4_

  - [~] 17.3 Implement add category submit handler
    - Get form values
    - Call addCustomCategory() with validation
    - Close modal on success
    - Display success message
    - Refresh category dropdown in form
    - _Requirements: 6.5_

  - [~] 17.4 Implement modal close handler
    - Close modal on Cancel button click
    - Close modal on X button click
    - Reset form fields when closing
    - _Requirements: 17.1_

- [ ] 18. Delete Category Modal & Logic
  - [~] 18.1 Create showDeleteCategoryModal() function
    - Display modal with category delete confirmation
    - Show warning if category is in use
    - _Requirements: 6.7_

  - [~] 18.2 Implement reassignment dropdown for in-use categories
    - If category in use: show dropdown with other categories
    - If category not in use: show direct delete confirmation
    - Display transaction count using category
    - _Requirements: 6.7_

  - [~] 18.3 Implement delete category submit handler
    - Get reassignment category if needed
    - Call reassignTransactions() if necessary
    - Call deleteCustomCategory()
    - Close modal on success
    - _Requirements: 6.7, 6.8_

  - [~] 18.4 Implement modal cancel handler
    - Close modal without making changes
    - Reset form state
    - _Requirements: 18.1_

- [ ] 19. Set Spending Limit Modal & Logic
  - [~] 19.1 Create showSetLimitModal() function
    - Display modal with spending limit form
    - Show current month display (disabled field or label)
    - Limit amount input (type number, min 1)
    - Save and Cancel buttons
    - Display current limit if already set
    - _Requirements: 8.2_

  - [~] 19.2 Implement spending limit form validation
    - Validate amount: required, positive number, > 0
    - Display error messages
    - _Requirements: 8.3, 8.4_

  - [~] 19.3 Implement spending limit submit handler
    - Get form values
    - Call setSpendingLimit() with selected month
    - Close modal on success
    - Display success message
    - Refresh Spending Limit Alert display
    - _Requirements: 8.5, 8.6_

  - [~] 19.4 Implement modal cancel handler
    - Close modal without saving
    - Reset form state
    - _Requirements: 19.1_

- [ ] 20. Form Submission Handlers
  - [~] 20.1 Implement transaction form submit handler
    - Prevent default form submission
    - Get form field values
    - Call validation function
    - If valid: call addTransaction(), reset form, display success
    - If invalid: display error messages
    - _Requirements: 1.3, 1.6, 1.9_

  - [~] 20.2 Add form field value change handlers
    - Clear field error message on user input
    - Validate in real-time (optional for UX)
    - _Requirements: 1.4_

- [ ] 21. Delete Transaction Handler
  - [~] 21.1 Implement delete button click handler
    - Use event delegation on transaction list
    - Get transaction ID from button data attribute
    - Call deleteTransaction() function
    - Trigger cascade updates
    - _Requirements: 3.1, 3.2_

  - [~] 21.2 Add optional confirmation (optional enhancement)
    - Show confirm dialog before deleting (optional)
    - Proceed with delete on confirm
    - _Requirements: 3.1_

- [ ] 22. Month Navigation Handler
  - [~] 22.1 Implement prev/next month buttons
    - Get selected month
    - Calculate previous/next month (handle year boundaries)
    - Update selectedMonth state
    - Trigger monthly summary update
    - _Requirements: 7.2_

  - [~] 22.2 Update dependent components on month change
    - Update spending limit alert for new month
    - Update mini pie chart for new month
    - Update monthly spending total display
    - _Requirements: 7.2, 7.7_

---

### PHASE 5: STATE & REACTIVE UPDATES

- [ ] 23. Event System Implementation
  - [~] 23.1 Implement subscribe/unsubscribe mechanism
    - Setup listeners array in StateStore
    - Implement subscribe(callback) - add listener
    - Implement unsubscribe(callback) - remove listener
    - _Requirements: 9.1_

  - [~] 23.2 Implement notify/broadcast mechanism
    - Implement notify(action, data) - call all listeners
    - Pass action type, data, and current state to listeners
    - _Requirements: 9.1_

  - [~] 23.3 Setup event type constants
    - Define event constants: transaction:added, transaction:deleted, category:added, category:deleted, limit:updated
    - Use consistently throughout app
    - _Requirements: 9.1_

- [ ] 24. Cascade Update Implementation
  - [~] 24.1 Create updateTotalSpending() function
    - Calculate sum of all transaction amounts
    - Call renderHeader() to display
    - _Requirements: 3.2, 4.2_

  - [~] 24.2 Create updateMonthlySummary() function
    - Recalculate monthly spending and count
    - Call renderMonthlySummary() to display
    - _Requirements: 3.2, 7.4_

  - [~] 24.3 Create updateCharts() function
    - Call renderMainPieChart() for all-transactions chart
    - Call renderMiniPieChart() for monthly chart
    - _Requirements: 3.2, 5.2, 7.4_

  - [~] 24.4 Create updateSpendingLimitAlert() function
    - Recalculate limit status for selected month
    - Call renderSpendingLimitAlert() to display
    - _Requirements: 3.2, 8.8_

  - [~] 24.5 Create updateAllDependents() function
    - Master function that calls all update functions
    - Call after every transaction add/delete/update
    - Ensure consistent state across all components
    - _Requirements: 3.2_

- [ ] 25. Component Re-render System
  - [~] 25.1 Setup listeners for transaction changes
    - Subscribe to transaction:added and transaction:deleted events
    - Call updateAllDependents() on transaction change
    - _Requirements: 2.1, 3.2, 4.2, 5.2_

  - [~] 25.2 Setup listeners for category changes
    - Subscribe to category:added and category:deleted events
    - Call updateAllDependents() when categories change
    - Re-render category manager and form dropdown
    - _Requirements: 6.5, 6.9_

  - [~] 25.3 Setup listeners for spending limit changes
    - Subscribe to limit:updated event
    - Call updateSpendingLimitAlert()
    - _Requirements: 8.8_

  - [~] 25.4 Verify no redundant re-renders
    - Test that components only re-render when necessary
    - Check console for performance issues
    - _Requirements: 5.2_

---

### PHASE 6: RESPONSIVE DESIGN

- [ ] 26. Mobile Layout (≤480px)
  - [~] 26.1 Implement single column layout for mobile
    - Create media query for max-width: 480px
    - Stack all sections vertically
    - Set containers to 100% width minus padding
    - Use flexbox for vertical arrangement
    - _Requirements: 10.1, 10.2, 10.7, 10.17_

  - [~] 26.2 Implement mobile-friendly form layout
    - Form fields full width
    - Stacked vertical arrangement
    - Touch-friendly input sizes (min 44px height)
    - Clear labels and error messages
    - _Requirements: 10.2, 10.8_

  - [~] 26.3 Implement mobile transaction list
    - Cards full width, compact format
    - Readable font sizes (min 12px)
    - Horizontal scrollable if needed, but prefer wrap
    - Delete button visible and touch-friendly
    - _Requirements: 10.3_

  - [~] 26.4 Implement mobile pie chart sizing
    - Chart canvas adapts to screen width
    - Remove padding where possible
    - Maintain aspect ratio
    - Legend below chart or hidden if needed
    - _Requirements: 10.4, 10.22_

  - [~] 26.5 Implement mobile monthly summary layout
    - Month selector buttons side-by-side or stacked
    - Stats cards stacked vertically
    - Mini chart full width
    - _Requirements: 10.5_

  - [~] 26.6 Implement mobile spending limit display
    - Compact card format
    - Button full width or inline
    - Status color clearly visible
    - _Requirements: 10.6_

  - [~] 26.7 Verify no horizontal scroll on mobile
    - Test with multiple screen widths (375px, 480px)
    - Ensure all content fits within viewport
    - _Requirements: 10.7_

  - [~] 26.8 Test touch-friendly button sizes
    - All interactive elements ≥44px height/width
    - Adequate spacing between buttons
    - _Requirements: 10.8, 10.24_

- [ ] 27. Tablet Layout (481-1024px)
  - [~] 27.1 Implement 2-column layout for tablet
    - Create media query for 481px-1024px
    - Left column: form, monthly summary, category manager
    - Right column: transaction list
    - Use CSS Grid or Flexbox
    - _Requirements: 10.9, 10.10_

  - [~] 27.2 Implement tablet form + monthly summary positioning
    - Form and monthly summary in left column
    - Appropriate spacing between sections
    - Both take equal visual weight
    - _Requirements: 10.10_

  - [~] 27.3 Implement tablet transaction list
    - Right column scrollable independently
    - Cards maintain readable layout
    - Space efficiently used
    - _Requirements: 10.10_

  - [~] 27.4 Implement tablet chart sizing
    - Charts sized appropriately for tablet screen
    - Pie chart with legend clearly visible
    - Mini chart compact but readable
    - _Requirements: 10.11_

  - [~] 27.5 Maintain readable spacing on tablet
    - Appropriate gaps between columns
    - Padding inside containers
    - Professional appearance
    - _Requirements: 10.10, 10.20_

- [ ] 28. Desktop Layout (>1024px)
  - [~] 28.1 Implement dashboard grid layout for desktop
    - Create media query for min-width: 1025px
    - Top area: header with total spending
    - Upper content area: form + monthly summary + pie chart side-by-side
    - Lower content area: transaction list full width
    - Use CSS Grid for optimal layout
    - _Requirements: 10.13, 10.14_

  - [~] 28.2 Optimize space utilization on desktop
    - Use available width efficiently
    - Create visual balance across sections
    - Avoid cramped or wasted space
    - _Requirements: 10.15_

  - [~] 28.3 Implement desktop chart sizing
    - Main pie chart large and prominent
    - Mini pie chart compact
    - Both charts with clear legends and tooltips
    - _Requirements: 10.14_

  - [~] 28.4 Implement professional desktop appearance
    - Generous spacing and padding
    - Clear visual hierarchy
    - Professional color scheme
    - Smooth interactions
    - _Requirements: 10.15_

  - [~] 28.5 Test desktop breakpoint
    - Test at 1025px, 1200px, 1920px widths
    - Ensure layout works across desktop sizes
    - No horizontal scroll
    - _Requirements: 10.14_

- [ ] 29. Responsive Typography & Components
  - [~] 29.1 Implement responsive font sizing
    - Body text: scale from 12px (mobile) to 14-16px (desktop)
    - Headings: scale from 18px (mobile) to 24-32px (desktop)
    - Use em/rem units with media queries
    - _Requirements: 10.23_

  - [~] 29.2 Ensure text readability across devices
    - Minimum 12px font size on all devices
    - Line-height appropriate for readability
    - Contrast ratio meets standards
    - _Requirements: 10.23_

  - [~] 29.3 Handle text truncation and overflow
    - Implement text truncation where needed
    - Prevent text overflow outside containers
    - Use text-overflow: ellipsis when appropriate
    - _Requirements: 1.7, 10.23_

- [ ] 30. Responsive Charts
  - [~] 30.1 Ensure pie charts resize correctly
    - Chart.js responsive: true setting enabled
    - Canvas maintains aspect ratio
    - Chart resizes smoothly on window resize
    - _Requirements: 10.22, 10.25_

  - [~] 30.2 Maintain chart aspect ratio across devices
    - Define maintainAspectRatio: true in Chart.js options
    - Charts look good at all sizes
    - Legend and tooltips remain readable
    - _Requirements: 10.22_

  - [~] 30.3 Test chart readability mobile/tablet/desktop
    - Test at 375px, 768px, 1920px widths
    - Labels and legend readable at all sizes
    - Tooltips display correctly
    - _Requirements: 10.25_

---

### PHASE 7: POLISH & TESTING

- [ ] 31. Empty States & Edge Cases
  - [~] 31.1 Implement empty transaction list state
    - Display "Belum ada transaksi" message
    - Hide transaction list container or show minimal UI
    - User can still see form and other components
    - _Requirements: 2.5, 3.3_

  - [~] 31.2 Implement empty month state
    - When selected month has no transactions
    - Display "Belum ada transaksi di bulan ini" message
    - Show "Rp 0" for monthly total
    - Show "0" for transaction count
    - Hide mini pie chart or show empty message
    - _Requirements: 7.3_

  - [~] 31.3 Implement empty chart display
    - Show "Belum ada data" message when no transactions
    - Hide pie chart canvas
    - _Requirements: 5.4, 7.3_

  - [~] 31.4 Implement no spending limit display
    - Show "Limit belum diatur" message
    - Display "Set Limit" button
    - _Requirements: 8.10_

- [ ] 32. Validation & Error Messages
  - [~] 32.1 Test form field validation
    - Test empty Item Name → show error
    - Test empty Amount → show error
    - Test Amount <= 0 → show error: "Jumlah harus angka positif"
    - Test empty Category → show error
    - Test valid form → no errors
    - _Requirements: 1.4, 1.5, 1.9_

  - [~] 32.2 Test category name validation
    - Test empty category name → show error
    - Test duplicate category name → show error: "Kategori sudah ada"
    - Test valid category name → no error
    - _Requirements: 6.3, 6.4_

  - [~] 32.3 Test spending limit validation
    - Test empty amount → show error
    - Test amount <= 0 → show error
    - Test valid amount → no error
    - _Requirements: 8.3, 8.4_

  - [~] 32.4 Verify error messages display correctly
    - Error messages appear below relevant fields
    - Error messages are red and visible
    - Error messages clear when user corrects input
    - _Requirements: 11.7, 12.10_

- [ ] 33. Local Storage Error Handling
  - [~] 33.1 Test Local Storage quota exceeded scenario
    - Add many transactions until quota exceeds
    - Verify error message displays
    - Message: "Storage penuh. Silakan clear data lama atau gunakan device berbeda."
    - _Requirements: 9.5_

  - [~] 33.2 Implement graceful error handling
    - Catch quota exceeded errors
    - Prevent app from crashing
    - Display user-friendly error message
    - _Requirements: 9.5_

  - [~] 33.3 Test data corruption recovery
    - Test with invalid Local Storage data
    - Implement validation on load
    - Reset to default if data corrupted
    - _Requirements: 9.2_

- [ ] 34. Cross-Browser Testing
  - [~] 34.1 Test in Chrome latest
    - Form input works
    - Chart.js renders correctly
    - Local Storage works
    - Responsive design works
    - _Requirements: 12.7_

  - [~] 34.2 Test in Firefox latest
    - Form input works
    - Chart.js renders correctly
    - Local Storage works
    - Responsive design works
    - _Requirements: 12.7_

  - [~] 34.3 Test in Edge latest
    - Form input works
    - Chart.js renders correctly
    - Local Storage works
    - Responsive design works
    - _Requirements: 12.7_

  - [~] 34.4 Test in Safari latest
    - Form input works
    - Chart.js renders correctly
    - Local Storage works
    - Responsive design works
    - _Requirements: 12.7_

- [ ] 35. Performance Optimization
  - [~] 35.1 Optimize DOM updates (minimize reflows)
    - Use batch DOM updates where possible
    - Avoid unnecessary re-renders
    - Use CSS transforms instead of layout changes
    - _Requirements: 12.9_

  - [~] 35.2 Optimize Local Storage operations
    - Avoid redundant save calls
    - Batch multiple changes if possible
    - Minimize serialization overhead
    - _Requirements: 9.1_

  - [~] 35.3 Test with 100+ transactions
    - Add 100+ transactions to app
    - Verify no significant lag
    - Monitor console for performance warnings
    - Charts update smoothly
    - _Requirements: 35.3_

  - [~] 35.4 Verify responsive and smooth interactions
    - Button clicks respond immediately
    - Form submission is fast
    - Chart updates smoothly
    - No visible delays or stutters
    - _Requirements: 35.4_

- [ ] 36. Code Cleanup & Documentation
  - [~] 36.1 Add code comments for complex logic
    - Document state management functions
    - Document event handler logic
    - Document cascade update mechanism
    - Include inline comments where logic is not obvious
    - _Requirements: 12.9_

  - [~] 36.2 Ensure consistent code style
    - Use consistent naming conventions (camelCase)
    - Use consistent indentation (2 spaces)
    - Use consistent quote style (single or double)
    - Format code for readability
    - _Requirements: 12.9_

  - [~] 36.3 Remove debug logs and code
    - Remove all console.log() statements
    - Remove commented-out code
    - Clean up temporary test code
    - _Requirements: 36.2_

  - [~] 36.4 Verify maintainable codebase
    - Code is organized in logical sections
    - Function names are descriptive
    - No complex nested logic without comments
    - Easy for other developers to understand
    - _Requirements: 12.9_

---

### PHASE 8: FINAL TESTING & INTEGRATION

- [ ] 37. Manual Testing Checklist
  - [~] 37.1 Test add transaction flow end-to-end
    - Open app
    - Fill form with valid data
    - Click submit
    - Verify transaction appears in list
    - Verify header total updates
    - Verify chart updates
    - Verify monthly summary updates
    - _Requirements: 1.3, 2.1, 4.2, 5.2_

  - [~] 37.2 Test delete transaction flow
    - Click delete button on transaction
    - Verify transaction removed from list
    - Verify header total updates
    - Verify chart updates
    - Verify monthly summary updates
    - _Requirements: 3.1, 3.2_

  - [~] 37.3 Test add custom category flow
    - Click "Add Category" button
    - Fill category form with valid data
    - Click save
    - Verify category appears in dropdown
    - Verify category appears in pie chart
    - _Requirements: 6.2, 6.5, 6.9_

  - [~] 37.4 Test delete custom category (not in use)
    - Create custom category
    - Delete it immediately
    - Verify category removed from dropdown and list
    - _Requirements: 6.8_

  - [~] 37.5 Test delete custom category (in use with reassignment)
    - Create custom category
    - Add transaction using this category
    - Try to delete category
    - Verify reassignment dialog appears
    - Select new category
    - Verify transaction reassigned
    - Verify category deleted
    - _Requirements: 6.7, 6.9_

  - [~] 37.6 Test set spending limit flow
    - Click "Set Limit" button
    - Enter limit amount
    - Click save
    - Verify limit displayed in spending limit section
    - Verify status shows "NORMAL" (assuming under limit)
    - _Requirements: 8.5, 8.6_

  - [~] 37.7 Test spending limit status changes
    - Set limit to specific amount
    - Add transactions to reach different thresholds
    - Verify status changes from NORMAL → WARNING → EXCEEDED
    - Verify colors change appropriately (green → orange → red)
    - Verify messages update correctly
    - _Requirements: 8.7, 8.8_

  - [~] 37.8 Test monthly summary navigation
    - Use prev/next month buttons
    - Verify month display updates
    - Verify spending total updates
    - Verify transaction count updates
    - Verify mini chart updates
    - _Requirements: 7.2, 7.4_

  - [~] 37.9 Test form validation
    - Test empty Item Name → error
    - Test empty Amount → error
    - Test invalid Amount (0 or negative) → error
    - Test empty Category → error
    - Test valid form → no error, transaction added
    - _Requirements: 1.4, 1.5, 1.9_

  - [~] 37.10 Test all modal interactions
    - Test add category modal open/close
    - Test delete category modal open/close
    - Test set limit modal open/close
    - Test cancel buttons work
    - Test close (X) buttons work
    - _Requirements: 17.1, 18.1, 19.1_

  - [~] 37.11 Test responsive design on multiple devices
    - Test on mobile (375px width)
    - Test on tablet (768px width)
    - Test on desktop (1920px width)
    - Verify layout adapts correctly
    - Verify no horizontal scroll
    - Verify all elements visible and readable
    - _Requirements: 10.16-10.24_

- [ ] 38. Data Persistence Testing
  - [~] 38.1 Test data persists after page refresh
    - Add transactions
    - Refresh page (F5)
    - Verify all transactions still present
    - Verify total spending correct
    - Verify categories still present
    - _Requirements: 9.2, 9.4_

  - [~] 38.2 Test data persists after browser close/reopen
    - Add transactions and custom categories
    - Close entire browser
    - Reopen browser and go to app URL
    - Verify all data still present
    - Verify state fully restored
    - _Requirements: 9.4, 9.6_

  - [~] 38.3 Test data integrity across operations
    - Add transactions
    - Add custom categories
    - Delete transactions
    - Delete categories with reassignment
    - Verify data consistency
    - Verify no orphaned data
    - _Requirements: 9.3_

  - [~] 38.4 Test multiple browser tabs (if applicable)
    - Open app in 2 tabs
    - Make changes in tab 1
    - Verify changes don't auto-sync to tab 2 (expected behavior for Local Storage)
    - Refresh tab 2 and verify changes appear
    - _Requirements: 9.1_

- [ ] 39. Accessibility & UX Polish
  - [~] 39.1 Verify keyboard navigation works
    - Tab through form fields
    - Tab through buttons
    - Verify focus indicators visible
    - Verify Enter key submits form
    - _Requirements: 12.9_

  - [~] 39.2 Verify color contrast meets standards
    - Check text contrast ratio (min 4.5:1 for body, 3:1 for large text)
    - Verify alert colors are visible
    - Verify buttons are clearly visible
    - _Requirements: 11.1, 11.5, 12.10_

  - [~] 39.3 Verify touch targets are adequate
    - All buttons ≥44px height/width
    - Adequate spacing between buttons
    - Delete buttons not too close to transaction info
    - _Requirements: 10.8, 10.24_

  - [~] 39.4 Verify error messages are clear
    - Error messages explain what's wrong
    - Error messages provide guidance (e.g., "Jumlah harus angka positif")
    - Error messages are visually distinct
    - _Requirements: 1.4, 11.7, 12.10_

- [ ] 40. Final Integration Testing
  - [~] 40.1 Test all components working together
    - Add transaction → all components update
    - Delete transaction → all components update
    - Add category → form dropdown updates, pie chart updates
    - Delete category → form dropdown updates, pie chart updates, transactions reassigned
    - Set limit → spending limit alert updates
    - Change month → monthly summary updates, limit alert updates
    - _Requirements: 3.2, 5.2_

  - [~] 40.2 Test all user flows end-to-end
    - New user flow: open app, set limit, add transactions, view summary
    - Returning user flow: open app, data loads, continue adding transactions
    - Power user flow: add custom categories, manage complex budget
    - _Requirements: All_

  - [~] 40.3 Test edge cases and error scenarios
    - Test with very large amounts (billions in rupiah)
    - Test with many transactions (100+)
    - Test with many custom categories (20+)
    - Test with very long item names
    - Test Local Storage quota exceeded
    - _Requirements: 1.7, 9.5, 35.3_

  - [~] 40.4 Verify performance acceptable
    - Charts render smoothly with 100+ transactions
    - Form submission is fast
    - Page navigation is responsive
    - No console errors
    - No memory leaks (if testable)
    - _Requirements: 35.2, 35.3_

---

### PHASE 9: OPTIONAL/FUTURE ENHANCEMENTS (Mark as optional tasks)

- [ ] 41. Optional Enhancements
  - [ ]* 41.1 Implement dark mode support
    - Create CSS variables for dark mode colors
    - Add dark mode toggle button
    - Save theme preference to Local Storage
    - Apply theme on app load
    - _Requirements: 11.9_

  - [ ]* 41.2 Implement data export feature
    - Add export button to UI
    - Implement CSV export function
    - Implement JSON export function
    - Allow user to download data
    - _Requirements: 12.8_

  - [ ]* 41.3 Add transaction search/filter
    - Implement search by item name
    - Implement filter by category
    - Display filtered results in transaction list
    - _Requirements: Optional_

  - [ ]* 41.4 Add spending trends/charts
    - Implement monthly spending trend chart
    - Show historical data visualization
    - _Requirements: Optional_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- All data must persist to Local Storage automatically
- State changes trigger cascade updates across all components
- Responsive design handles mobile (≤480px), tablet (481-1024px), and desktop (>1024px)
- All interactive elements must be keyboard and touch accessible
- Cross-browser support required (Chrome, Firefox, Edge, Safari)

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "2.1", "2.2", "2.3", "3.1", "3.2", "3.3", "4.1"] },
    { "id": 1, "tasks": ["5.1", "5.2", "6.1", "6.2", "6.3", "7.1", "7.2", "7.3", "7.4", "8.1", "8.2", "8.3"] },
    { "id": 2, "tasks": ["9.1", "9.2", "10.1", "10.2", "10.3", "10.4", "11.1", "11.2", "11.3", "11.4", "11.5"] },
    { "id": 3, "tasks": ["12.1", "12.2", "12.3", "12.4", "12.5", "13.1", "13.2", "13.3", "14.1", "14.2", "14.3", "14.4"] },
    { "id": 4, "tasks": ["15.1", "15.2", "15.3", "15.4", "16.1", "16.2", "16.3"] },
    { "id": 5, "tasks": ["17.1", "17.2", "17.3", "17.4", "18.1", "18.2", "18.3", "18.4", "19.1", "19.2", "19.3", "19.4"] },
    { "id": 6, "tasks": ["20.1", "20.2", "21.1", "21.2", "22.1", "22.2"] },
    { "id": 7, "tasks": ["23.1", "23.2", "23.3", "24.1", "24.2", "24.3", "24.4", "24.5", "25.1", "25.2", "25.3", "25.4"] },
    { "id": 8, "tasks": ["26.1", "26.2", "26.3", "26.4", "26.5", "26.6", "26.7", "26.8"] },
    { "id": 9, "tasks": ["27.1", "27.2", "27.3", "27.4", "27.5"] },
    { "id": 10, "tasks": ["28.1", "28.2", "28.3", "28.4", "28.5"] },
    { "id": 11, "tasks": ["29.1", "29.2", "29.3", "30.1", "30.2", "30.3"] },
    { "id": 12, "tasks": ["31.1", "31.2", "31.3", "31.4", "32.1", "32.2", "32.3", "32.4"] },
    { "id": 13, "tasks": ["33.1", "33.2", "33.3", "34.1", "34.2", "34.3", "34.4"] },
    { "id": 14, "tasks": ["35.1", "35.2", "35.3", "35.4", "36.1", "36.2", "36.3", "36.4"] },
    { "id": 15, "tasks": ["37.1", "37.2", "37.3", "37.4", "37.5", "37.6", "37.7", "37.8", "37.9", "37.10", "37.11"] },
    { "id": 16, "tasks": ["38.1", "38.2", "38.3", "38.4"] },
    { "id": 17, "tasks": ["39.1", "39.2", "39.3", "39.4", "40.1", "40.2", "40.3", "40.4"] },
    { "id": 18, "tasks": ["41.1", "41.2", "41.3", "41.4"] }
  ]
}
```
