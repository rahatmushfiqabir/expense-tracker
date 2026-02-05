// ===================================
// খরচ ট্র্যাকার - Firebase Authentication + Firestore
// এখন সব ইউজারের আলাদা ডেটা থাকবে
// ===================================

// গ্লোবাল ভেরিয়েবল
let currentUser = null;
let expenses = [];
let budgets = {};
let categoryChart = null;
let dailyChart = null;

// Firebase functions এবং DB রেডি করা
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
// AUTHENTICATION সিস্টেম
// ===================================

// পেজ লোড হলে Authentication চেক করা
document.addEventListener('DOMContentLoaded', async () => {
    await waitForFirebase();

    const { onAuthStateChanged } = window.firebaseFunctions;

    // Auth state change listener
    onAuthStateChanged(window.firebaseAuth, (user) => {
        if (user) {
            // ইউজার লগইন আছে
            currentUser = user;
            showAppSection();
            loadUserData();
        } else {
            // ইউজার লগইন নেই
            currentUser = null;
            showAuthSection();
        }
    });

    // Auth tabs setup
    setupAuthTabs();
});

// Auth tabs সেটআপ
function setupAuthTabs() {
    const authTabs = document.querySelectorAll('.auth-tab-btn');
    const authForms = document.querySelectorAll('.auth-form');

    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // সব ট্যাব থেকে active ক্লাস সরাও
            authTabs.forEach(t => t.classList.remove('active'));
            authForms.forEach(f => f.classList.remove('active'));

            // ক্লিক করা ট্যাবে active ক্লাস যোগ করো
            tab.classList.add('active');

            // সংশ্লিষ্ট ফর্ম দেখাও
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
}

// লগইন হ্যান্ডলার
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginError = document.getElementById('loginError');

    try {
        const { signInWithEmailAndPassword } = window.firebaseFunctions;
        await signInWithEmailAndPassword(window.firebaseAuth, email, password);
        // Auth state listener স্বয়ংক্রিয়ভাবে অ্যাপ সেকশন দেখাবে
    } catch (error) {
        loginError.textContent = '❌ লগইন ব্যর্থ হয়েছে! ' + getErrorMessage(error.code);
        loginError.classList.add('show');
        setTimeout(() => loginError.classList.remove('show'), 5000);
    }
}

// রেজিস্ট্রেশন হ্যান্ডলার
async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const registerError = document.getElementById('registerError');
    const registerSuccess = document.getElementById('registerSuccess');

    // পাসওয়ার্ড ম্যাচ চেক
    if (password !== confirmPassword) {
        registerError.textContent = '❌ পাসওয়ার্ড মিলছে না!';
        registerError.classList.add('show');
        setTimeout(() => registerError.classList.remove('show'), 5000);
        return;
    }

    try {
        const { createUserWithEmailAndPassword } = window.firebaseFunctions;
        const userCredential = await createUserWithEmailAndPassword(window.firebaseAuth, email, password);

        // ইউজারের নাম Firestore এ সেভ করো
        const { setDoc, doc } = window.firebaseFunctions;
        await setDoc(doc(window.firebaseDB, 'users', userCredential.user.uid), {
            name: name,
            email: email,
            createdAt: new Date().toISOString()
        });

        registerSuccess.textContent = '✅ রেজিস্ট্রেশন সফল! লগইন হচ্ছে...';
        registerSuccess.classList.add('show');

        // ফর্ম রিসেট
        document.getElementById('registerFormElement').reset();

        setTimeout(() => registerSuccess.classList.remove('show'), 3000);
    } catch (error) {
        registerError.textContent = '❌ রেজিস্ট্রেশন ব্যর্থ! ' + getErrorMessage(error.code);
        registerError.classList.add('show');
        setTimeout(() => registerError.classList.remove('show'), 5000);
    }
}

// Auth section দেখানো
function showAuthSection() {
    document.getElementById('authSection').style.display = 'flex';
    document.getElementById('appSection').style.display = 'none';
}

// App section দেখানো
function showAppSection() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('appSection').style.display = 'block';
}

// লগআউট হ্যান্ডলার
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        const { signOut } = window.firebaseFunctions;
        await signOut(window.firebaseAuth);
        // Auth state listener স্বয়ংক্রিয়ভাবে auth section দেখাবে
    } catch (error) {
        alert('❌ লগআউট ব্যর্থ! ' + error.message);
    }
});

// Firebase error মেসেজ বাংলায় কনভার্ট
function getErrorMessage(code) {
    const errorMessages = {
        'auth/invalid-email': 'সঠিক ইমেইল ঠিকানা দিন',
        'auth/user-disabled': 'এই অ্যাকাউন্টটি বন্ধ করা হয়েছে',
        'auth/user-not-found': 'এই ইমেইলে কোনো অ্যাকাউন্ট নেই',
        'auth/wrong-password': 'ভুল পাসওয়ার্ড',
        'auth/email-already-in-use': 'এই ইমেইলে আগেই একটি অ্যাকাউন্ট আছে',
        'auth/weak-password': 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে',
        'auth/too-many-requests': 'অনেক চেষ্টা করেছেন। কিছুক্ষণ পর আবার চেষ্টা করুন',
        'auth/network-request-failed': 'ইন্টারনেট সংযোগ পরীক্ষা করুন',
        'auth/invalid-credential': 'ভুল ইমেইল বা পাসওয়ার্ড'
    };
    return errorMessages[code] || 'কিছু ভুল হয়েছে। আবার চেষ্টা করুন।';
}

// ===================================
// USER DATA লোড করা
// ===================================

async function loadUserData() {
    if (!currentUser) return;

    // ইউজারের নাম লোড করা
    loadUserName();

    // খরচের ডেটা লোড করা (real-time listener)
    setupExpensesListener();

    // বাজেট লোড করা
    setupBudgetsListener();

    // অন্যান্য সেটআপ
    setTodayDate();
    setCurrentMonth();
    setupTabs();
}

// ইউজারের নাম লোড করা
async function loadUserName() {
    try {
        const { getDoc, doc } = window.firebaseFunctions;
        const userDoc = await getDoc(doc(window.firebaseDB, 'users', currentUser.uid));

        if (userDoc.exists()) {
            const userData = userDoc.data();
            document.getElementById('userName').textContent = '👤 ' + userData.name;
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

        // UI আপডেট করা
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
// খরচ যোগ করা (Firebase এ সেভ হবে)
// ===================================

document.getElementById('expenseForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser) {
        alert('❌ দয়া করে আগে লগইন করুন!');
        return;
    }

    const date = document.getElementById('date').value;
    const category = document.getElementById('category').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const description = document.getElementById('description').value;

    if (!date || !category || !amount) {
        alert('দয়া করে সব তথ্য পূরণ করুন!');
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

        // ফর্ম রিসেট
        document.getElementById('expenseForm').reset();
        setTodayDate();

        alert('✅ খরচ সফলভাবে যোগ হয়েছে!');
    } catch (error) {
        console.error('Error adding expense:', error);
        alert('❌ খরচ যোগ করতে সমস্যা হয়েছে!');
    }
});

// ===================================
// খরচের লিস্ট দেখানো
// ===================================

function displayExpenses(filteredExpenses = null) {
    const expensesToShow = filteredExpenses || expenses;
    const expensesList = document.getElementById('expensesList');

    expensesList.innerHTML = '';

    if (expensesToShow.length === 0) {
        expensesList.innerHTML = '<p class="no-expenses">এখনো কোনো খরচ যোগ করা হয়নি</p>';
        return;
    }

    expensesToShow.forEach(expense => {
        const expenseElement = createExpenseElement(expense);
        expensesList.appendChild(expenseElement);
    });
}

// ===================================
// খরচের এলিমেন্ট তৈরি করা
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
        <div class="expense-amount">${expense.amount} টাকা</div>
        <button class="delete-btn" onclick="deleteExpense('${expense.id}')">🗑️ মুছুন</button>
    `;

    return div;
}

// ===================================
// তারিখ ফরম্যাট করা (বাংলায়)
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
// মোট খরচ ক্যালকুলেট করা
// ===================================

function updateTotal() {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    document.getElementById('totalAmount').textContent = `${total} টাকা`;
}

// ===================================
// খরচ ডিলিট করা (Firebase থেকে)
// ===================================

async function deleteExpense(id) {
    if (!confirm('আপনি কি নিশ্চিত যে এই খরচটি মুছে ফেলতে চান?')) {
        return;
    }

    try {
        const { deleteDoc, doc } = window.firebaseFunctions;
        await deleteDoc(doc(window.firebaseDB, 'expenses', id));
        // Real-time listener স্বয়ংক্রিয়ভাবে UI আপডেট করবে
    } catch (error) {
        console.error('Error deleting expense:', error);
        alert('❌ খরচ মুছে ফেলতে সমস্যা হয়েছে!');
    }
}

// ===================================
// সব খরচ মুছে ফেলা
// ===================================

document.getElementById('clearAll').addEventListener('click', async () => {
    if (expenses.length === 0) {
        alert('মুছে ফেলার মতো কোনো খরচ নেই!');
        return;
    }

    if (!confirm('আপনি কি সত্যিই সব খরচ মুছে ফেলতে চান? এটা আন্ডো করা যাবে না!')) {
        return;
    }

    try {
        const { deleteDoc, doc } = window.firebaseFunctions;

        // সব খরচ একটি একটি করে মুছে ফেলা
        const deletePromises = expenses.map(expense =>
            deleteDoc(doc(window.firebaseDB, 'expenses', expense.id))
        );

        await Promise.all(deletePromises);
        alert('✅ সব খরচ মুছে ফেলা হয়েছে!');
    } catch (error) {
        console.error('Error clearing all expenses:', error);
        alert('❌ সব খরচ মুছে ফেলতে সমস্যা হয়েছে!');
    }
});

// ===================================
// আজকের তারিখ সেট করা
// ===================================

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

// ===================================
// বর্তমান মাস সেট করা
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
// ট্যাব নেভিগেশন সিস্টেম
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
// ফিল্টার সিস্টেম
// ===================================

document.getElementById('applyFilter').addEventListener('click', () => {
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

document.getElementById('clearFilter').addEventListener('click', () => {
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    document.getElementById('filterCategory').value = '';
    displayExpenses();
});

// ===================================
// CSV এক্সপোর্ট সিস্টেম
// ===================================

document.getElementById('exportCSV').addEventListener('click', () => {
    if (expenses.length === 0) {
        alert('এক্সপোর্ট করার মতো কোনো ডেটা নেই!');
        return;
    }

    let csvContent = 'তারিখ,ক্যাটাগরি,বিবরণ,খরচ (টাকা)\n';

    expenses.forEach(expense => {
        const row = `${expense.date},${expense.category},"${expense.description}",${expense.amount}`;
        csvContent += row + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `খরচের_হিসাব_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert('✅ CSV ফাইল ডাউনলোড শুরু হয়েছে!');
});

// ===================================
// রিপোর্ট জেনারেশন সিস্টেম
// ===================================

document.getElementById('reportMonth').addEventListener('change', generateReport);

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

    document.getElementById('monthTotal').textContent = `${total} টাকা`;
    document.getElementById('monthTransactions').textContent = transactions;
    document.getElementById('dailyAverage').textContent = `${avgDaily} টাকা`;
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
                label: 'খরচ (টাকা)',
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
                <span class="breakdown-amount">${amount} টাকা</span>
                <span class="breakdown-percentage"> (${percentage}%)</span>
            </div>
        `;
        categoryBreakdownList.appendChild(div);
    });
}

// ===================================
// বাজেট ম্যানেজমেন্ট সিস্টেম (Firebase এ সেভ হবে)
// ===================================

document.getElementById('setBudget').addEventListener('click', async () => {
    if (!currentUser) {
        alert('❌ দয়া করে আগে লগইন করুন!');
        return;
    }

    const month = document.getElementById('budgetMonth').value;
    const amount = parseFloat(document.getElementById('budgetAmount').value);

    if (!month || !amount) {
        alert('দয়া করে মাস এবং বাজেটের পরিমাণ পূরণ করুন!');
        return;
    }

    try {
        const { setDoc, doc, collection } = window.firebaseFunctions;

        // আগে থেকে বাজেট আছে কিনা চেক করা
        const budgetRef = doc(window.firebaseDB, 'budgets', `${currentUser.uid}_${month}`);
        await setDoc(budgetRef, {
            userId: currentUser.uid,
            month: month,
            amount: amount,
            updatedAt: new Date().toISOString()
        });

        document.getElementById('budgetAmount').value = '';
        alert('✅ বাজেট সফলভাবে সেট করা হয়েছে!');
    } catch (error) {
        console.error('Error setting budget:', error);
        alert('❌ বাজেট সেট করতে সমস্যা হয়েছে!');
    }
});

document.getElementById('budgetMonth').addEventListener('change', updateBudgetDisplay);

function updateBudgetDisplay() {
    const month = document.getElementById('budgetMonth').value;
    if (!month || !currentUser) return;

    const budget = budgets[month] || 0;

    const spent = expenses
        .filter(exp => exp.date.startsWith(month))
        .reduce((sum, exp) => sum + exp.amount, 0);

    const remaining = budget - spent;
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;

    document.getElementById('budgetTotal').textContent = `${budget} টাকা`;
    document.getElementById('budgetSpent').textContent = `${spent} টাকা`;
    document.getElementById('budgetRemaining').textContent = `${remaining >= 0 ? remaining : 0} টাকা`;

    const displayPercentage = Math.min(percentage, 100);
    const progressBar = document.getElementById('budgetProgressBar');
    progressBar.style.width = `${displayPercentage}%`;
    progressBar.className = 'progress-fill';

    const budgetMessage = document.getElementById('budgetMessage');

    if (percentage >= 100) {
        progressBar.classList.add('danger');
        budgetMessage.textContent = '⚠️ বাজেট অতিক্রম করেছে!';
        budgetMessage.style.color = '#e74c3c';
    } else if (percentage >= 80) {
        progressBar.classList.add('warning');
        budgetMessage.textContent = '⚡ সাবধান! বাজেট প্রায় শেষ।';
        budgetMessage.style.color = '#f39c12';
    } else if (budget > 0) {
        budgetMessage.textContent = '✅ বাজেটের মধ্যে আছেন।';
        budgetMessage.style.color = '#27ae60';
    } else {
        budgetMessage.textContent = '📝 এই মাসের জন্য বাজেট সেট করুন।';
        budgetMessage.style.color = '#333';
    }
}

// ===================================
// কোড এক্সপ্লেইনেশন (বাংলায়)
// ===================================

/*
নতুন কী কী যোগ হলো:

১. Firebase Authentication:
   - ইমেইল/পাসওয়ার্ড দিয়ে রেজিস্ট্রেশন
   - লগইন/লগআউট সিস্টেম
   - Auth state listener

২. Firestore Database:
   - প্রতিটি ইউজারের আলাদা ডেটা (userId দিয়ে আলাদা)
   - Real-time sync (onSnapshot listener)
   - Cloud এ অটোমেটিক সেভ

৩. Security:
   - প্রতিটি খরচ userId সহ সেভ হয়
   - Query করার সময় userId চেক হয়
   - এক ইউজার অন্য ইউজারের ডেটা দেখতে পারে না

৪. Real-time Features:
   - খরচ যোগ করলে সাথে সাথে সব ডিভাইসে দেখা যাবে
   - মোবাইল থেকে খরচ যোগ করলে কম্পিউটারে সাথে সাথে আসবে
   - কোনো refresh লাগবে না!

৫. User Data Structure:
   - users collection: ইউজারের নাম, ইমেইল
   - expenses collection: খরচের ডেটা (userId সহ)
   - budgets collection: বাজেট ডেটা (userId সহ)
*/
