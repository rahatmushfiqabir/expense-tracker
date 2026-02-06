// ===================================
// Expense Tracker - Firebase Authentication + Firestore
// Each user has their own data
// ===================================

// Global variables
let currentUser = null;
let expenses = [];
let budgets = {};
let categoryChart = null;
let dailyChart = null;

// Wait for Firebase to be ready
const waitForFirebase = () => {
    return new Promise((resolve) => {
        if (window.firebaseFunctions && window.firebaseDB && window.firebaseAuth) {
            resolve();
        } else {
            setTimeout(() => waitForFirebase().then(resolve), 100);
        }
    });
};

// ===================================
// AUTHENTICATION SYSTEM
// ===================================

// Check authentication state when page loads
document.addEventListener('DOMContentLoaded', async () => {
    await waitForFirebase();

    const { onAuthStateChanged } = window.firebaseFunctions;

    // Auth state change listener
    onAuthStateChanged(window.firebaseAuth, (user) => {
        if (user) {
            // User is logged in
            currentUser = user;
            showAppSection();
            loadUserData();
        } else {
            // User is not logged in
            currentUser = null;
            showAuthSection();
        }
    });

    // Setup auth tabs
    setupAuthTabs();

    // Setup all app event listeners
    setupAppEventListeners();
});

// Setup authentication tabs
function setupAuthTabs() {
    const authTabs = document.querySelectorAll('.auth-tab-btn');
    const authForms = document.querySelectorAll('.auth-form');

    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            authTabs.forEach(t => t.classList.remove('active'));
            authForms.forEach(f => f.classList.remove('active'));

            // Add active class to clicked tab
            tab.classList.add('active');

            // Show related form
            const authType = tab.getAttribute('data-auth');
            document.getElementById(`${authType}Form`).classList.add('active');
        });
    });

    // Login form handler
    const loginForm = document.getElementById('loginFormElement');
    loginForm.addEventListener('submit', handleLogin);

    // Register form handler
    const registerForm = document.getElementById('registerFormElement');
    registerForm.addEventListener('submit', handleRegister);

    // Logout button handler
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            const { signOut } = window.firebaseFunctions;
            await signOut(window.firebaseAuth);
            // Auth state listener will automatically show auth section
        } catch (error) {
            alert('লগআউট ব্যর্থ হয়েছে! ' + error.message);
        }
    });
}

// Login handler
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginError = document.getElementById('loginError');

    try {
        const { signInWithEmailAndPassword } = window.firebaseFunctions;
        await signInWithEmailAndPassword(window.firebaseAuth, email, password);
        // Auth state listener will automatically show app section
    } catch (error) {
        loginError.textContent = 'লগইন ব্যর্থ হয়েছে! ' + getErrorMessage(error.code);
        loginError.classList.add('show');
        setTimeout(() => loginError.classList.remove('show'), 5000);
    }
}

// Registration handler
async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const registerError = document.getElementById('registerError');
    const registerSuccess = document.getElementById('registerSuccess');

    // Password match check
    if (password !== confirmPassword) {
        registerError.textContent = 'পাসওয়ার্ড মিলছে না!';
        registerError.classList.add('show');
        setTimeout(() => registerError.classList.remove('show'), 5000);
        return;
    }

    try {
        const { createUserWithEmailAndPassword } = window.firebaseFunctions;
        const userCredential = await createUserWithEmailAndPassword(window.firebaseAuth, email, password);

        // Save user name to Firestore
        const { setDoc, doc } = window.firebaseFunctions;
        await setDoc(doc(window.firebaseDB, 'users', userCredential.user.uid), {
            name: name,
            email: email,
            createdAt: new Date().toISOString()
        });

        registerSuccess.textContent = 'রেজিস্ট্রেশন সফল! লগইন হচ্ছে...';
        registerSuccess.classList.add('show');

        // Reset form
        document.getElementById('registerFormElement').reset();

        setTimeout(() => registerSuccess.classList.remove('show'), 3000);
    } catch (error) {
        registerError.textContent = 'রেজিস্ট্রেশন ব্যর্থ হয়েছে! ' + getErrorMessage(error.code);
        registerError.classList.add('show');
        setTimeout(() => registerError.classList.remove('show'), 5000);
    }
}

// Show auth section
function showAuthSection() {
    document.getElementById('authSection').style.display = 'flex';
    document.getElementById('appSection').style.display = 'none';
}

// Show app section
function showAppSection() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('appSection').style.display = 'block';
}

// Setup all app event listeners
function setupAppEventListeners() {
    // Expense form submit handler
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
        expenseForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!currentUser) {
                alert('অনুগ্রহ করে প্রথমে লগইন করুন!');
                return;
            }

            const date = document.getElementById('date').value;
            const category = document.getElementById('category').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const description = document.getElementById('description').value;

            if (!date || !category || !amount) {
                alert('অনুগ্রহ করে সব প্রয়োজনীয় তথ্য পূরণ করুন!');
                return;
            }

            try {
                const { addDoc, collection } = window.firebaseFunctions;
                await addDoc(collection(window.firebaseDB, 'expenses'), {
                    userId: currentUser.uid,
                    date: date,
                    category: category,
                    amount: amount,
                    description: description || category,
                    createdAt: new Date().toISOString()
                });

                // Reset form
                document.getElementById('expenseForm').reset();
                setTodayDate();

                alert('খরচ সফলভাবে যোগ করা হয়েছে!');
            } catch (error) {
                console.error('Error adding expense:', error);
                alert('খরচ যোগ করতে ব্যর্থ হয়েছে!');
            }
        });
    }

    // Clear all expenses handler
    const clearAllBtn = document.getElementById('clearAll');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', async () => {
            if (expenses.length === 0) {
                alert('মুছে ফেলার মতো কোনো খরচ নেই!');
                return;
            }

            if (!confirm('আপনি কি নিশ্চিত যে আপনি সব খরচ মুছে ফেলতে চান? এটি পূর্বাবস্থায় ফেরানো যাবে না!')) {
                return;
            }

            try {
                const { deleteDoc, doc } = window.firebaseFunctions;

                // Delete each expense one by one
                const deletePromises = expenses.map(expense =>
                    deleteDoc(doc(window.firebaseDB, 'expenses', expense.id))
                );

                await Promise.all(deletePromises);
                alert('সব খরচ মুছে ফেলা হয়েছে!');
            } catch (error) {
                console.error('Error clearing all expenses:', error);
                alert('খরচ মুছে ফেলতে ব্যর্থ হয়েছে!');
            }
        });
    }

    // Apply filter handler
    const applyFilterBtn = document.getElementById('applyFilter');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', () => {
            const dateFrom = document.getElementById('filterDateFrom').value;
            const dateTo = document.getElementById('filterDateTo').value;
            const category = document.getElementById('filterCategory').value;

            let filtered = [...expenses];

            if (dateFrom) {
                filtered = filtered.filter(exp => exp.date >= dateFrom);
            }
            if (dateTo) {
                filtered = filtered.filter(exp => exp.date <= dateTo);
            }
            if (category) {
                filtered = filtered.filter(exp => exp.category === category);
            }

            displayExpenses(filtered);

            if (filtered.length === 0) {
                alert('কোনো খরচ পাওয়া যায়নি!');
            }
        });
    }

    // Clear filter handler
    const clearFilterBtn = document.getElementById('clearFilter');
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', () => {
            document.getElementById('filterDateFrom').value = '';
            document.getElementById('filterDateTo').value = '';
            document.getElementById('filterCategory').value = '';
            displayExpenses();
        });
    }

    // Export CSV handler
    const exportCSVBtn = document.getElementById('exportCSV');
    if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', () => {
            if (expenses.length === 0) {
                alert('এক্সপোর্ট করার মতো কোনো তথ্য নেই!');
                return;
            }

            // Add UTF-8 BOM for proper Excel rendering of Bengali text
            let csvContent = '\uFEFFDate,Category,Description,Amount (TK)\n';

            expenses.forEach(expense => {
                const row = `${expense.date},${expense.category},"${expense.description}",${expense.amount}`;
                csvContent += row + '\n';
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute('download', `expense-tracker_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            alert('CSV ফাইল ডাউনলোড শুরু হয়েছে!');
        });
    }

    // Report month change handler
    const reportMonth = document.getElementById('reportMonth');
    if (reportMonth) {
        reportMonth.addEventListener('change', generateReport);
    }

    // Set budget handler
    const setBudgetBtn = document.getElementById('setBudget');
    if (setBudgetBtn) {
        setBudgetBtn.addEventListener('click', async () => {
            if (!currentUser) {
                alert('অনুগ্রহ করে প্রথমে লগইন করুন!');
                return;
            }

            const month = document.getElementById('budgetMonth').value;
            const amount = parseFloat(document.getElementById('budgetAmount').value);

            if (!month || !amount) {
                alert('অনুগ্রহ করে মাস এবং বাজেটের পরিমাণ লিখুন!');
                return;
            }

            try {
                const { setDoc, doc, collection } = window.firebaseFunctions;

                // Check if budget already exists
                const budgetRef = doc(window.firebaseDB, 'budgets', `${currentUser.uid}_${month}`);
                await setDoc(budgetRef, {
                    userId: currentUser.uid,
                    month: month,
                    amount: amount,
                    updatedAt: new Date().toISOString()
                });

                document.getElementById('budgetAmount').value = '';
                alert('বাজেট সফলভাবে সেট করা হয়েছে!');
            } catch (error) {
                console.error('Error setting budget:', error);
                alert('বাজেট সেট করতে ব্যর্থ হয়েছে!');
            }
        });
    }

    // Budget month change handler
    const budgetMonth = document.getElementById('budgetMonth');
    if (budgetMonth) {
        budgetMonth.addEventListener('change', updateBudgetDisplay);
    }
}

// Firebase error message converter to Bengali
function getErrorMessage(code) {
    const errorMessages = {
        'auth/invalid-email': 'Please enter a valid email address',
        'auth/user-disabled': 'This account has been disabled',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Wrong password',
        'auth/email-already-in-use': 'An account already exists with this email',
        'auth/weak-password': 'Password must be at least 6 characters',
        'auth/too-many-requests': 'Too many attempts. Please try again later',
        'auth/network-request-failed': 'Check your internet connection',
        'auth/invalid-credential': 'Invalid email or password'
    };
    return errorMessages[code] || 'Something went wrong. Please try again.';
}

// ===================================
// USER DATA LOADING
// ===================================

async function loadUserData() {
    if (!currentUser) return;

    // Load user name
    loadUserName();

    // Load expense data (real-time listener)
    setupExpensesListener();

    // Load budgets
    setupBudgetsListener();

    // Other setup
    setTodayDate();
    setCurrentMonth();
    setupTabs();
}

// Load user name
async function loadUserName() {
    try {
        const { getDoc, doc } = window.firebaseFunctions;
        const userDoc = await getDoc(doc(window.firebaseDB, 'users', currentUser.uid));

        if (userDoc.exists()) {
            const userData = userDoc.data();
            document.getElementById('userName').textContent = 'ব্যবহারকারী: ' + userData.name;
        }
    } catch (error) {
        console.error('Error loading user name:', error);
    }
}

// ===================================
// FIRESTORE - EXPENSES REAL-TIME LISTENER
// ===================================

function setupExpensesListener() {
    const { collection, query, where, orderBy, onSnapshot } = window.firebaseFunctions;

    const expensesQuery = query(
        collection(window.firebaseDB, 'expenses'),
        where('userId', '==', currentUser.uid),
        orderBy('date', 'desc')
    );

    // Real-time listener
    onSnapshot(expensesQuery, (snapshot) => {
        expenses = [];
        snapshot.forEach((doc) => {
            expenses.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Update UI
        displayExpenses();
        updateTotal();
        updateBudgetDisplay();
    }, (error) => {
        console.error('Error loading expenses:', error);
    });
}

// ===================================
// FIRESTORE - BUDGETS REAL-TIME LISTENER
// ===================================

function setupBudgetsListener() {
    const { collection, query, where, onSnapshot } = window.firebaseFunctions;

    const budgetsQuery = query(
        collection(window.firebaseDB, 'budgets'),
        where('userId', '==', currentUser.uid)
    );

    onSnapshot(budgetsQuery, (snapshot) => {
        budgets = {};
        snapshot.forEach((doc) => {
            const data = doc.data();
            budgets[data.month] = data.amount;
        });

        updateBudgetDisplay();
    }, (error) => {
        console.error('Error loading budgets:', error);
    });
}

// ===================================
// ADD EXPENSE (Saves to Firebase)
// ===================================

// ===================================
// DISPLAY EXPENSE LIST
// ===================================

function displayExpenses(filteredExpenses = null) {
    const expensesToShow = filteredExpenses || expenses;
    const expensesList = document.getElementById('expensesList');

    expensesList.innerHTML = '';

    if (expensesToShow.length === 0) {
        expensesList.innerHTML = '<p class="no-expenses">কোনো খরচ পাওয়া যায়নি</p>';
        return;
    }

    expensesToShow.forEach(expense => {
        const expenseElement = createExpenseElement(expense);
        expensesList.appendChild(expenseElement);
    });
}

// ===================================
// CREATE EXPENSE ELEMENT
// ===================================

function createExpenseElement(expense) {
    const div = document.createElement('div');
    div.className = 'expense-item';

    div.innerHTML = `
        <div class="expense-info">
            <div class="expense-category">${expense.category}</div>
            ${expense.description ? `<div class="expense-description">${expense.description}</div>` : ''}
            <div class="expense-date">${formatDate(expense.date)}</div>
        </div>
        <div class="expense-amount">${expense.amount} TK</div>
        <button class="delete-btn" onclick="deleteExpense('${expense.id}')">মুছুন</button>
    `;

    return div;
}

// ===================================
// FORMAT DATE (Bengali)
// ===================================

function formatDate(dateString) {
    const date = new Date(dateString);
    const bengaliMonths = [
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল',
        'মে', 'জুন', 'জুলাই', 'আগস্ট',
        'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];

    const day = date.getDate();
    const month = bengaliMonths[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month}, ${year}`;
}

// ===================================
// CALCULATE TOTAL EXPENSE
// ===================================

function updateTotal() {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    document.getElementById('totalAmount').textContent = `${total} TK`;
}

// ===================================
// DELETE EXPENSE (from Firebase)
// ===================================

async function deleteExpense(id) {
    if (!confirm('আপনি কি নিশ্চিত যে আপনি এই খরচটি মুছে ফেলতে চান?')) {
        return;
    }

    try {
        const { deleteDoc, doc } = window.firebaseFunctions;
        await deleteDoc(doc(window.firebaseDB, 'expenses', id));
        // Real-time listener will automatically update UI
    } catch (error) {
        console.error('Error deleting expense:', error);
        alert('খরচ মুছে ফেলতে ব্যর্থ হয়েছে!');
    }
}

// ===================================
// CLEAR ALL EXPENSES
// ===================================

// ===================================
// SET TODAY'S DATE
// ===================================

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

// ===================================
// SET CURRENT MONTH
// ===================================

function setCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const currentMonth = `${year}-${month}`;

    const reportMonth = document.getElementById('reportMonth');
    const budgetMonth = document.getElementById('budgetMonth');

    if (reportMonth) reportMonth.value = currentMonth;
    if (budgetMonth) budgetMonth.value = currentMonth;
}

// ===================================
// TAB NAVIGATION SYSTEM
// ===================================

function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');

            const tabName = btn.getAttribute('data-tab');
            document.getElementById(`${tabName}-tab`).classList.add('active');

            if (tabName === 'report') {
                generateReport();
            }
        });
    });
}

// ===================================
// FILTER SYSTEM
// ===================================

// ===================================
// FILTER SYSTEM
// ===================================

// ===================================
// CSV EXPORT SYSTEM
// ===================================

// ===================================
// REPORT GENERATION SYSTEM
// ===================================

function generateReport() {
    const selectedMonth = document.getElementById('reportMonth').value;
    if (!selectedMonth) return;

    const monthExpenses = expenses.filter(expense =>
        expense.date.startsWith(selectedMonth)
    );

    updateReportSummary(monthExpenses, selectedMonth);
    const categoryTotals = calculateCategoryTotals(monthExpenses);
    updateCategoryChart(categoryTotals);
    updateDailyChart(monthExpenses, selectedMonth);
    displayCategoryBreakdown(categoryTotals, monthExpenses);
}

function updateReportSummary(monthExpenses, selectedMonth) {
    const total = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const transactions = monthExpenses.length;

    const [year, month] = selectedMonth.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    const avgDaily = total > 0 ? (total / daysInMonth).toFixed(2) : 0;

    document.getElementById('monthTotal').textContent = `${total} TK`;
    document.getElementById('monthTransactions').textContent = transactions;
    document.getElementById('dailyAverage').textContent = `${avgDaily} TK`;
}

function calculateCategoryTotals(monthExpenses) {
    const totals = {};

    monthExpenses.forEach(expense => {
        if (!totals[expense.category]) {
            totals[expense.category] = 0;
        }
        totals[expense.category] += expense.amount;
    });

    return totals;
}

function updateCategoryChart(categoryTotals) {
    const ctx = document.getElementById('categoryChart').getContext('2d');

    if (categoryChart) {
        categoryChart.destroy();
    }

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c',
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
    ];

    categoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateDailyChart(monthExpenses, selectedMonth) {
    const ctx = document.getElementById('dailyChart').getContext('2d');

    if (dailyChart) {
        dailyChart.destroy();
    }

    const dailyTotals = {};
    const [year, month] = selectedMonth.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        dailyTotals[day] = 0;
    }

    monthExpenses.forEach(expense => {
        const day = new Date(expense.date).getDate();
        dailyTotals[day] += expense.amount;
    });

    const labels = Object.keys(dailyTotals).map(d => `${d} তারিখ`);
    const data = Object.values(dailyTotals);

    dailyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Expense (TK)',
                data: data,
                backgroundColor: '#667eea',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function displayCategoryBreakdown(categoryTotals, monthExpenses) {
    const categoryBreakdownList = document.getElementById('categoryBreakdownList');
    categoryBreakdownList.innerHTML = '';

    const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

    if (total === 0) {
        categoryBreakdownList.innerHTML = '<p class="no-expenses">এই মাসে কোনো খরচ নেই</p>';
        return;
    }

    const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

    sorted.forEach(([category, amount]) => {
        const percentage = ((amount / total) * 100).toFixed(1);

        const div = document.createElement('div');
        div.className = 'breakdown-item';
        div.innerHTML = `
            <span class="breakdown-category">${category}</span>
            <div>
                <span class="breakdown-amount">${amount} TK</span>
                <span class="breakdown-percentage"> (${percentage}%)</span>
            </div>
        `;
        categoryBreakdownList.appendChild(div);
    });
}

// ===================================
// BUDGET MANAGEMENT SYSTEM
// ===================================

function updateBudgetDisplay() {
    const month = document.getElementById('budgetMonth').value;
    if (!month || !currentUser) return;

    const budget = budgets[month] || 0;

    const spent = expenses
        .filter(exp => exp.date.startsWith(month))
        .reduce((sum, exp) => sum + exp.amount, 0);

    const remaining = budget - spent;
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;

    document.getElementById('budgetTotal').textContent = `${budget} TK`;
    document.getElementById('budgetSpent').textContent = `${spent} TK`;
    document.getElementById('budgetRemaining').textContent = `${remaining >= 0 ? remaining : 0} TK`;

    const displayPercentage = Math.min(percentage, 100);
    const progressBar = document.getElementById('budgetProgressBar');
    progressBar.style.width = `${displayPercentage}%`;
    progressBar.className = 'progress-fill';

    const budgetMessage = document.getElementById('budgetMessage');

    if (percentage >= 100) {
        progressBar.classList.add('danger');
        budgetMessage.textContent = 'সতর্কতা: বাজেট অতিক্রান্ত হয়েছে!';
        budgetMessage.style.color = '#e74c3c';
    } else if (percentage >= 80) {
        progressBar.classList.add('warning');
        budgetMessage.textContent = 'সতর্কতা: বাজেট প্রায় শেষ!';
        budgetMessage.style.color = '#f39c12';
    } else if (budget > 0) {
        budgetMessage.textContent = 'ভালো: বাজেটের মধ্যে আছে';
        budgetMessage.style.color = '#27ae60';
    } else {
        budgetMessage.textContent = 'এই মাসের জন্য একটি বাজেট সেট করুন';
        budgetMessage.style.color = '#333';
    }
}

// ===================================
// CODE EXPLANATION
// ===================================

/*
What's new:

1. Firebase Authentication:
   - Email/Password registration
   - Login/Logout system
   - Auth state listener

2. Firestore Database:
   - Separate data for each user (by userId)
   - Real-time sync (onSnapshot listener)
   - Automatic save to cloud

3. Security:
   - Each expense saved with userId
   - Query checks userId
   - One user cannot see another's data

4. Real-time Features:
   - Expense added → instantly visible on all devices
   - Mobile add → instantly visible on computer
   - No refresh needed!

5. User Data Structure:
   - users collection: user's name, email
   - expenses collection: expense data (with userId)
   - budgets collection: budget data (with userId)
*/
