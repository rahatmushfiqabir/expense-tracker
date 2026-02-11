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

// ===================================
// MODAL POPUP FUNCTIONS
// ===================================

/**
 * Show success modal with message
 * @param {string} title - Modal title
 * @param {string} message - Success message
 * @param {number} autoClose - Auto close after ms (0 = no auto close)
 */
function showSuccessModal(title, message, autoClose = 0) {
    const modal = document.getElementById('successModal');
    const titleEl = document.getElementById('successModalTitle');
    const messageEl = document.getElementById('successModalMessage');

    titleEl.textContent = title;
    messageEl.textContent = message;
    modal.classList.add('show');

    if (autoClose > 0) {
        setTimeout(() => {
            closeModal('successModal');
        }, autoClose);
    }
}

/**
 * Show confirmation modal
 * @param {string} title - Modal title
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback when confirmed
 * @param {string} confirmText - Confirm button text
 */
function showConfirmModal(title, message, onConfirm, confirmText = 'হ্যাঁ, মুছুন') {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmModalTitle');
    const messageEl = document.getElementById('confirmModalMessage');
    const actionBtn = document.getElementById('confirmModalAction');

    titleEl.textContent = title;
    messageEl.textContent = message;
    actionBtn.textContent = confirmText;

    // Remove old event listener and add new one
    const newActionBtn = actionBtn.cloneNode(true);
    actionBtn.parentNode.replaceChild(newActionBtn, actionBtn);

    newActionBtn.addEventListener('click', () => {
        onConfirm();
        closeModal('confirmModal');
    });

    modal.classList.add('show');
}

/**
 * Show error modal
 * @param {string} title - Modal title
 * @param {string} message - Error message
 */
function showErrorModal(title, message) {
    const modal = document.getElementById('errorModal');
    const titleEl = document.getElementById('errorModalTitle');
    const messageEl = document.getElementById('errorModalMessage');

    titleEl.textContent = title;
    messageEl.textContent = message;
    modal.classList.add('show');
}

/**
 * Close modal by ID
 * @param {string} modalId - Modal element ID
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
}

/**
 * Open modal by ID
 * @param {string} modalId - Modal element ID
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
}

// Close modal when clicking overlay
function setupModalCloseHandlers() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
}

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
    console.log('✅ DOMContentLoaded fired');
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
    console.log('⚙️ Setting up auth tabs...');
    setupAuthTabs();

    // Setup modal close handlers
    setupModalCloseHandlers();

    // Setup all app event listeners
    console.log('⚙️ Setting up app event listeners...');
    setupAppEventListeners();
    console.log('✅ All event listeners setup complete');
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
            showErrorModal('ত্রুটি!', 'লগআউট ব্যর্থ হয়েছে! ' + error.message);
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

// Password validation function
function validatePassword(password) {
    // Check minimum length (at least 6 characters for Firebase compatibility)
    if (password.length < 6) {
        return { valid: false, message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' };
    }

    // Check for at least one uppercase letter (optional, good practice)
    // if (!/[A-Z]/.test(password)) {
    //     return { valid: false, message: 'পাসওয়ার্ডে কমপক্ষে একটি বড় হাতের অক্ষর থাকতে হবে (A-Z)' };
    // }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'পাসওয়ার্ডে কমপক্ষে একটি ছোট হাতের অক্ষর থাকতে হবে (a-z)' };
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
        return { valid: false, message: 'পাসওয়ার্ডে কমপক্ষে একটি সংখ্যা থাকতে হবে (0-9)' };
    }

    // Password is valid
    return { valid: true };
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

    // Password strength validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        registerError.textContent = passwordValidation.message;
        registerError.classList.add('show');
        setTimeout(() => registerError.classList.remove('show'), 5000);
        return;
    }

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
    console.log('🔧 setupAppEventListeners() called');

    // Expense form submit handler
    const expenseForm = document.getElementById('expenseForm');
    console.log('🔍 expenseForm element:', expenseForm);
    if (expenseForm) {
        console.log('✅ Attaching expenseForm submit listener');
        expenseForm.addEventListener('submit', async (e) => {
            console.log('📝 Expense form submitted!');
            e.preventDefault();

            if (!currentUser) {
                console.warn('⚠️ No user logged in');
                showErrorModal('ত্রুটি!', 'অনুগ্রহ করে প্রথমে লগইন করুন!');
                return;
            }

            const date = document.getElementById('date').value;
            const category = document.getElementById('category').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const description = document.getElementById('description').value;

            console.log('📊 Expense data:', { date, category, amount, description, userId: currentUser.uid });

            if (!date || !category || !amount) {
                console.warn('⚠️ Missing required fields');
                showErrorModal('ত্রুটি!', 'অনুগ্রহ করে সব প্রয়োজনীয় তথ্য পূরণ করুন!');
                return;
            }

            try {
                console.log('💾 Saving to Firebase...');
                const { addDoc, collection } = window.firebaseFunctions;
                await addDoc(collection(window.firebaseDB, 'expenses'), {
                    userId: currentUser.uid,
                    date: date,
                    category: category,
                    amount: amount,
                    description: description || category,
                    createdAt: new Date().toISOString()
                });
                console.log('✅ Expense saved successfully!');

                // Reset form
                document.getElementById('expenseForm').reset();
                setTodayDate();

                showSuccessModal('সফল!', 'খরচ সফলভাবে যোগ করা হয়েছে!', 3000);
            } catch (error) {
                console.error('❌ Error adding expense:', error);
                showErrorModal('ত্রুটি!', 'খরচ যোগ করতে ব্যর্থ হয়েছে! অনুগ্রহ করে আবার চেষ্টা করুন।');
            }
        });
        console.log('✅ Expense form listener attached');
    } else {
        console.error('❌ expenseForm element NOT FOUND!');
    }

    // Clear all expenses handler
    const clearAllBtn = document.getElementById('clearAll');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', async () => {
            if (expenses.length === 0) {
                showErrorModal('তথ্য নেই', 'মুছে ফেলার মতো কোনো খরচ নেই!');
                return;
            }

            showConfirmModal(
                'নিশ্চিত করুন',
                'আপনি কি নিশ্চিত যে আপনি সব খরচ মুছে ফেলতে চান? এটি পূর্বাবস্থায় ফেরানো যাবে না!',
                async () => {
                    try {
                        const { deleteDoc, doc } = window.firebaseFunctions;

                        // Delete each expense one by one
                        const deletePromises = expenses.map(expense =>
                            deleteDoc(doc(window.firebaseDB, 'expenses', expense.id))
                        );

                        await Promise.all(deletePromises);
                        showSuccessModal('সফল!', 'সব খরচ মুছে ফেলা হয়েছে!', 3000);
                    } catch (error) {
                        console.error('Error clearing all expenses:', error);
                        showErrorModal('ত্রুটি!', 'খরচ মুছে ফেলতে ব্যর্থ হয়েছে!');
                    }
                },
                'হ্যাঁ, মুছুন'
            );
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
                showErrorModal('কোনো তথ্য নেই', 'কোনো খরচ পাওয়া যায়নি!');
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
                showErrorModal('কোনো তথ্য নেই', 'এক্সপোর্ট করার মতো কোনো তথ্য নেই!');
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

            showSuccessModal('সফল!', 'CSV ফাইল ডাউনলোড শুরু হয়েছে!', 2500);
        });
    }

    // PDF Export functionality
    window.exportToPDF = function() {
        if (expenses.length === 0) {
            showErrorModal('কোনো তথ্য নেই', 'এক্সপোর্ট করার মতো কোনো খরচ নেই!');
            return;
        }

        try {
            // Show loading indicator
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'pdf-loading';
            loadingDiv.innerHTML = '<div class="loading-spinner"></div><p>PDF তৈরি হচ্ছে...</p>';
            document.body.appendChild(loadingDiv);

            // Initialize jsPDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Get current user info
            const userName = currentUser?.displayName || currentUser?.email || 'User';
            const today = new Date();
            const exportDate = formatPDFDate(today.toISOString().split('T')[0]);

            // Calculate total
            const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

            // Set PDF metadata
            doc.setProperties({
                title: 'খরচের হিসাব',
                subject: 'Personal Expense Tracker',
                author: 'Expense Tracker App',
                creator: 'Expense Tracker App'
            });

            // Add Bengali font support note (using default fonts for compatibility)
            doc.setFont('helvetica');

            // ==================== HEADER SECTION ====================
            // Title
            doc.setFontSize(20);
            doc.setTextColor(102, 126, 234); // Purple color
            doc.text('Personal Expense Tracker', 105, 20, { align: 'center' });

            doc.setFontSize(14);
            doc.setTextColor(50, 50, 50);
            doc.text('My Expense Report', 105, 28, { align: 'center' });

            // Separator line
            doc.setDrawColor(200, 200, 200);
            doc.line(20, 32, 190, 32);

            // ==================== INFO SECTION ====================
            doc.setFontSize(11);
            doc.setTextColor(80, 80, 80);

            const infoY = 42;
            doc.text(`User: ${userName}`, 20, infoY);
            doc.text(`Date: ${exportDate}`, 20, infoY + 7);

            // Total with highlight
            doc.setFontSize(12);
            doc.setTextColor(102, 126, 234);
            doc.text(`Total Expenses: ${formatCurrency(total)}`, 20, infoY + 16);

            // Second separator
            doc.setDrawColor(220, 220, 220);
            doc.line(20, infoY + 22, 190, infoY + 22);

            // ==================== EXPENSE TABLE ====================
            // Category mapping for PDF (Bengali to English)
            const categoryMap = {
                'খাবার': 'Food',
                'পরিবহন': 'Transport',
                'শপিং': 'Shopping',
                'বিল': 'Bills',
                'চিকিৎসা': 'Medical',
                'বিনোদন': 'Entertainment',
                'অন্যান্য': 'Others'
            };

            // Helper function to format date for PDF
            function formatPDFDate(dateString) {
                if (!dateString) return '-';
                const date = new Date(dateString);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
            }

            // Prepare table data with proper formatting
            const tableBody = expenses.map(expense => [
                formatPDFDate(expense.date),
                categoryMap[expense.category] || expense.category,
                expense.description || '-',
                formatCurrency(expense.amount)
            ]);

            // Generate table using autoTable
            doc.autoTable({
                startY: infoY + 28,
                head: [['Date', 'Category', 'Description', 'Amount']],
                body: tableBody,
                theme: 'grid',
                styles: {
                    fontSize: 10,
                    cellPadding: 5,
                    font: 'helvetica'
                },
                headStyles: {
                    fillColor: [102, 126, 234],
                    textColor: 255,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                columnStyles: {
                    0: { cellWidth: 30 }, // Date
                    1: { cellWidth: 35 }, // Category
                    2: { cellWidth: 85 }, // Description
                    3: { cellWidth: 25, halign: 'right' } // Amount
                },
                alternateRowStyles: {
                    fillColor: [245, 247, 250]
                },
                margin: { top: infoY + 28, left: 20, right: 20 },
                didDrawPage: function(data) {
                    // Add page number
                    doc.setFontSize(9);
                    doc.setTextColor(150, 150, 150);
                    doc.text(
                        `Page ${doc.internal.getNumberOfPages()}`,
                        105,
                        doc.internal.pageSize.height - 10,
                        { align: 'center' }
                    );
                }
            });

            // ==================== FOOTER ====================
            const finalY = doc.lastAutoTable.finalY || infoY + 28;
            if (finalY < 250) {
                doc.setFontSize(9);
                doc.setTextColor(150, 150, 150);
                doc.text(
                    `Generated by Personal Expense Tracker on ${new Date().toLocaleString()}`,
                    105,
                    280,
                    { align: 'center' }
                );
            }

            // Save the PDF
            const fileName = `expense-report_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            // Remove loading indicator
            document.body.removeChild(loadingDiv);

            showSuccessModal('সফল!', 'PDF ফাইল ডাউনলোড শুরু হয়েছে!', 2500);

        } catch (error) {
            console.error('PDF Export Error:', error);
            // Remove loading indicator if exists
            const loadingDiv = document.querySelector('.pdf-loading');
            if (loadingDiv) document.body.removeChild(loadingDiv);

            showErrorModal('ত্রুটি!', 'PDF তৈরি করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
        }
    };

    // Helper function for currency formatting in PDF
    function formatCurrency(amount) {
        const num = parseFloat(amount);
        if (isNaN(num)) return '0 TK';
        return num.toFixed(2) + ' TK';
    }

    // Report month change handler
    const reportMonth = document.getElementById('reportMonth');
    if (reportMonth) {
        reportMonth.addEventListener('change', generateReport);
    }

    // Set budget handler
    const setBudgetBtn = document.getElementById('setBudget');
    console.log('🔍 setBudget button:', setBudgetBtn);
    if (setBudgetBtn) {
        console.log('✅ Attaching setBudget click listener');
        setBudgetBtn.addEventListener('click', async () => {
            console.log('📝 Set budget button clicked!');
            if (!currentUser) {
                console.warn('⚠️ No user logged in');
                showErrorModal('ত্রুটি!', 'অনুগ্রহ করে প্রথমে লগইন করুন!');
                return;
            }

            const month = document.getElementById('budgetMonth').value;
            const amount = parseFloat(document.getElementById('budgetAmount').value);

            console.log('📊 Budget data:', { month, amount, userId: currentUser.uid });

            if (!month || !amount) {
                console.warn('⚠️ Missing required fields');
                showErrorModal('ত্রুটি!', 'অনুগ্রহ করে মাস এবং বাজেটের পরিমাণ লিখুন!');
                return;
            }

            try {
                console.log('💾 Saving budget to Firebase...');
                const { setDoc, doc, collection } = window.firebaseFunctions;

                // Check if budget already exists
                const budgetRef = doc(window.firebaseDB, 'budgets', `${currentUser.uid}_${month}`);
                await setDoc(budgetRef, {
                    userId: currentUser.uid,
                    month: month,
                    amount: amount,
                    updatedAt: new Date().toISOString()
                });
                console.log('✅ Budget saved successfully!');

                document.getElementById('budgetAmount').value = '';
                showSuccessModal('সফল!', 'বাজেট সফলভাবে সেট করা হয়েছে!', 3000);
            } catch (error) {
                console.error('❌ Error setting budget:', error);
                showErrorModal('ত্রুটি!', 'বাজেট সেট করতে ব্যর্থ হয়েছে! অনুগ্রহ করে আবার চেষ্টা করুন।');
            }
        });
        console.log('✅ Set budget listener attached');
    } else {
        console.error('❌ setBudget button NOT FOUND!');
    }

    // Budget month change handler
    const budgetMonth = document.getElementById('budgetMonth');
    if (budgetMonth) {
        budgetMonth.addEventListener('change', updateBudgetDisplay);
    }

    // Delete monthly budget handler
    const deleteMonthlyBudgetBtn = document.getElementById('deleteMonthlyBudget');
    if (deleteMonthlyBudgetBtn) {
        deleteMonthlyBudgetBtn.addEventListener('click', async () => {
            const month = document.getElementById('budgetMonth').value;

            if (!month) {
                showErrorModal('ত্রুটি!', 'অনুগ্রহ করে প্রথমে মাস নির্বাচন করুন!');
                return;
            }

            // Check if budget exists for this month
            const budget = budgets[month];
            if (!budget) {
                showErrorModal('তথ্য নেই', 'এই মাসের জন্য কোনো বাজেট সেট করা নেই!');
                return;
            }

            // Show confirmation modal
            showConfirmModal(
                'নিশ্চিত করুন',
                'আপনি কি নিশ্চিত যে আপনি এই মাসের বাজেট মুছে ফেলতে চান? এটি পূর্বাবস্থায় ফেরানো যাবে না!',
                async () => {
                    try {
                        const { deleteDoc, doc } = window.firebaseFunctions;

                        const budgetRef = doc(
                            window.firebaseDB,
                            'budgets',
                            `${currentUser.uid}_${month}`
                        );

                        await deleteDoc(budgetRef);

                        showSuccessModal('সফল!', 'বাজেট মুছে ফেলা হয়েছে!', 2500);

                        // Clear the amount field
                        document.getElementById('budgetAmount').value = '';

                        // Update budget display
                        updateBudgetDisplay();
                    } catch (error) {
                        console.error('Error deleting budget:', error);
                        showErrorModal('ত্রুটি!', 'বাজেট মুছে ফেলতে ব্যর্থ হয়েছে!');
                    }
                },
                'হ্যাঁ, মুছুন'
            );
        });
    }

    // ===================================
    // CATEGORY BUDGET FUNCTIONALITY
    // ===================================

    // Budget Type Toggle Handler
    const budgetTypeBtns = document.querySelectorAll('.budget-type-btn');
    budgetTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all buttons
            budgetTypeBtns.forEach(b => b.classList.remove('active'));
            // Add active to clicked button
            btn.classList.add('active');

            // Hide all budget content
            document.querySelectorAll('.budget-content').forEach(content => {
                content.classList.remove('active');
            });

            // Show selected budget content
            const type = btn.getAttribute('data-type');
            if (type === 'monthly') {
                document.getElementById('monthlyBudgetSection').classList.add('active');
            } else {
                document.getElementById('categoryBudgetSection').classList.add('active');
                // Load category budgets when switching to category tab
                loadCategoryBudgets();
            }
        });
    });

    // Set Category Budget Handler
    const setCategoryBudgetBtn = document.getElementById('setCategoryBudget');
    console.log('🔍 setCategoryBudget button:', setCategoryBudgetBtn);
    if (setCategoryBudgetBtn) {
        console.log('✅ Attaching setCategoryBudget click listener');
        setCategoryBudgetBtn.addEventListener('click', async () => {
            console.log('📝 Set category budget button clicked!');

            if (!currentUser) {
                console.warn('⚠️ No user logged in');
                showErrorModal('ত্রুটি!', 'অনুগ্রহ করে প্রথমে লগইন করুন!');
                return;
            }

            const category = document.getElementById('categorySelect').value;
            const month = document.getElementById('categoryBudgetMonth').value;
            const amount = parseFloat(document.getElementById('categoryBudgetAmount').value);

            console.log('📊 Category budget data:', { category, month, amount, userId: currentUser.uid });

            if (!category || !month || !amount) {
                console.warn('⚠️ Missing required fields');
                showErrorModal('ত্রুটি!', 'অনুগ্রহ করে সব তথ্য পূরণ করুন!');
                return;
            }

            try {
                console.log('💾 Saving category budget to Firebase...');
                const { setDoc, doc } = window.firebaseFunctions;

                // Create document ID: userId_category_month
                const budgetRef = doc(
                    window.firebaseDB,
                    'categoryBudgets',
                    `${currentUser.uid}_${category}_${month}`
                );

                await setDoc(budgetRef, {
                    userId: currentUser.uid,
                    category: category,
                    month: month,
                    amount: amount,
                    updatedAt: new Date().toISOString()
                });
                console.log('✅ Category budget saved successfully!');

                // Clear form
                document.getElementById('categorySelect').value = '';
                document.getElementById('categoryBudgetMonth').value = '';
                document.getElementById('categoryBudgetAmount').value = '';

                showSuccessModal('সফল!', 'ক্যাটাগরি বাজেট সফলভাবে সেট করা হয়েছে!', 3000);

                // Reload category budgets
                loadCategoryBudgets();
            } catch (error) {
                console.error('❌ Error setting category budget:', error);
                showErrorModal('ত্রুটি!', 'বাজেট সেট করতে ব্যর্থ হয়েছে!');
            }
        });
        console.log('✅ Set category budget listener attached');
    } else {
        console.error('❌ setCategoryBudget button NOT FOUND!');
    }
}

// Load and display category budgets
async function loadCategoryBudgets() {
    if (!currentUser) return;

    try {
        const { collection, query, where, getDocs } = window.firebaseFunctions;

        const categoryBudgetsRef = collection(window.firebaseDB, 'categoryBudgets');
        const q = query(categoryBudgetsRef, where('userId', '==', currentUser.uid));
        const snapshot = await getDocs(q);

        const container = document.getElementById('categoryBudgetsContainer');

        if (snapshot.empty) {
            container.innerHTML = '<p class="no-budget-message">কোনো ক্যাটাগরি বাজেট সেট করা হয়নি</p>';
            return;
        }

        let html = '';
        snapshot.forEach(docSnapshot => {
            const budget = docSnapshot.data();
            const spent = calculateCategoryExpenses(budget.category, budget.month);
            const remaining = budget.amount - spent;
            const percentage = Math.min((spent / budget.amount) * 100, 100);

            let progressClass = '';
            if (percentage >= 90) {
                progressClass = 'danger';
            } else if (percentage >= 70) {
                progressClass = 'warning';
            }

            // Format month for display
            const monthDate = new Date(budget.month + '-01');
            const monthName = monthDate.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long' });

            html += `
                <div class="category-budget-card">
                    <div class="category-budget-header">
                        <div>
                            <div class="category-budget-title">${budget.category}</div>
                            <div class="category-budget-month">${monthName}</div>
                        </div>
                        <button class="delete-category-budget" onclick="deleteCategoryBudget('${budget.category}', '${budget.month}')">
                            মুছুন
                        </button>
                    </div>
                    <div class="category-budget-info">
                        <span>বাজেট: <strong>${formatBDCurrency(budget.amount)}</strong></span>
                        <span>খরচ: <strong>${formatBDCurrency(spent)}</strong></span>
                        <span>বাকি: <strong>${formatBDCurrency(remaining)}</strong></span>
                    </div>
                    <div class="category-progress-bar">
                        <div class="category-progress-fill ${progressClass}" style="width: ${percentage}%">
                            <span class="category-progress-percent">${percentage.toFixed(0)}%</span>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading category budgets:', error);
    }
}

// Calculate expenses for a specific category and month
function calculateCategoryExpenses(category, month) {
    return expenses
        .filter(exp => exp.category === category && exp.date.startsWith(month))
        .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
}

// Delete category budget
window.deleteCategoryBudget = async function(category, month) {
    if (!currentUser) return;

    // Show confirmation modal
    showConfirmModal(
        'নিশ্চিত করুন',
        `আপনি কি নিশ্চিত যে আপনি "${category}" ক্যাটাগরির বাজেট মুছে ফেলতে চান? এটি পূর্বাবস্থায় ফেরানো যাবে না!`,
        async () => {
            try {
                const { doc, deleteDoc } = window.firebaseFunctions;

                const budgetRef = doc(
                    window.firebaseDB,
                    'categoryBudgets',
                    `${currentUser.uid}_${category}_${month}`
                );

                await deleteDoc(budgetRef);

                showSuccessModal('সফল!', 'ক্যাটাগরি বাজেট মুছে ফেলা হয়েছে!', 2000);

                // Reload category budgets
                loadCategoryBudgets();
            } catch (error) {
                console.error('Error deleting category budget:', error);
                showErrorModal('ত্রুটি!', 'বাজেট মুছে ফেলতে ব্যর্থ হয়েছে!');
            }
        },
        'হ্যাঁ, মুছুন'
    );
};

// Format currency in Bengali
function formatBDCurrency(amount) {
    const num = parseFloat(amount);
    if (isNaN(num)) return '০ টাকা';

    // Convert to Bengali numerals
    const bengaliNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const amountStr = num.toFixed(0);

    let bengaliStr = '';
    for (let digit of amountStr) {
        if (digit === '.') {
            bengaliStr += '.';
        } else {
            bengaliStr += bengaliNums[parseInt(digit)] || digit;
        }
    }

    return bengaliStr + ' টাকা';
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
        <div class="expense-actions">
            <button class="edit-btn" onclick="openEditModal('${expense.id}')" title="সম্পাদনা করুন">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            </button>
            <button class="delete-btn" onclick="deleteExpense('${expense.id}')">মুছুন</button>
        </div>
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
    showConfirmModal(
        'নিশ্চিত করুন',
        'আপনি কি নিশ্চিত যে আপনি এই খরচটি মুছে ফেলতে চান?',
        async () => {
            try {
                const { deleteDoc, doc } = window.firebaseFunctions;
                await deleteDoc(doc(window.firebaseDB, 'expenses', id));
                showSuccessModal('সফল!', 'খরচ মুছে ফেলা হয়েছে!', 2500);
                // Real-time listener will automatically update UI
            } catch (error) {
                console.error('Error deleting expense:', error);
                showErrorModal('ত্রুটি!', 'খরচ মুছে ফেলতে ব্যর্থ হয়েছে!');
            }
        },
        'হ্যাঁ, মুছুন'
    );
}

// ===================================
// EDIT EXPENSE (Open Modal)
// ===================================

function openEditModal(expenseId) {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;

    document.getElementById('editExpenseId').value = expense.id;
    document.getElementById('editDate').value = expense.date;
    document.getElementById('editCategory').value = expense.category;
    document.getElementById('editAmount').value = expense.amount;
    document.getElementById('editDescription').value = expense.description;

    openModal('editModal');
}

// ===================================
// EDIT EXPENSE FORM SUBMIT HANDLER
// ===================================

document.getElementById('editExpenseForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const expenseId = document.getElementById('editExpenseId').value;
    const updatedData = {
        date: document.getElementById('editDate').value,
        category: document.getElementById('editCategory').value,
        amount: parseFloat(document.getElementById('editAmount').value),
        description: document.getElementById('editDescription').value
    };

    try {
        const { updateDoc, doc } = window.firebaseFunctions;
        await updateDoc(doc(window.firebaseDB, 'expenses', expenseId), updatedData);
        closeModal('editModal');
        showSuccessModal('সফল!', 'খরচ আপডেট হয়েছে!', 2000);
        // Real-time listener will automatically update UI
    } catch (error) {
        console.error('Error updating expense:', error);
        showErrorModal('ত্রুটি!', 'খরচ আপডেট করতে ব্যর্থ হয়েছে!');
    }
});

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
    const categoryBudgetMonth = document.getElementById('categoryBudgetMonth');

    if (reportMonth) reportMonth.value = currentMonth;
    if (budgetMonth) budgetMonth.value = currentMonth;
    if (categoryBudgetMonth) categoryBudgetMonth.value = currentMonth;
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
// DARK MODE TOGGLE
// ===================================

// Dark mode elements
const darkModeToggle = document.getElementById('darkModeToggle');
const themeIcon = document.querySelector('.theme-icon');

/**
 * Initialize dark mode from localStorage
 */
function initDarkMode() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';

    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        updateDarkModeIcon(true);
    } else {
        document.body.classList.remove('dark-mode');
        updateDarkModeIcon(false);
    }
}

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');

    // Save preference to localStorage
    localStorage.setItem('darkMode', isDarkMode);

    // Update icon
    updateDarkModeIcon(isDarkMode);
}

/**
 * Update dark mode toggle icon
 */
function updateDarkModeIcon(isDarkMode) {
    if (!themeIcon) return;

    if (isDarkMode) {
        // Show moon icon (dark mode is on, click to switch to light)
        themeIcon.innerHTML = `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 1-21.21 0 9 9 0 1 1 .21 21.12A9 9 0 0 1 21 12.79z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    } else {
        // Show sun icon (light mode is on, click to switch to dark)
        themeIcon.innerHTML = `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" fill="none"/>
                <path d="M12 3v1m0 4a7 7 0 1 1 14 0 7 7 0 1 1-14 0" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
            </svg>
        `;
    }
}

// Add event listener for dark mode toggle
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', toggleDarkMode);
}

// Initialize dark mode on page load
initDarkMode();

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
