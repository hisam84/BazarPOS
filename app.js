/**
 * Voucher & Bill System - JavaScript Application
 * @version 3.0
 */

// =====================================================
// LOCAL STORAGE SETUP (Frontend Only)
// =====================================================
// This application now uses local browser storage only.
// No Firebase or cloud connectivity required.

// =====================================================
// BARCODE MANAGEMENT
// =====================================================

function generateBarcode(productCode) {
    if (!productCode) {
        showToast('Please enter a product code first!', 'error');
        return null;
    }
    
    // Create a 12-digit barcode: PPCODE + SERIAL (8 digits)
    const prefix = productCode.toUpperCase().slice(0, 4).padEnd(4, '0');
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const barcode = prefix + timestamp + random;
    
    return barcode;
}

function generateBarcodeSeries(productCode, quantity) {
    const barcodes = [];
    const prefix = productCode.toUpperCase().slice(0, 4).padEnd(4, '0');
    const timestamp = Date.now().toString().slice(-4);
    
    for (let i = 1; i <= quantity; i++) {
        const serial = i.toString().padStart(4, '0');
        const barcode = prefix + timestamp + serial;
        barcodes.push(barcode);
    }
    
    return barcodes;
}

function findProductByBarcode(barcode) {
    const products = getProducts();
    return products.find(p => p.barcode === barcode);
}

function getAllProductBarcodes() {
    const products = getProducts();
    const barcodes = [];
    
    products.forEach(product => {
        if (product.barcode) {
            barcodes.push({
                barcode: product.barcode,
                productCode: product.code,
                productName: product.name,
                quantity: product.quantity || 0
            });
        }
    });
    
    return barcodes;
}

// =====================================================
// BARCODE MANAGEMENT SCREEN FUNCTIONS
// =====================================================

let generatedBarcodes = [];

function showBarcodeScreen() {
    hideAllScreens();
    document.getElementById('barcodeScreen').classList.remove('hidden');
    updateSidebarActiveItem('barcode');
    loadBarcodeProducts();
    loadExistingBarcodes();
}

function loadBarcodeProducts() {
    const products = getProducts();
    const select = document.getElementById('barcodeProductSelect');
    
    select.innerHTML = '<option value="">Select Product</option>';
    products.forEach(product => {
        select.innerHTML += `<option value="${product.code}">${product.code} - ${product.name}</option>`;
    });
}

function loadExistingBarcodes() {
    const barcodes = getAllProductBarcodes();
    const tbody = document.getElementById('barcodeTableBody');
    
    if (barcodes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                    No barcodes found. Add barcodes to products first.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = barcodes.map(item => `
        <tr>
            <td class="px-4 py-3 font-medium">${item.productCode}</td>
            <td class="px-4 py-3">${item.productName}</td>
            <td class="px-4 py-3">
                <span class="font-mono text-sm bg-gray-100 px-2 py-1 rounded">${item.barcode}</span>
            </td>
            <td class="px-4 py-3 text-center">${item.quantity}</td>
            <td class="px-4 py-3 text-center">
                <button onclick="copyBarcode('${item.barcode}')" class="text-blue-600 hover:text-blue-800 mr-2" title="Copy">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                </button>
                <button onclick="printSingleBarcode('${item.barcode}', '${item.productName}')" class="text-green-600 hover:text-green-800" title="Print">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
}

function generateBarcodeSeries() {
    const productCode = document.getElementById('barcodeProductSelect').value;
    const quantity = parseInt(document.getElementById('barcodeQuantity').value);
    
    if (!productCode) {
        showToast('Please select a product!', 'error');
        return;
    }
    
    if (!quantity || quantity < 1 || quantity > 1000) {
        showToast('Please enter a valid quantity (1-1000)!', 'error');
        return;
    }
    
    const products = getProducts();
    const product = products.find(p => p.code === productCode);
    
    if (!product) {
        showToast('Product not found!', 'error');
        return;
    }
    
    generatedBarcodes = generateBarcodeSeries(productCode, quantity);
    displayGeneratedBarcodes(product);
    showToast(`Generated ${quantity} barcodes for ${product.name}!`, 'success');
}

function displayGeneratedBarcodes(product) {
    const section = document.getElementById('generatedBarcodesSection');
    const list = document.getElementById('generatedBarcodesList');
    
    section.classList.remove('hidden');
    
    list.innerHTML = generatedBarcodes.map(barcode => `
        <div class="border border-gray-200 rounded-lg p-3 text-center">
            <div class="text-xs text-gray-500 mb-1">${product.code}</div>
            <div class="font-mono text-sm font-bold mb-1">${barcode}</div>
            <div class="text-xs text-gray-600 truncate">${product.name}</div>
        </div>
    `).join('');
}

function clearGeneratedBarcodes() {
    generatedBarcodes = [];
    document.getElementById('generatedBarcodesSection').classList.add('hidden');
}

function copyBarcode(barcode) {
    navigator.clipboard.writeText(barcode).then(() => {
        showToast('Barcode copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy barcode!', 'error');
    });
}

function printSingleBarcode(barcode, productName) {
    const printWindow = window.open('', '_blank');
    const barcodeHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Barcode - ${productName}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .barcode-container { 
                    border: 2px solid #000; 
                    padding: 10px; 
                    text-align: center; 
                    width: 300px; 
                    margin: 0 auto;
                }
                .barcode { 
                    font-family: 'Courier New', monospace; 
                    font-size: 24px; 
                    font-weight: bold;
                    margin: 10px 0;
                }
                .product-name { 
                    font-size: 14px; 
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <div class="barcode-container">
                <div class="product-name">${productName}</div>
                <div class="barcode">${barcode}</div>
            </div>
            <script>
                window.onload = function() {
                    window.print();
                    window.close();
                }
            </script>
        </body>
        </html>
    `;
    printWindow.document.write(barcodeHtml);
    printWindow.document.close();
}

function printGeneratedBarcodes() {
    if (generatedBarcodes.length === 0) {
        showToast('No barcodes to print!', 'error');
        return;
    }
    
    const productCode = document.getElementById('barcodeProductSelect').value;
    const products = getProducts();
    const product = products.find(p => p.code === productCode);
    
    const printWindow = window.open('', '_blank');
    const barcodesPerPage = 24; // 4 columns x 6 rows
    const pages = Math.ceil(generatedBarcodes.length / barcodesPerPage);
    
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Barcodes - ${product.name}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 10px; }
                .page { 
                    page-break-after: always; 
                    margin-bottom: 20px;
                }
                .barcode-grid { 
                    display: grid; 
                    grid-template-columns: repeat(4, 1fr); 
                    gap: 10px; 
                    margin: 10px 0;
                }
                .barcode-item { 
                    border: 1px solid #000; 
                    padding: 8px; 
                    text-align: center; 
                    height: 80px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                .barcode { 
                    font-family: 'Courier New', monospace; 
                    font-size: 10px; 
                    font-weight: bold;
                    margin: 2px 0;
                }
                .product-info { 
                    font-size: 8px; 
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                @media print {
                    .page { page-break-after: always; }
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
    `;
    
    for (let page = 0; page < pages; page++) {
        const startIndex = page * barcodesPerPage;
        const endIndex = Math.min(startIndex + barcodesPerPage, generatedBarcodes.length);
        const pageBarcodes = generatedBarcodes.slice(startIndex, endIndex);
        
        html += `<div class="page">`;
        html += `<h3>${product.name} - Page ${page + 1}</h3>`;
        html += `<div class="barcode-grid">`;
        
        pageBarcodes.forEach(barcode => {
            html += `
                <div class="barcode-item">
                    <div class="product-info">${product.code}</div>
                    <div class="barcode">${barcode}</div>
                    <div class="product-info">${product.name}</div>
                </div>
            `;
        });
        
        html += `</div></div>`;
    }
    
    html += `
        <script>
            window.onload = function() {
                window.print();
                window.close();
            }
        </script>
        </body>
        </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

// =====================================================

// =====================================================
// LOADING ANIMATION FUNCTIONS
// =====================================================
function showLoading() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.classList.remove('hidden');
  }
}

function hideLoading() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.classList.add('hidden');
  }
}

// =====================================================
// CONFIGURATION
// =====================================================
const APP_PREFIX = 'voucher_system_';
const SUPER_ADMIN = { username: 'admin', password: 'superadmin@123' };
const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const WARNING_BEFORE_LOGOUT = 60 * 1000; // 60 seconds warning

let currentUser = null;
let currentVoucherData = null;
let isViewingHistory = false;
let isEditingVoucher = false;
let editingVoucherNo = null;
let inactivityTimer = null;
let warningTimer = null;
let countdownInterval = null;
let monthlyChart = null;
let paymentChart = null;

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
}

function formatBDCurrency(num) {
    if (isNaN(num) || num === null) return '৳0.00';
    const number = parseFloat(num);
    const isNegative = number < 0;
    const absNumber = Math.abs(number);

    const parts = absNumber.toFixed(2).split('.');
    let integerPart = parts[0];
    const decimalPart = parts[1];

    let result = '';
    if (integerPart.length > 3) {
        result = ',' + integerPart.slice(-3);
        integerPart = integerPart.slice(0, -3);
        while (integerPart.length > 2) {
            result = ',' + integerPart.slice(-2) + result;
            integerPart = integerPart.slice(0, -2);
        }
        result = integerPart + result;
    } else {
        result = integerPart;
    }

    return (isNegative ? '-' : '') + '৳' + result + '.' + decimalPart;
}

function numberToWords(num) {
    if (num === 0) return 'Zero taka only.';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convertLessThanThousand(n) {
        if (n === 0) return '';
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
    }

    function convert(n) {
        if (n === 0) return '';
        let result = '';

        if (n >= 10000000) {
            result += convertLessThanThousand(Math.floor(n / 10000000)) + ' Crore ';
            n %= 10000000;
        }
        if (n >= 100000) {
            result += convertLessThanThousand(Math.floor(n / 100000)) + ' Lakh ';
            n %= 100000;
        }
        if (n >= 1000) {
            result += convertLessThanThousand(Math.floor(n / 1000)) + ' Thousand ';
            n %= 1000;
        }
        if (n > 0) {
            result += convertLessThanThousand(n);
        }

        return result.trim();
    }

    const number = Math.abs(parseFloat(num));
    const integerPart = Math.floor(number);
    const decimalPart = Math.round((number - integerPart) * 100);

    let words = convert(integerPart) + ' Taka';

    if (decimalPart > 0) {
        words += ' and ' + convert(decimalPart) + ' Paisa';
    }

    words += ' only.';

    return words.charAt(0).toUpperCase() + words.slice(1);
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function generateVoucherNumber() {
    const userData = getUserData();
    const settings = userData.settings || {};
    const counter = (userData.voucherCounter || 0) + 1;
    const year = new Date().getFullYear();
    const prefix = settings.companyShortName || 'VCH';
    return `${prefix}-${year}-${String(counter).padStart(4, '0')}`;
}

function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast-notification fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-[9999] flex items-center space-x-2 ${type === 'success' ? 'bg-green-600' :
        type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        } text-white`;

    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.password-toggle-btn');
    const eyeIcon = button.querySelector('.eye-icon');
    const eyeOffIcon = button.querySelector('.eye-off-icon');

    if (input.type === 'password') {
        input.type = 'text';
        eyeIcon.classList.add('hidden');
        eyeOffIcon.classList.remove('hidden');
    } else {
        input.type = 'password';
        eyeIcon.classList.remove('hidden');
        eyeOffIcon.classList.add('hidden');
    }
}

// =====================================================
// STORAGE MANAGEMENT
// =====================================================

function getUsers() {
    const users = localStorage.getItem(APP_PREFIX + 'users');
    return users ? JSON.parse(users) : {};
}

function saveUsers(users) {
    localStorage.setItem(APP_PREFIX + 'users', JSON.stringify(users));
}

function getCompanies() {
    const companies = localStorage.getItem(APP_PREFIX + 'companies');
    return companies ? JSON.parse(companies) : {};
}

function saveCompanies(companies) {
    localStorage.setItem(APP_PREFIX + 'companies', JSON.stringify(companies));
}

// =====================================================
// SALER (SALESMAN) MANAGEMENT
// =====================================================
function getSalers() {
    if (!currentUser) return {};
    const salers = localStorage.getItem(APP_PREFIX + 'user_' + currentUser + '_salers');
    return salers ? JSON.parse(salers) : {};
}

function saveSalers(salers) {
    if (!currentUser) return;
    localStorage.setItem(APP_PREFIX + 'user_' + currentUser + '_salers', JSON.stringify(salers));
}

// =====================================================
// PEOPLE/PERSON MANAGEMENT (For Income/Expense Tracking)
// =====================================================
function getPeople() {
    if (!currentUser) return {};
    const people = localStorage.getItem(APP_PREFIX + 'user_' + currentUser + '_people');
    return people ? JSON.parse(people) : {};
}

function savePeople(people) {
    if (!currentUser) return;
    localStorage.setItem(APP_PREFIX + 'user_' + currentUser + '_people', JSON.stringify(people));
}

// =====================================================
// EXTERNAL INCOME & EXPENSE MANAGEMENT
// =====================================================
function getExternalIncomeExpense() {
    const userData = getUserData();
    return userData.externalIncomeExpense || { income: [], expense: [] };
}

function saveExternalIncomeExpense(data) {
    const userData = getUserData();
    userData.externalIncomeExpense = data;
    saveUserData(userData);
}

function getUserData() {
    console.log('Getting user data for:', currentUser);
    if (!currentUser) {
        console.log('No current user!');
        return null;
    }
    const data = localStorage.getItem(APP_PREFIX + 'user_' + currentUser);
    console.log('Raw data from localStorage:', data);
    const parsed = data ? JSON.parse(data) : {
        settings: {},
        vouchers: [],
        voucherCounter: 0
    };
    console.log('Parsed user data:', parsed);
    return parsed;
}

function saveUserData(data) {
    if (!currentUser) return;
    localStorage.setItem(APP_PREFIX + 'user_' + currentUser, JSON.stringify(data));
}

function getSession() {
    return localStorage.getItem(APP_PREFIX + 'session');
}

function setSession(username) {
    localStorage.setItem(APP_PREFIX + 'session', username);
}

function clearSession() {
    localStorage.removeItem(APP_PREFIX + 'session');
}

function initializeSuperAdmin() {
    const users = getUsers();
    if (!users[SUPER_ADMIN.username]) {
        users[SUPER_ADMIN.username] = {
            fullName: 'Super Admin',
            phone: '',
            email: '',
            address: '',
            passwordHash: hashPassword(SUPER_ADMIN.password),
            role: 'superadmin',
            createdAt: new Date().toISOString()
        };
        saveUsers(users);

        const adminData = {
            settings: {},
            vouchers: [],
            voucherCounter: 0
        };
        localStorage.setItem(APP_PREFIX + 'user_' + SUPER_ADMIN.username, JSON.stringify(adminData));
    }
    
    // Migrate old global saler and people data to admin account
    migrateSalersAndPeople();
}

function migrateSalersAndPeople() {
    // Migrate old global salers to admin account if they exist
    const oldSalers = localStorage.getItem(APP_PREFIX + 'salers');
    if (oldSalers) {
        const adminSalersKey = APP_PREFIX + 'user_' + SUPER_ADMIN.username + '_salers';
        const existingAdminSalers = localStorage.getItem(adminSalersKey);
        if (!existingAdminSalers) {
            // Only migrate if admin doesn't already have salers
            localStorage.setItem(adminSalersKey, oldSalers);
        }
        // Remove old global storage
        localStorage.removeItem(APP_PREFIX + 'salers');
    }
    
    // Migrate old global people to admin account if they exist
    const oldPeople = localStorage.getItem(APP_PREFIX + 'people');
    if (oldPeople) {
        const adminPeopleKey = APP_PREFIX + 'user_' + SUPER_ADMIN.username + '_people';
        const existingAdminPeople = localStorage.getItem(adminPeopleKey);
        if (!existingAdminPeople) {
            // Only migrate if admin doesn't already have people
            localStorage.setItem(adminPeopleKey, oldPeople);
        }
        // Remove old global storage
        localStorage.removeItem(APP_PREFIX + 'people');
    }
}

// =====================================================
// INACTIVITY MANAGEMENT
// =====================================================

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    clearTimeout(warningTimer);
    clearInterval(countdownInterval);

    const inactivityModal = document.getElementById('inactivityModal');
    if (inactivityModal) {
        inactivityModal.classList.add('hidden');
    }

    if (currentUser) {
        inactivityTimer = setTimeout(() => {
            showInactivityWarning();
        }, INACTIVITY_TIMEOUT - WARNING_BEFORE_LOGOUT);
    }
}

function showInactivityWarning() {
    const inactivityModal = document.getElementById('inactivityModal');
    const countdownTimer = document.getElementById('countdownTimer');
    
    if (!inactivityModal || !countdownTimer) {
        return;
    }

    inactivityModal.classList.remove('hidden');
    let countdown = 60;
    countdownTimer.textContent = countdown;

    countdownInterval = setInterval(() => {
        countdown--;
        countdownTimer.textContent = countdown;
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            logout();
        }
    }, 1000);
}

function setupInactivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
        document.addEventListener(event, () => {
            const inactivityModal = document.getElementById('inactivityModal');
            if (currentUser && inactivityModal && inactivityModal.classList.contains('hidden')) {
                resetInactivityTimer();
            }
        });
    });
}

// =====================================================
// SCREEN MANAGEMENT
// =====================================================

function hideAllScreens() {
    document.querySelectorAll('[id$="Screen"]').forEach(screen => {
        screen.classList.add('hidden');
    });
}

function showLoginScreen() {
    hideAllScreens();
    document.getElementById('loginScreen').classList.remove('hidden');
    // Clear login form inputs
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.reset();
    }
}

function renderCharts() {
    // Chart rendering function
    // Charts will be rendered when dashboard data is available
    // This is a placeholder for Chart.js integration
}

function loadRecentVouchers() {
    // Load and display recent vouchers on dashboard
    const recentVouchersEl = document.getElementById('recentVouchers');
    if (!recentVouchersEl) return;
    
    const userData = getUserData();
    if (!userData || !userData.vouchers) {
        recentVouchersEl.innerHTML = '<p class="text-gray-500">No vouchers yet</p>';
        return;
    }
    
    const recent = userData.vouchers.slice(-5).reverse();
    recentVouchersEl.innerHTML = recent.map(v => `
        <div class="p-2 bg-gray-50 rounded text-sm">
            ${v.voucherNo}: ${v.date}
        </div>
    `).join('');
}

function updateSidebarActiveItem(item) {
    // Update active sidebar menu item
    const sidebarItems = document.querySelectorAll('[data-menu-item]');
    sidebarItems.forEach(el => {
        el.classList.remove('active', 'bg-blue-500', 'text-white');
    });
    
    const activeItem = document.querySelector(`[data-menu-item="${item}"]`);
    if (activeItem) {
        activeItem.classList.add('active', 'bg-blue-500', 'text-white');
    }
}

function initSidebarState() {
    // Initialize sidebar state
    // This can be used to restore previously saved sidebar state if needed
}

function showDashboard() {
    hideAllScreens();
    document.getElementById('dashboardScreen').classList.remove('hidden');

    const users = getUsers();
    const user = users[currentUser];
    document.getElementById('currentUserDisplay').textContent = `Welcome, ${user?.fullName || currentUser}`;

    // Show/hide manage users card based on role
    if (user?.role === 'superadmin') {
        document.getElementById('manageUsersCard').classList.remove('hidden');
        document.getElementById('sidebarManageUsersItem').classList.remove('hidden');
    } else {
        document.getElementById('manageUsersCard').classList.add('hidden');
        document.getElementById('sidebarManageUsersItem').classList.add('hidden');
    }

    updateDashboardStats();
    renderCharts();
    loadRecentVouchers();
    updateSidebarActiveItem('dashboard');
    initSidebarState();
}

function showChangePassword() {
    hideAllScreens();
    document.getElementById('changePasswordScreen').classList.remove('hidden');
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';
}

function showProfile() {
    hideAllScreens();
    document.getElementById('profileScreen').classList.remove('hidden');
    loadProfileScreen();
}

function showManageUsers() {
    const users = getUsers();
    if (users[currentUser]?.role !== 'superadmin') {
        showToast('Access denied', 'error');
        return;
    }

    hideAllScreens();
    document.getElementById('manageUsersScreen').classList.remove('hidden');
    loadCompaniesList();
    updateSidebarActiveItem('companies');
}

function showManageSalers() {
    hideAllScreens();
    document.getElementById('salersScreen').classList.remove('hidden');
    loadSalersList();
    populateSalersDropdown();
    updateSidebarActiveItem('salers');
}

function showExternalTransactions() {
    hideAllScreens();
    document.getElementById('externalTransactionsScreen').classList.remove('hidden');
    loadExternalTransactions();
    updateSidebarActiveItem('external-transactions');
}

function showSettings() {
    hideAllScreens();
    document.getElementById('settingsScreen').classList.remove('hidden');
    loadSettings();
    updateSidebarActiveItem('settings');
}

function showSiteSettings() {
    hideAllScreens();
    document.getElementById('siteSettingsScreen').classList.remove('hidden');
    loadSiteSettings();
}

function showCreateVoucher(isEdit = false) {
    hideAllScreens();
    isViewingHistory = false;
    document.getElementById('createVoucherScreen').classList.remove('hidden');

    const headerTitle = document.querySelector('#createVoucherScreen header h1');
    if (headerTitle) {
        headerTitle.textContent = isEdit ? 'Edit Sale' : 'New Sale';
    }

    if (!isEdit) {
        isEditingVoucher = false;
        editingVoucherNo = null;
        initializeVoucherForm();
    }

    updateSidebarActiveItem('voucher');
}

function showVoucherHistory() {
    hideAllScreens();
    document.getElementById('historyScreen').classList.remove('hidden');
    loadVoucherHistory();
    updateSidebarActiveItem('history');
}

function showInventory() {
    hideAllScreens();
    document.getElementById('inventoryScreen').classList.remove('hidden');
    loadInventory();
    updateSidebarActiveItem('inventory');
}

// =====================================================
// INVENTORY MANAGEMENT
// =====================================================

let currentSort = { field: 'code', direction: 'asc' };
let allProducts = [];

function getProducts() {
    const userData = getUserData();
    let products = userData.products || [];

    // Data migration: Convert old single-price to purchase/selling prices
    let migrated = false;
    products = products.map(p => {
        if (p.price !== undefined && (p.purchasePrice === undefined || p.sellingPrice === undefined)) {
            migrated = true;
            return {
                ...p,
                purchasePrice: p.purchasePrice || 0,
                sellingPrice: p.sellingPrice || p.price || 0,
                price: undefined // Remove old price field
            };
        }
        return p;
    });

    // Save migrated data
    if (migrated) {
        userData.products = products;
        saveUserData(userData);
    }

    return products;
}

function saveProducts(products) {
    const userData = getUserData();
    userData.products = products;
    saveUserData(userData);
}

function loadInventory() {
    allProducts = getProducts();
    updateInventoryStats(allProducts);
    renderProductTable(allProducts);
}

function updateInventoryStats(products) {
    const totalProducts = products.length;
    const lowStockItems = products.filter(p => p.quantity <= (p.lowStockAlert || 5)).length;
    const totalValue = products.reduce((sum, p) => sum + (p.quantity * (p.purchasePrice || p.price || 0)), 0);

    document.getElementById('totalProductsCount').textContent = totalProducts;
    document.getElementById('lowStockCount').textContent = lowStockItems;
    document.getElementById('inventoryValue').textContent = formatBDCurrency(totalValue);
}

function renderProductTable(products) {
    const tbody = document.getElementById('productInventoryBody');
    const noProductsMsg = document.getElementById('noProductsMessage');

    if (products.length === 0) {
        tbody.innerHTML = '';
        noProductsMsg.classList.remove('hidden');
        return;
    }

    noProductsMsg.classList.add('hidden');

    tbody.innerHTML = products.map(product => {
        const totalValue = product.quantity * (product.sellingPrice || product.price || 0);
        const stockStatus = getStockStatus(product);
        const stockText = stockStatus === 'out' ? 'Out of Stock' : product.quantity;

        return `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${product.code}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${product.barcode ? `<span class="font-mono text-xs bg-gray-100 px-2 py-1 rounded">${product.barcode}</span>` : '<span class="text-gray-400 text-xs">No barcode</span>'}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="font-medium">${product.name}</div>
                    ${product.description ? `<div class="text-xs text-gray-500 mt-1">${product.description}</div>` : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    <span class="stock-badge stock-${stockStatus}">${stockText}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    <span class="px-2 py-1 bg-gray-100 rounded text-xs font-medium">${product.unit || 'pcs'}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">${formatBDCurrency(product.sellingPrice || product.price || 0)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">${formatBDCurrency(totalValue)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                    <button onclick="editProduct('${product.code.replace(/'/g, "\\'")}')" 
                        class="text-blue-600 hover:text-blue-900">Edit</button>
                    <button onclick="deleteProduct('${product.code.replace(/'/g, "\\'")}')" 
                        class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function getStockStatus(product) {
    if (product.quantity <= 0) return 'out';
    if (product.quantity <= (product.lowStockAlert || 5)) return 'low';
    return 'ok';
}

function showAddProductModal() {
    document.getElementById('productModalTitle').textContent = 'Add Product';
    document.getElementById('productForm').reset();
    document.getElementById('productForm').dataset.mode = 'add';
    document.getElementById('productCode').disabled = false;
    document.getElementById('productModal').classList.remove('hidden');
}

function editProduct(code) {
    const products = getProducts();
    const product = products.find(p => p.code === code);

    if (!product) {
        showToast('Product not found!', 'error');
        return;
    }

    document.getElementById('productModalTitle').textContent = 'Edit Product';
    document.getElementById('productCode').value = product.code;
    document.getElementById('productBarcode').value = product.barcode || '';
    document.getElementById('productName').value = product.name;
    document.getElementById('productQuantity').value = product.quantity;
    document.getElementById('productUnit').value = product.unit || 'pcs';
    document.getElementById('productPurchasePrice').value = product.purchasePrice || 0;
    document.getElementById('productSellingPrice').value = product.sellingPrice || product.price || 0;
    document.getElementById('productLowStockAlert').value = product.lowStockAlert || 5;
    document.getElementById('productWarranty').value = product.warranty || 0;
    document.getElementById('productCategory').value = product.category || 'Other';
    document.getElementById('productSupplier').value = product.supplier || '';
    document.getElementById('productDescription').value = product.description || '';

    document.getElementById('productForm').dataset.mode = 'edit';
    document.getElementById('productForm').dataset.originalCode = code;
    document.getElementById('productCode').disabled = true;
    document.getElementById('productModal').classList.remove('hidden');
}

// Update quantity requirement based on category
function updateQuantityRequirement() {
    const category = document.getElementById('productCategory').value || 'Other';
    const quantityInput = document.getElementById('productQuantity');
    const quantityRequired = document.getElementById('quantityRequired');
    
    if (category === 'Service' || category === 'Digital') {
        quantityInput.removeAttribute('required');
        if (quantityRequired) {
            quantityRequired.textContent = '';
        }
    } else {
        quantityInput.setAttribute('required', 'required');
        if (quantityRequired) {
            quantityRequired.textContent = '*';
        }
    }
}

function handleProductSave(e) {
    e.preventDefault();

    const mode = document.getElementById('productForm').dataset.mode;
    let products = getProducts();
    const category = document.getElementById('productCategory').value || 'Other';
    const quantityValue = parseFloat(document.getElementById('productQuantity').value) || 0;

    const productData = {
        code: document.getElementById('productCode').value.trim().toUpperCase(),
        barcode: document.getElementById('productBarcode').value.trim(),
        name: document.getElementById('productName').value.trim(),
        quantity: (category === 'Service' || category === 'Digital') ? 0 : quantityValue,
        unit: document.getElementById('productUnit').value || 'pcs',
        purchasePrice: parseFloat(document.getElementById('productPurchasePrice').value) || 0,
        sellingPrice: parseFloat(document.getElementById('productSellingPrice').value) || 0,
        lowStockAlert: parseInt(document.getElementById('productLowStockAlert').value) || 5,
        warranty: parseInt(document.getElementById('productWarranty').value) || 0,
        category: category,
        supplier: document.getElementById('productSupplier').value.trim(),
        description: document.getElementById('productDescription').value.trim()
    };

    // Validation
    if (!productData.code || !productData.name) {
        showToast('Product code and name are required!', 'error');
        return;
    }

    // Quantity is required only for Physical and Other categories
    if ((category === 'Physical' || category === 'Other' || category === '') && quantityValue <= 0) {
        showToast('Quantity is required for ' + category + ' products!', 'error');
        return;
    }

    if (mode === 'add') {
        // Check for duplicate code
        if (products.find(p => p.code === productData.code)) {
            showToast('Product code already exists!', 'error');
            return;
        }
        // mark createdAt for inventory additions
        productData.createdAt = new Date().toISOString();
        products.push(productData);
        showToast('Product added successfully!', 'success');
    } else {
        // Edit mode
        const originalCode = document.getElementById('productForm').dataset.originalCode;
        const index = products.findIndex(p => p.code === originalCode);
        if (index !== -1) {
            // preserve original creation timestamp if present
            productData.createdAt = products[index].createdAt || new Date().toISOString();
            products[index] = productData;
            showToast('Product updated successfully!', 'success');
        }
    }

    saveProducts(products);
    closeProductModal();
    loadInventory();
}

function deleteProduct(code) {
    if (!confirm(`Are you sure you want to delete product "${code}"?`)) return;

    let products = getProducts();
    products = products.filter(p => p.code !== code);
    saveProducts(products);
    showToast('Product deleted successfully!', 'success');
    loadInventory();
}

function closeProductModal() {
    document.getElementById('productModal').classList.add('hidden');
    document.getElementById('productForm').reset();
}

// =====================================================
// ADD PRODUCT SCREEN FUNCTIONS
// =====================================================

function showAddProductScreen() {
    hideAllScreens();
    document.getElementById('addProductScreen').classList.remove('hidden');
    updateSidebarActiveItem('add-product');
    resetAddProductForm();
}

function generateAddProductBarcode() {
    const productCode = document.getElementById('addProductCode').value.trim();
    if (!productCode) {
        showToast('Please enter a product code first!', 'error');
        return;
    }
    
    const barcode = generateBarcode(productCode);
    if (barcode) {
        document.getElementById('addProductBarcode').value = barcode;
        showToast('Barcode generated successfully!', 'success');
    }
}

function generateProductModalBarcode() {
    const productCode = document.getElementById('productCode').value.trim();
    if (!productCode) {
        showToast('Please enter a product code first!', 'error');
        return;
    }
    
    const barcode = generateBarcode(productCode);
    if (barcode) {
        document.getElementById('productBarcode').value = barcode;
        showToast('Barcode generated successfully!', 'success');
    }
}

function resetAddProductForm() {
    document.getElementById('addProductForm').reset();
    updateAddProductQuantityRequirement();
}

function updateAddProductQuantityRequirement() {
    const category = document.getElementById('addProductCategory').value;
    const quantityRequired = document.getElementById('addQuantityRequired');
    const quantityField = document.getElementById('addProductQuantity');
    
    if (category === 'Service' || category === 'Digital') {
        quantityRequired.classList.add('hidden');
        quantityField.required = false;
        quantityField.value = '0';
    } else {
        quantityRequired.classList.remove('hidden');
        quantityField.required = true;
    }
}

function handleAddProductForm(e) {
    e.preventDefault();
    
    let products = getProducts();
    const category = document.getElementById('addProductCategory').value || 'Other';
    const quantityValue = parseFloat(document.getElementById('addProductQuantity').value) || 0;

    const productData = {
        code: document.getElementById('addProductCode').value.trim().toUpperCase(),
        barcode: document.getElementById('addProductBarcode').value.trim(),
        name: document.getElementById('addProductName').value.trim(),
        quantity: (category === 'Service' || category === 'Digital') ? 0 : quantityValue,
        unit: document.getElementById('addProductUnit').value || 'pcs',
        purchasePrice: parseFloat(document.getElementById('addProductPurchasePrice').value) || 0,
        sellingPrice: parseFloat(document.getElementById('addProductSellingPrice').value) || 0,
        lowStockAlert: parseInt(document.getElementById('addProductLowStockAlert').value) || 5,
        warranty: parseInt(document.getElementById('addProductWarranty').value) || 0,
        category: category,
        supplier: document.getElementById('addProductSupplier').value.trim(),
        description: document.getElementById('addProductDescription').value.trim()
    };

    // Validation
    if (!productData.code || !productData.name) {
        showToast('Product code and name are required!', 'error');
        return;
    }

    // Quantity is required only for Physical and Other categories
    if ((category === 'Physical' || category === 'Other' || category === '') && quantityValue <= 0) {
        showToast('Quantity is required for ' + category + ' products!', 'error');
        return;
    }

    // Check for duplicate code
    if (products.find(p => p.code === productData.code)) {
        showToast('Product code already exists!', 'error');
        return;
    }

    // Save product
    productData.createdAt = new Date().toISOString();
    products.push(productData);
    saveProducts(products);
    
    showToast('Product added successfully!', 'success');
    
    // Navigate back to inventory
    window.location.hash = 'inventory';
}

function searchProducts(query) {
    if (!query.trim()) {
        renderProductTable(allProducts);
        updateInventoryStats(allProducts);
        return;
    }

    const searchTerm = query.toLowerCase();
    const filtered = allProducts.filter(p =>
        p.code.toLowerCase().includes(searchTerm) ||
        p.name.toLowerCase().includes(searchTerm) ||
        (p.description && p.description.toLowerCase().includes(searchTerm))
    );

    renderProductTable(filtered);
    updateInventoryStats(filtered);
}

function sortProducts(field) {
    // Toggle direction if same field, otherwise reset to ascending
    if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = field;
        currentSort.direction = 'asc';
    }

    // Sort all products
    allProducts.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];

        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        if (currentSort.direction === 'asc') {
            return valA > valB ? 1 : -1;
        } else {
            return valA < valB ? 1 : -1;
        }
    });

    renderProductTable(allProducts);
    updateSortIndicators(field);
}

function updateSortIndicators(field) {
    // Remove all sort indicators
    document.querySelectorAll('.product-table th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
    });

    // Add indicator to current sorted column
    const currentTh = Array.from(document.querySelectorAll('.product-table th')).find(th =>
        th.getAttribute('onclick') && th.getAttribute('onclick').includes(`'${field}'`)
    );

    if (currentTh) {
        currentTh.classList.add(`sorted-${currentSort.direction}`);
    }
}

// =====================================================
// CLIENT MANAGEMENT
// =====================================================

function getClients() {
    console.log('Getting clients...');
    const userData = getUserData();
    console.log('User data:', userData);
    const clients = userData ? userData.clients || [] : [];
    console.log('Clients retrieved:', clients);
    return clients;
}

function saveClients(clients) {
    const data = getUserData();
    data.clients = clients;
    saveUserData(data);
}

function showClients() {
    hideAllScreens();
    document.getElementById('clientsScreen').classList.remove('hidden');
    loadClients();
    updateSidebarActiveItem('clients');
}

function loadClients() {
    const clients = getClients();
    const tbody = document.getElementById('clientTableBody');
    const noClientsMsg = document.getElementById('noClientsMessage');
    const searchTerm = document.getElementById('clientSearch').value.toLowerCase();

    tbody.innerHTML = '';

    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm) ||
        c.phone.includes(searchTerm) ||
        (c.email && c.email.toLowerCase().includes(searchTerm))
    );

    if (filtered.length === 0) {
        tbody.parentElement.classList.add('hidden');
        noClientsMsg.classList.remove('hidden');
    } else {
        tbody.parentElement.classList.remove('hidden');
        noClientsMsg.classList.add('hidden');

        filtered.forEach(client => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${client.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${client.phone}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${client.email || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">${client.address || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button onclick="editClient('${client.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                    <button onclick="deleteClient('${client.id}')" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function searchClients(query) {
    loadClients();
}

let editingClientId = null;

function showAddClientModal() {
    editingClientId = null;
    document.getElementById('clientForm').reset();
    document.getElementById('clientModalTitle').textContent = 'Add Client';
    document.getElementById('clientModal').classList.remove('hidden');
}

function closeClientModal() {
    document.getElementById('clientModal').classList.add('hidden');
    editingClientId = null;
}

function editClient(id) {
    console.log('Editing client with ID:', id);
    const clients = getClients();
    console.log('All clients:', clients);
    const client = clients.find(c => c.id === id);
    console.log('Found client:', client);
    if (!client) {
        console.log('Client not found!');
        return;
    }

    editingClientId = id;
    console.log('Setting form values...');
    document.getElementById('inputClientName').value = client.name;
    document.getElementById('inputClientPhone').value = client.phone;
    document.getElementById('inputClientEmail').value = client.email || '';
    document.getElementById('inputClientAddress').value = client.address || '';
    document.getElementById('inputClientWebsite').value = client.website || '';

    console.log('Form values set:', {
        name: document.getElementById('inputClientName').value,
        phone: document.getElementById('inputClientPhone').value,
        email: document.getElementById('inputClientEmail').value,
        address: document.getElementById('inputClientAddress').value,
        website: document.getElementById('inputClientWebsite').value
    });

    document.getElementById('clientModalTitle').textContent = 'Edit Client';
    document.getElementById('clientModal').classList.remove('hidden');
    console.log('Modal opened');
}

function saveClient(e) {
    e.preventDefault();

    const name = document.getElementById('inputClientName').value.trim();
    const phone = document.getElementById('inputClientPhone').value.trim();
    const email = document.getElementById('inputClientEmail').value.trim();
    const address = document.getElementById('inputClientAddress').value.trim();
    const website = document.getElementById('inputClientWebsite').value.trim();

    if (!name || !phone) {
        showToast('Name and Phone are required', 'error');
        return;
    }

    const clients = getClients();

    // Check Duplicate Phone (Exclude current client if editing)
    const duplicatePhone = clients.find(c => c.phone === phone && c.id !== editingClientId);
    if (duplicatePhone) {
        showToast('A client with this Phone Number already exists!', 'error');
        return;
    }

    // Check Duplicate Email (if provided)
    if (email) {
        const duplicateEmail = clients.find(c => c.email && c.email.toLowerCase() === email.toLowerCase() && c.id !== editingClientId);
        if (duplicateEmail) {
            showToast('A client with this Email Address already exists!', 'error');
            return;
        }
    }

    if (editingClientId) {
        const index = clients.findIndex(c => c.id === editingClientId);
        if (index !== -1) {
            clients[index] = { ...clients[index], name, phone, email, address, website };
            showToast('Client updated successfully');
        }
    } else {
        clients.push({
            id: Date.now().toString(),
            name,
            phone,
            email,
            address,
            website
        });
        showToast('Client added successfully');
    }

    saveClients(clients);
    closeClientModal();
    showClients();
}

function deleteClient(id) {
    if (!confirm('Are you sure you want to delete this client?')) return;

    const clients = getClients();
    const newClients = clients.filter(c => c.id !== id);
    saveClients(newClients);
    loadClients();
    showToast('Client deleted');
}

function saveClientFromVoucher(voucherData) {
    if (!voucherData || !voucherData.clientName) return;

    try {
        const clients = getClients();

        // Try to find existing client
        let existing = null;

        // 1. Check by Phone (if provided) - Strongest match
        if (voucherData.clientPhone) {
            existing = clients.find(c => c.phone === voucherData.clientPhone);
        }

        // 2. Check by Name (if no phone provided or no match by phone)
        if (!existing) {
            // Only match by name if name is sufficiently unique/long to avoid accidents?
            // For now, strict name match
            existing = clients.find(c => c.name.toLowerCase() === voucherData.clientName.trim().toLowerCase());
        }

        if (!existing) {
            clients.push({
                id: Date.now().toString(),
                name: voucherData.clientName,
                phone: voucherData.clientPhone || '',
                email: voucherData.clientEmail || '',
                address: voucherData.clientAddress || '',
                website: ''
            });
            saveClients(clients);
            // showToast('Client added to list', 'success'); // Optional feedback
        }
    } catch (error) {
        console.error('Error saving client from voucher:', error);
    }
}

function syncClientsFromHistory() {
    const userData = getUserData();
    if (!userData) return;
    const vouchers = userData.vouchers || [];
    const clients = userData.clients || [];

    if (vouchers.length === 0) return;

    let changed = false;
    const existingPhones = new Set(clients.map(c => c.phone));

    vouchers.forEach(v => {
        if (v.clientPhone && !existingPhones.has(v.clientPhone)) {
            clients.push({
                id: 'imported_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                name: v.clientName,
                phone: v.clientPhone,
                email: v.clientEmail || '',
                address: v.clientAddress || '',
                website: ''
            });
            existingPhones.add(v.clientPhone);
            changed = true;
        }
    });

    if (changed) {
        userData.clients = clients;
        saveUserData(userData);
    }
}

// New Autocomplete Implementation


// Global selector
window.selectClient = function (phone, name) {
    const suggestions = document.getElementById('clientNameSuggestions');
    if (suggestions) suggestions.classList.add('hidden');

    // Re-fetch to find full details
    const clients = getClients() || [];
    // We can rely on stored clients mostly, or merge again.
    // Let's merge to be safe.
    const history = getUniqueClients() || [];
    const map = new Map();
    const getKey = (c) => (c.phone && c.phone.length > 3) ? c.phone : c.name;

    history.forEach(c => { const k = getKey(c); if (k) map.set(k, c); });
    clients.forEach(c => { const k = getKey(c); if (k) map.set(k, c); });

    const all = Array.from(map.values());

    let client;
    if (phone) client = all.find(c => c.phone === phone);
    if (!client && name) client = all.find(c => c.name === name);

    if (client) {
        document.getElementById('clientName').value = client.name || '';
        document.getElementById('clientPhone').value = client.phone || '';
        document.getElementById('clientEmail').value = client.email || '';
        document.getElementById('clientAddress').value = client.address || '';
    }
};

function setupClientAutocomplete_OLD() {
    const clientNameInput = document.getElementById('clientName');
    const clientPhoneInput = document.getElementById('clientPhone');
    const nameSuggestions = document.getElementById('clientNameSuggestions');
    const phoneSuggestions = document.getElementById('clientPhoneSuggestions');

    if (!clientNameInput || !clientPhoneInput) return;

    function getAllClientsMerged() {
        const storedClients = getClients();
        const historyClients = getUniqueClients();
        const map = new Map();

        // Helper to generate a unique key
        const getKey = (c) => c.phone && c.phone.length > 5 ? c.phone : c.name;

        // History clients (lower priority)
        historyClients.forEach(c => {
            const key = getKey(c);
            if (key) map.set(key, c);
        });

        // Stored clients (overwrite)
        storedClients.forEach(c => {
            const key = getKey(c);
            if (key) map.set(key, c);
        });

        return Array.from(map.values());
    }

    function renderClientSuggestions(container, matches, query, type) {
        container.innerHTML = matches.map(client => {
            const val = client[type] || '';
            const matchIndex = val.toLowerCase().indexOf(query);
            let displayVal = val;

            if (matchIndex >= 0) {
                displayVal = val.substring(0, matchIndex) +
                    `<strong class="bg-yellow-200">${val.substring(matchIndex, matchIndex + query.length)}</strong>` +
                    val.substring(matchIndex + query.length);
            }

            return `
                <div class="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0" onclick="fillClientInfo('${client.phone ? client.phone.replace(/'/g, "\\'") : ''}', '${client.name.replace(/'/g, "\\'")}')">
                    <div class="font-medium text-gray-800">${client.name}</div>
                    ${client.phone ? `<div class="text-xs text-gray-500">${client.phone}</div>` : ''}
                </div>
            `;
        }).join('');
        container.classList.remove('hidden');
    }

    function handleInput(input, type) {
        const query = input.value.trim().toLowerCase();
        const suggestionsEl = type === 'name' ? nameSuggestions : phoneSuggestions;

        if (query.length < 1) { // Changed from 2 to 1 for better responsiveness
            suggestionsEl.classList.add('hidden');
            return;
        }

        const clients = getAllClientsMerged();
        const matches = clients.filter(c =>
            (c[type] || '').toLowerCase().includes(query)
        ).slice(0, 5);

        if (matches.length === 0) {
            suggestionsEl.classList.add('hidden');
            return;
        }

        renderClientSuggestions(suggestionsEl, matches, query, type);
    }

    clientNameInput.addEventListener('input', () => handleInput(clientNameInput, 'name'));
    clientNameInput.addEventListener('focus', () => handleInput(clientNameInput, 'name')); // Trigger on focus too
    clientPhoneInput.addEventListener('input', () => handleInput(clientPhoneInput, 'phone'));
    clientPhoneInput.addEventListener('focus', () => handleInput(clientPhoneInput, 'phone'));

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.relative')) {
            if (nameSuggestions) nameSuggestions.classList.add('hidden');
            if (phoneSuggestions) phoneSuggestions.classList.add('hidden');
        }
    });

    // Helper to fill info (updated to fallback to name lookup if phone missing)
    window.fillClientInfo = function (phone, name) {
        const clients = getAllClientsMerged();
        // Try finding by phone first, then name
        let client;
        if (phone) {
            client = clients.find(c => c.phone === phone);
        }
        if (!client && name) {
            client = clients.find(c => c.name === name);
        }

        if (client) {
            document.getElementById('clientName').value = client.name || '';
            document.getElementById('clientPhone').value = client.phone || '';
            document.getElementById('clientEmail').value = client.email || '';
            document.getElementById('clientAddress').value = client.address || '';

            if (nameSuggestions) nameSuggestions.classList.add('hidden');
            if (phoneSuggestions) phoneSuggestions.classList.add('hidden');
        }
    };
}

// =====================================================
// AUTHENTICATION
// =====================================================

function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    const users = getUsers();

    if (!users[username]) {
        showToast('User not found!', 'error');
        return;
    }

    if (users[username].passwordHash !== hashPassword(password)) {
        showToast('Invalid password!', 'error');
        return;
    }

    currentUser = username;
    setSession(username);
    resetInactivityTimer();
    window.location.hash = 'dashboard';
    handleRouteChange();
    showToast('Login successful!', 'success');
}

function handleChangePassword(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    const users = getUsers();

    if (users[currentUser].passwordHash !== hashPassword(currentPassword)) {
        showToast('Current password is incorrect!', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showToast('New password must be at least 6 characters!', 'error');
        return;
    }

    if (newPassword !== confirmNewPassword) {
        showToast('New passwords do not match!', 'error');
        return;
    }

    users[currentUser].passwordHash = hashPassword(newPassword);
    saveUsers(users);

    showToast('Password changed successfully!', 'success');
    window.location.hash = 'dashboard';
    handleRouteChange();
}

function logout() {
    clearTimeout(inactivityTimer);
    clearTimeout(warningTimer);
    clearInterval(countdownInterval);
    
    const inactivityModal = document.getElementById('inactivityModal');
    if (inactivityModal) {
        inactivityModal.classList.add('hidden');
    }

    currentUser = null;
    clearSession();

    // Clear login form inputs
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.reset();
    }

    window.location.hash = 'dashboard';
    handleRouteChange();
    showToast('Logged out successfully', 'success');
}

// Alias for sidebar logout button
const handleLogout = logout;

// =====================================================
// PROFILE MANAGEMENT
// =====================================================

function loadProfileScreen() {
    if (!currentUser) return;

    const users = getUsers();
    const user = users[currentUser];

    // Populate view mode
    document.getElementById('profileUsername').textContent = currentUser;
    document.getElementById('profileFullName').textContent = user?.fullName || '-';
    document.getElementById('profileEmail').textContent = user?.email || '-';
    document.getElementById('profilePhone').textContent = user?.phone || '-';
    document.getElementById('profileAddress').textContent = user?.address || '-';
    document.getElementById('profileRole').textContent = user?.role || '-';

    // Populate edit mode
    document.getElementById('editProfileFullName').value = user?.fullName || '';
    document.getElementById('editProfileEmail').value = user?.email || '';
    document.getElementById('editProfilePhone').value = user?.phone || '';
    document.getElementById('editProfileAddress').value = user?.address || '';

    // Show view mode and hide edit mode
    document.getElementById('profileViewMode').classList.remove('hidden');
    document.getElementById('profileEditMode').classList.add('hidden');
}

function toggleProfileEditMode() {
    document.getElementById('profileViewMode').classList.toggle('hidden');
    document.getElementById('profileEditMode').classList.toggle('hidden');
}

function saveProfileChanges(event) {
    event.preventDefault();

    if (!currentUser) {
        showToast('User not logged in', 'error');
        return;
    }

    const users = getUsers();
    const fullName = document.getElementById('editProfileFullName').value.trim();
    const email = document.getElementById('editProfileEmail').value.trim();
    const phone = document.getElementById('editProfilePhone').value.trim();
    const address = document.getElementById('editProfileAddress').value.trim();

    if (!fullName) {
        showToast('Full name is required', 'error');
        return;
    }

    // Update user data
    users[currentUser].fullName = fullName;
    users[currentUser].email = email;
    users[currentUser].phone = phone;
    users[currentUser].address = address;

    saveUsers(users);

    // Update the display in header
    document.getElementById('currentUserDisplay').textContent = `Welcome, ${fullName}`;

    showToast('Profile updated successfully', 'success');

    // Refresh the view mode with updated data
    loadProfileScreen();
    toggleProfileEditMode();
}

function changePasswordFromProfile(event) {
    event.preventDefault();

    const currentPassword = document.getElementById('profileCurrentPassword').value;
    const newPassword = document.getElementById('profileNewPassword').value;
    const confirmNewPassword = document.getElementById('profileConfirmNewPassword').value;

    const users = getUsers();

    if (users[currentUser].passwordHash !== hashPassword(currentPassword)) {
        showToast('Current password is incorrect!', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showToast('New password must be at least 6 characters!', 'error');
        return;
    }

    if (newPassword !== confirmNewPassword) {
        showToast('New passwords do not match!', 'error');
        return;
    }

    users[currentUser].passwordHash = hashPassword(newPassword);
    setUsers(users);

    showToast('Password changed successfully!', 'success');

    // Clear the form
    document.getElementById('profileChangePasswordForm').reset();

    // Reload profile screen to reset the form
    loadProfileScreen();
}

// =====================================================
// INACTIVITY TIMER
// =====================================================

function setupInactivityListeners() {
    // Events that indicate user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
        document.addEventListener(event, () => {
            // Only reset timer if user is logged in
            if (currentUser) {
                resetInactivityTimer();
            }
        }, true);
    });
}

function resetInactivityTimer() {
    // Clear existing timers
    clearTimeout(inactivityTimer);
    clearTimeout(warningTimer);
    clearInterval(countdownInterval);

    // Hide warning modal if showing
    const inactivityModal = document.getElementById('inactivityModal');
    if (inactivityModal) {
        inactivityModal.classList.add('hidden');
    }

    // Set warning timer (shows modal 60 seconds before logout)
    warningTimer = setTimeout(() => {
        showInactivityWarning();
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE_LOGOUT);

    // Set logout timer (logs out after full inactivity period)
    inactivityTimer = setTimeout(() => {
        showToast('You have been logged out due to inactivity', 'info');
        logout();
    }, INACTIVITY_TIMEOUT);
}

function showInactivityWarning() {
    const modal = document.getElementById('inactivityModal');
    const countdownEl = document.getElementById('countdownTimer');

    if (!modal || !countdownEl) {
        return; // Elements don't exist on this page
    }

    modal.classList.remove('hidden');

    let secondsLeft = 60;
    countdownEl.textContent = secondsLeft;

    // Update countdown every second
    countdownInterval = setInterval(() => {
        secondsLeft--;
        countdownEl.textContent = secondsLeft;

        if (secondsLeft <= 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);
}

// =====================================================
// USER MANAGEMENT
// =====================================================

function loadCompaniesList() {
    const companies = getCompanies();
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    Object.keys(companies).forEach(contactPerson => {
        const company = companies[contactPerson];
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-4 py-4 text-sm text-gray-900">${company.fullName || '-'}</td>
            <td class="px-4 py-4 text-sm text-gray-500">${company.contactPerson || contactPerson}</td>
            <td class="px-4 py-4 text-sm text-gray-500">${company.phone || '-'}</td>
            <td class="px-4 py-4 text-sm text-gray-500">${company.email || '-'}</td>
            <td class="px-4 py-4 text-center">
                <span class="${company.status === 'active' ? 'status-paid' : 'status-partial'}">${company.status || 'active'}</span>
            </td>
            <td class="px-4 py-4 text-center">
                <button onclick="editCompany('${contactPerson}')" class="text-blue-600 hover:text-blue-800 mr-2" title="Edit">
                    <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>
                <button onclick="deleteCompany('${contactPerson}')" class="text-red-600 hover:text-red-800" title="Delete">
                    <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showCreateUserModal() {
    document.getElementById('userModalTitle').textContent = 'Create User';
    document.getElementById('editingUserId').value = '';
    document.getElementById('userFullName').value = '';
    document.getElementById('userPhone').value = '';
    document.getElementById('userEmail').value = '';
    document.getElementById('userAddress').value = '';
    document.getElementById('userUsername').value = '';
    document.getElementById('userUsername').readOnly = false;
    document.getElementById('userPassword').value = '';
    document.getElementById('userPassword').required = true;
    document.getElementById('passwordHint').classList.add('hidden');
    document.getElementById('userModal').classList.remove('hidden');
}

function editCompany(contactPerson) {
    const companies = getCompanies();
    const company = companies[contactPerson];

    // Navigate to create user screen with pre-filled data
    navigateTo('create-user');
    
    // Wait for screen to load then fill form
    setTimeout(() => {
        document.getElementById('editingUserId').value = contactPerson;
        document.getElementById('userFullName').value = company.fullName || '';
        document.getElementById('userPhone').value = company.phone || '';
        document.getElementById('userEmail').value = company.email || '';
        document.getElementById('userAddress').value = company.address || '';
        document.getElementById('userUsername').value = company.contactPerson || contactPerson;
        document.getElementById('userUsername').readOnly = true;
    }, 100);
}

function deleteCompany(contactPerson) {
    if (confirm('Are you sure you want to delete this company?')) {
        const companies = getCompanies();
        delete companies[contactPerson];
        saveCompanies(companies);
        loadCompaniesList();
        showToast('Company deleted successfully!', 'success');
    }
}

function closeUserModal() {
    console.log('Closing user modal');
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.classList.add('hidden');
        console.log('Modal hidden class added');
    }
}

// =====================================================
// SALER MANAGEMENT FUNCTIONS
// =====================================================

function showCreateSalerModal() {
    document.getElementById('salerModalTitle').textContent = 'Create Saler';
    document.getElementById('editingSalerId').value = '';
    document.getElementById('salerFullName').value = '';
    document.getElementById('salerPhone').value = '';
    document.getElementById('salerEmail').value = '';
    document.getElementById('salerAddress').value = '';
    document.getElementById('salerModal').classList.remove('hidden');
}

function editSaler(salerId) {
    const salers = getSalers();
    const saler = salers[salerId];

    document.getElementById('salerModalTitle').textContent = 'Edit Saler';
    document.getElementById('editingSalerId').value = salerId;
    document.getElementById('salerFullName').value = saler.fullName || '';
    document.getElementById('salerPhone').value = saler.phone || '';
    document.getElementById('salerEmail').value = saler.email || '';
    document.getElementById('salerAddress').value = saler.address || '';
    document.getElementById('salerModal').classList.remove('hidden');
}

function closeSalerModal() {
    const modal = document.getElementById('salerModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function handleSalerForm(e) {
    e.preventDefault();

    const submitButton = document.querySelector('#salerForm button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
    }

    try {
        const editingId = document.getElementById('editingSalerId').value;
        const fullName = document.getElementById('salerFullName').value.trim();
        const phone = document.getElementById('salerPhone').value.trim();
        const email = document.getElementById('salerEmail').value.trim();
        const address = document.getElementById('salerAddress').value.trim();

        if (!fullName || !phone) {
            showToast('Please fill in all required fields', 'error');
            if (submitButton) submitButton.disabled = false;
            return;
        }

        const salers = getSalers();

        // Generate salerId if creating new
        let salerId = editingId || 'saler_' + Date.now();

        if (editingId) {
            salers[editingId].fullName = fullName;
            salers[editingId].phone = phone;
            salers[editingId].email = email;
            salers[editingId].address = address;
            salers[editingId].updatedAt = new Date().toISOString();
        } else {
            salers[salerId] = {
                fullName: fullName,
                phone: phone,
                email: email,
                address: address,
                createdAt: new Date().toISOString()
            };
        }

        saveSalers(salers);
        
        // Also add/update saler as a person for external transactions
        const people = getPeople();
        people[salerId] = {
            id: salerId,
            name: fullName,
            phone: phone,
            email: email,
            address: address
        };
        savePeople(people);
        
        document.getElementById('salerForm').reset();
        closeSalerModal();

        setTimeout(() => {
            loadSalersList();
            populatePeopleDropdowns();
            showToast(editingId ? 'Saler updated!' : 'Saler created!', 'success');
        }, 100);

    } catch (error) {
        console.error('ERROR:', error);
        showToast('Error: ' + error.message, 'error');
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
}

function loadSalersList() {
    const salers = getSalers();
    const userData = getUserData();
    const vouchers = userData.vouchers || [];
    const tbody = document.querySelector('#salersTable tbody');

    if (!tbody) return;

    tbody.innerHTML = '';

    Object.keys(salers).forEach((salerId, index) => {
        const saler = salers[salerId];
        
        // Calculate total income for this saler
        let totalIncome = 0;
        vouchers.forEach(voucher => {
            if (voucher.salerId === salerId) {
                totalIncome += voucher.netTotal || 0;
            }
        });
        
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 text-sm text-gray-800 font-medium">${saler.fullName}</td>
            <td class="px-6 py-4 text-sm text-gray-600">${saler.phone}</td>
            <td class="px-6 py-4 text-sm text-gray-600">${saler.email || '-'}</td>
            <td class="px-6 py-4 text-sm text-gray-600">${saler.address || '-'}</td>
            <td class="px-6 py-4 text-sm text-gray-900 text-right font-semibold text-green-600">${formatBDCurrency(totalIncome)}</td>
            <td class="px-6 py-4 text-sm text-right space-x-2">
                <button onclick="editSaler('${salerId}')" class="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                <button onclick="deleteSaler('${salerId}')" class="text-red-600 hover:text-red-800 font-medium">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function deleteSaler(salerId) {
    if (!confirm('Are you sure you want to delete this saler?')) {
        return;
    }

    const salers = getSalers();
    delete salers[salerId];
    saveSalers(salers);
    
    // Also remove saler from people
    const people = getPeople();
    delete people[salerId];
    savePeople(people);
    
    loadSalersList();
    populatePeopleDropdowns();
    showToast('Saler deleted!', 'success');
}

function populateSalersDropdown() {
    const select = document.getElementById('voucherSaler');
    if (!select) return;

    const salers = getSalers();
    const currentValue = select.value;

    // Clear existing options except the first one
    select.innerHTML = '<option value="">Select saler...</option>';

    Object.keys(salers).forEach(salerId => {
        const saler = salers[salerId];
        const option = document.createElement('option');
        option.value = salerId;
        option.textContent = saler.fullName;
        select.appendChild(option);
    });

    select.value = currentValue;
}

// =====================================================
// PERSON MANAGEMENT (For Income/Expense Transactions)
// =====================================================

function showCreatePersonModal() {
    document.getElementById('personModalTitle').textContent = 'Add Person';
    document.getElementById('editingPersonId').value = '';
    document.getElementById('personName').value = '';
    document.getElementById('personPhone').value = '';
    document.getElementById('personModal').classList.remove('hidden');
}

function editPerson(personId) {
    const people = getPeople();
    const person = people[personId];

    document.getElementById('personModalTitle').textContent = 'Edit Person';
    document.getElementById('editingPersonId').value = personId;
    document.getElementById('personName').value = person.name;
    document.getElementById('personPhone').value = person.phone || '';
    document.getElementById('personModal').classList.remove('hidden');
}

function closePersonModal() {
    document.getElementById('personModal').classList.add('hidden');
}

function handlePersonForm(e) {
    e.preventDefault();

    const submitButton = document.querySelector('#personForm button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
        const editingId = document.getElementById('editingPersonId').value;
        const name = document.getElementById('personName').value.trim();
        const phone = document.getElementById('personPhone').value.trim();

        if (!name) {
            showToast('Please enter person name', 'error');
            if (submitButton) submitButton.disabled = false;
            return;
        }

        const people = getPeople();

        if (editingId) {
            people[editingId].name = name;
            people[editingId].phone = phone;
            people[editingId].updatedAt = new Date().toISOString();
        } else {
            const personId = 'person_' + Date.now();
            people[personId] = {
                id: personId,
                name,
                phone,
                createdAt: new Date().toISOString()
            };
        }

        savePeople(people);
        document.getElementById('personForm').reset();
        closePersonModal();

        setTimeout(() => {
            loadPeopleList();
            populatePeopleDropdowns();
            showToast(editingId ? 'Person updated!' : 'Person added!', 'success');
        }, 100);

    } catch (error) {
        console.error('ERROR:', error);
        showToast('Error: ' + error.message, 'error');
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
}

function loadPeopleList() {
    const tbody = document.querySelector('#peopleTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const people = getPeople();

    Object.keys(people).forEach((personId, index) => {
        const person = people[personId];
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 text-sm text-gray-800 font-medium">${person.name}</td>
            <td class="px-6 py-4 text-sm text-gray-800">${person.phone || '-'}</td>
            <td class="px-6 py-4 text-sm text-right space-x-2">
                <button onclick="editPerson('${personId}')" class="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                <button onclick="deletePerson('${personId}')" class="text-red-600 hover:text-red-800 font-medium">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function deletePerson(personId) {
    if (!confirm('Are you sure you want to delete this person?')) {
        return;
    }

    const people = getPeople();
    delete people[personId];
    savePeople(people);
    loadPeopleList();
    populatePeopleDropdowns();
    showToast('Person deleted!', 'success');
}

function populatePeopleDropdowns() {
    const incomeSelect = document.getElementById('incomeReceivedBy');
    const expenseSelect = document.getElementById('expenseSpentBy');
    const incomeFilterSelect = document.getElementById('incomePersonFilter');
    const expenseFilterSelect = document.getElementById('expensePersonFilter');

    // Combine salers and people - salers are automatically included as people
    const people = getPeople();
    const salers = getSalers();
    const allPeople = { ...people };
    
    // Add salers as people if not already present
    Object.keys(salers).forEach(salerId => {
        const saler = salers[salerId];
        if (!allPeople[salerId]) {
            allPeople[salerId] = { id: salerId, name: saler.fullName, phone: saler.phone };
        }
    });
    
    const incomeValue = incomeSelect ? incomeSelect.value : '';
    const expenseValue = expenseSelect ? expenseSelect.value : '';
    const incomeFilterValue = incomeFilterSelect ? incomeFilterSelect.value : '';
    const expenseFilterValue = expenseFilterSelect ? expenseFilterSelect.value : '';

    // Populate income modal select
    if (incomeSelect) {
        incomeSelect.innerHTML = '<option value="">Select person...</option>';
        Object.keys(allPeople).sort().forEach(personId => {
            const person = allPeople[personId];
            const option = document.createElement('option');
            option.value = personId;
            option.textContent = person.name;
            incomeSelect.appendChild(option);
        });
        incomeSelect.value = incomeValue;
    }

    // Populate expense modal select
    if (expenseSelect) {
        expenseSelect.innerHTML = '<option value="">Select person...</option>';
        Object.keys(allPeople).sort().forEach(personId => {
            const person = allPeople[personId];
            const option = document.createElement('option');
            option.value = personId;
            option.textContent = person.name;
            expenseSelect.appendChild(option);
        });
        expenseSelect.value = expenseValue;
    }

    // Populate income filter select
    if (incomeFilterSelect) {
        incomeFilterSelect.innerHTML = '<option value="">All Persons</option>';
        Object.keys(allPeople).sort().forEach(personId => {
            const person = allPeople[personId];
            const option = document.createElement('option');
            option.value = person.name;
            option.textContent = person.name;
            incomeFilterSelect.appendChild(option);
        });
        incomeFilterSelect.value = incomeFilterValue;
    }

    // Populate expense filter select
    if (expenseFilterSelect) {
        expenseFilterSelect.innerHTML = '<option value="">All Persons</option>';
        Object.keys(allPeople).sort().forEach(personId => {
            const person = allPeople[personId];
            const option = document.createElement('option');
            option.value = person.name;
            option.textContent = person.name;
            expenseFilterSelect.appendChild(option);
        });
        expenseFilterSelect.value = expenseFilterValue;
    }
}

function showManagePeople() {
    hideAllScreens();
    const screen = document.getElementById('managePersonScreen');
    if (screen) {
        screen.classList.remove('hidden');
        loadPeopleList();
    }
}

// =====================================================
// EXTERNAL INCOME & EXPENSE MANAGEMENT
// =====================================================

function showCreateIncomeModal() {
    document.getElementById('incomeModalTitle').textContent = 'Add External Income';
    document.getElementById('editingIncomeId').value = '';
    document.getElementById('incomeDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('incomeDescription').value = '';
    document.getElementById('incomeSource').value = '';
    document.getElementById('incomeReceivedBy').value = '';
    document.getElementById('incomeAmount').value = '';
    document.getElementById('incomeComment').value = '';
    populatePeopleDropdowns();
    document.getElementById('incomeModal').classList.remove('hidden');
}

function editIncome(incomeId) {
    const incomeExpense = getExternalIncomeExpense();
    const income = incomeExpense.income.find(i => i.id === incomeId);

    document.getElementById('incomeModalTitle').textContent = 'Edit External Income';
    document.getElementById('editingIncomeId').value = incomeId;
    document.getElementById('incomeDate').value = income.date;
    document.getElementById('incomeDescription').value = income.description;
    document.getElementById('incomeSource').value = income.source || '';
    document.getElementById('incomeAmount').value = income.amount;
    document.getElementById('incomeComment').value = income.comment || '';
    populatePeopleDropdowns();
    document.getElementById('incomeReceivedBy').value = income.receivedByPersonId || '';
    document.getElementById('incomeModal').classList.remove('hidden');
}

function closeIncomeModal() {
    document.getElementById('incomeModal').classList.add('hidden');
    // Clear search when closing modal
    const searchInput = document.getElementById('incomeSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }
}

function handleIncomeForm(e) {
    e.preventDefault();

    const submitButton = document.querySelector('#incomeForm button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
        const editingId = document.getElementById('editingIncomeId').value;
        const date = document.getElementById('incomeDate').value;
        const description = document.getElementById('incomeDescription').value.trim();
        const source = document.getElementById('incomeSource').value.trim();
        const receivedByPersonId = document.getElementById('incomeReceivedBy').value;
        const amount = parseFloat(document.getElementById('incomeAmount').value) || 0;
        const comment = document.getElementById('incomeComment').value.trim();

        if (!date || !description || !source || !receivedByPersonId || amount <= 0) {
            showToast('Please fill in all required fields with valid data', 'error');
            if (submitButton) submitButton.disabled = false;
            return;
        }

        // Get person name for display
        const people = getPeople();
        const receivedByPerson = people[receivedByPersonId];
        const receivedByName = receivedByPerson ? receivedByPerson.name : '';

        const incomeExpense = getExternalIncomeExpense();

        if (editingId) {
            const index = incomeExpense.income.findIndex(i => i.id === editingId);
            if (index !== -1) {
                incomeExpense.income[index] = {
                    id: editingId,
                    date,
                    description,
                    source,
                    receivedByPersonId,
                    receivedByName,
                    amount,
                    comment,
                    updatedAt: new Date().toISOString()
                };
            }
        } else {
            incomeExpense.income.push({
                id: 'income_' + Date.now(),
                date,
                description,
                source,
                receivedByPersonId,
                receivedByName,
                amount,
                comment,
                createdAt: new Date().toISOString()
            });
        }

        saveExternalIncomeExpense(incomeExpense);
        document.getElementById('incomeForm').reset();
        closeIncomeModal();

        setTimeout(() => {
            loadExternalIncomeList();
            loadIncomeByPersonMonthly();
            loadBalanceByPersonMonthly();
            showToast(editingId ? 'Income updated!' : 'Income added!', 'success');
        }, 100);

    } catch (error) {
        console.error('ERROR:', error);
        showToast('Error: ' + error.message, 'error');
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
}

function loadExternalIncomeList() {
    const incomeExpense = getExternalIncomeExpense();
    const tbody = document.querySelector('#externalIncomeTableBody');

    if (!tbody) return;

    tbody.innerHTML = '';

    incomeExpense.income.forEach((income, index) => {
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 text-sm text-gray-800">${formatDate(income.date)}</td>
            <td class="px-6 py-4 text-sm text-gray-800 font-medium">${income.description}</td>
            <td class="px-6 py-4 text-sm text-gray-800">${income.source || '-'}</td>
            <td class="px-6 py-4 text-sm text-gray-800">${income.receivedByName || '-'}</td>
            <td class="px-6 py-4 text-sm text-gray-800 text-right font-semibold">${formatBDCurrency(income.amount)}</td>
            <td class="px-6 py-4 text-sm text-gray-600">${income.comment ? income.comment.substring(0, 30) + (income.comment.length > 30 ? '...' : '') : '-'}</td>
            <td class="px-6 py-4 text-sm text-right space-x-2">
                <button onclick="editIncome('${income.id}')" class="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                <button onclick="deleteIncome('${income.id}')" class="text-red-600 hover:text-red-800 font-medium">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function deleteIncome(incomeId) {
    if (!confirm('Are you sure you want to delete this income entry?')) {
        return;
    }

    const incomeExpense = getExternalIncomeExpense();
    incomeExpense.income = incomeExpense.income.filter(i => i.id !== incomeId);
    saveExternalIncomeExpense(incomeExpense);
    loadExternalIncomeList();
    loadIncomeByPersonMonthly();
    loadBalanceByPersonMonthly();
    showToast('Income deleted!', 'success');
}

function showCreateExpenseModal() {
    document.getElementById('expenseModalTitle').textContent = 'Add External Expense';
    document.getElementById('editingExpenseId').value = '';
    document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('expenseDescription').value = '';
    document.getElementById('expenseSource').value = '';
    document.getElementById('expenseSpentBy').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseComment').value = '';
    populatePeopleDropdowns();
    document.getElementById('expenseModal').classList.remove('hidden');
}

function editExpense(expenseId) {
    const incomeExpense = getExternalIncomeExpense();
    const expense = incomeExpense.expense.find(e => e.id === expenseId);

    document.getElementById('expenseModalTitle').textContent = 'Edit External Expense';
    document.getElementById('editingExpenseId').value = expenseId;
    document.getElementById('expenseDate').value = expense.date;
    document.getElementById('expenseDescription').value = expense.description;
    document.getElementById('expenseSource').value = expense.source || '';
    document.getElementById('expenseAmount').value = expense.amount;
    document.getElementById('expenseComment').value = expense.comment || '';
    populatePeopleDropdowns();
    document.getElementById('expenseSpentBy').value = expense.spentByPersonId || '';
    document.getElementById('expenseModal').classList.remove('hidden');
}

function closeExpenseModal() {
    document.getElementById('expenseModal').classList.add('hidden');
    // Clear search when closing modal
    const searchInput = document.getElementById('expenseSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }
}

function handleExpenseForm(e) {
    e.preventDefault();

    const submitButton = document.querySelector('#expenseForm button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
        const editingId = document.getElementById('editingExpenseId').value;
        const date = document.getElementById('expenseDate').value;
        const description = document.getElementById('expenseDescription').value.trim();
        const source = document.getElementById('expenseSource').value.trim();
        const spentByPersonId = document.getElementById('expenseSpentBy').value;
        const amount = parseFloat(document.getElementById('expenseAmount').value) || 0;
        const comment = document.getElementById('expenseComment').value.trim();

        if (!date || !description || !spentByPersonId || amount <= 0) {
            showToast('Please fill in all required fields with valid data', 'error');
            if (submitButton) submitButton.disabled = false;
            return;
        }

        // Get person name for display
        const people = getPeople();
        const spentByPerson = people[spentByPersonId];
        const spentByName = spentByPerson ? spentByPerson.name : '';

        const incomeExpense = getExternalIncomeExpense();

        if (editingId) {
            const index = incomeExpense.expense.findIndex(e => e.id === editingId);
            if (index !== -1) {
                incomeExpense.expense[index] = {
                    id: editingId,
                    date,
                    description,
                    source,
                    spentByPersonId,
                    spentByName,
                    amount,
                    comment,
                    updatedAt: new Date().toISOString()
                };
            }
        } else {
            incomeExpense.expense.push({
                id: 'expense_' + Date.now(),
                date,
                description,
                source,
                spentByPersonId,
                spentByName,
                amount,
                comment,
                createdAt: new Date().toISOString()
            });
        }

        saveExternalIncomeExpense(incomeExpense);
        document.getElementById('expenseForm').reset();
        closeExpenseModal();

        setTimeout(() => {
            loadExternalExpenseList();
            loadExpenseByPersonMonthly();
            loadBalanceByPersonMonthly();
            showToast(editingId ? 'Expense updated!' : 'Expense added!', 'success');
        }, 100);

    } catch (error) {
        console.error('ERROR:', error);
        showToast('Error: ' + error.message, 'error');
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
}

function loadExternalExpenseList() {
    const incomeExpense = getExternalIncomeExpense();
    const tbody = document.querySelector('#externalExpenseTableBody');

    if (!tbody) return;

    tbody.innerHTML = '';

    incomeExpense.expense.forEach((expense, index) => {
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 text-sm text-gray-800">${formatDate(expense.date)}</td>
            <td class="px-6 py-4 text-sm text-gray-800 font-medium">${expense.description}</td>
            <td class="px-6 py-4 text-sm text-gray-800">${expense.source || '-'}</td>
            <td class="px-6 py-4 text-sm text-gray-800">${expense.spentByName || '-'}</td>
            <td class="px-6 py-4 text-sm text-gray-800 text-right font-semibold">${formatBDCurrency(expense.amount)}</td>
            <td class="px-6 py-4 text-sm text-gray-600">${expense.comment ? expense.comment.substring(0, 30) + (expense.comment.length > 30 ? '...' : '') : '-'}</td>
            <td class="px-6 py-4 text-sm text-right space-x-2">
                <button onclick="editExpense('${expense.id}')" class="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                <button onclick="deleteExpense('${expense.id}')" class="text-red-600 hover:text-red-800 font-medium">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterIncomeTransactions() {
    const searchInput = document.getElementById('incomeSearchInput');
    const personFilterSelect = document.getElementById('incomePersonFilter');
    const monthFilterInput = document.getElementById('incomeMonthFilter');
    if (!searchInput) return;

    const searchTerm = searchInput.value.toLowerCase();
    const selectedPerson = personFilterSelect ? personFilterSelect.value : '';
    const selectedMonth = monthFilterInput ? monthFilterInput.value : '';

    const incomeExpense = getExternalIncomeExpense();
    const tbody = document.querySelector('#externalIncomeTableBody');

    if (!tbody) return;

    tbody.innerHTML = '';

    const filteredIncome = incomeExpense.income.filter(income => {
        const matchDescription = income.description.toLowerCase().includes(searchTerm);
        const matchSource = (income.source || '').toLowerCase().includes(searchTerm);
        const matchPerson = (income.receivedByName || '').toLowerCase().includes(searchTerm);
        const matchAmount = income.amount.toString().includes(searchTerm);
        const matchComment = (income.comment || '').toLowerCase().includes(searchTerm);

        const matchSearchTerm = matchDescription || matchSource || matchPerson || matchAmount || matchComment;

        // Apply person filter
        const matchPersonFilter = !selectedPerson || income.receivedByName === selectedPerson;

        // Apply month filter
        let matchMonthFilter = true;
        if (selectedMonth) {
            const incomeDate = new Date(income.date);
            const [year, month] = selectedMonth.split('-');
            matchMonthFilter = incomeDate.getMonth() === parseInt(month) - 1 && incomeDate.getFullYear() === parseInt(year);
        }

        return matchSearchTerm && matchPersonFilter && matchMonthFilter;
    });

    if (filteredIncome.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="7" class="px-6 py-4 text-center text-gray-500">No transactions match your search</td>';
        tbody.appendChild(row);
        return;
    }

    filteredIncome.forEach((income, index) => {
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 text-sm text-gray-800">${formatDate(income.date)}</td>
            <td class="px-6 py-4 text-sm text-gray-800 font-medium">${income.description}</td>
            <td class="px-6 py-4 text-sm text-gray-800">${income.source || '-'}</td>
            <td class="px-6 py-4 text-sm text-gray-800">${income.receivedByName || '-'}</td>
            <td class="px-6 py-4 text-sm text-gray-800 text-right font-semibold">${formatBDCurrency(income.amount)}</td>
            <td class="px-6 py-4 text-sm text-gray-600">${income.comment ? income.comment.substring(0, 30) + (income.comment.length > 30 ? '...' : '') : '-'}</td>
            <td class="px-6 py-4 text-sm text-right space-x-2">
                <button onclick="editIncome('${income.id}')" class="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                <button onclick="deleteIncome('${income.id}')" class="text-red-600 hover:text-red-800 font-medium">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterExpenseTransactions() {
    const searchInput = document.getElementById('expenseSearchInput');
    const personFilterSelect = document.getElementById('expensePersonFilter');
    const monthFilterInput = document.getElementById('expenseMonthFilter');
    if (!searchInput) return;

    const searchTerm = searchInput.value.toLowerCase();
    const selectedPerson = personFilterSelect ? personFilterSelect.value : '';
    const selectedMonth = monthFilterInput ? monthFilterInput.value : '';

    const incomeExpense = getExternalIncomeExpense();
    const tbody = document.querySelector('#externalExpenseTableBody');

    if (!tbody) return;

    tbody.innerHTML = '';

    const filteredExpense = incomeExpense.expense.filter(expense => {
        const matchDescription = expense.description.toLowerCase().includes(searchTerm);
        const matchSource = (expense.source || '').toLowerCase().includes(searchTerm);
        const matchPerson = (expense.spentByName || '').toLowerCase().includes(searchTerm);
        const matchAmount = expense.amount.toString().includes(searchTerm);
        const matchComment = (expense.comment || '').toLowerCase().includes(searchTerm);

        const matchSearchTerm = matchDescription || matchSource || matchPerson || matchAmount || matchComment;

        // Apply person filter
        const matchPersonFilter = !selectedPerson || expense.spentByName === selectedPerson;

        // Apply month filter
        let matchMonthFilter = true;
        if (selectedMonth) {
            const expenseDate = new Date(expense.date);
            const [year, month] = selectedMonth.split('-');
            matchMonthFilter = expenseDate.getMonth() === parseInt(month) - 1 && expenseDate.getFullYear() === parseInt(year);
        }

        return matchSearchTerm && matchPersonFilter && matchMonthFilter;
    });

    if (filteredExpense.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="7" class="px-6 py-4 text-center text-gray-500">No transactions match your search</td>';
        tbody.appendChild(row);
        return;
    }

    filteredExpense.forEach((expense, index) => {
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 text-sm text-gray-800">${formatDate(expense.date)}</td>
            <td class="px-6 py-4 text-sm text-gray-800 font-medium">${expense.description}</td>
            <td class="px-6 py-4 text-sm text-gray-800">${expense.source || '-'}</td>
            <td class="px-6 py-4 text-sm text-gray-800">${expense.spentByName || '-'}</td>
            <td class="px-6 py-4 text-sm text-gray-800 text-right font-semibold">${formatBDCurrency(expense.amount)}</td>
            <td class="px-6 py-4 text-sm text-gray-600">${expense.comment ? expense.comment.substring(0, 30) + (expense.comment.length > 30 ? '...' : '') : '-'}</td>
            <td class="px-6 py-4 text-sm text-right space-x-2">
                <button onclick="editExpense('${expense.id}')" class="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                <button onclick="deleteExpense('${expense.id}')" class="text-red-600 hover:text-red-800 font-medium">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function deleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense entry?')) {
        return;
    }

    const incomeExpense = getExternalIncomeExpense();
    incomeExpense.expense = incomeExpense.expense.filter(e => e.id !== expenseId);
    saveExternalIncomeExpense(incomeExpense);
    loadExternalExpenseList();
    loadExpenseByPersonMonthly();
    loadBalanceByPersonMonthly();
    showToast('Expense deleted!', 'success');
}

function loadIncomeByPersonMonthly() {
    const incomeExpense = getExternalIncomeExpense();
    const container = document.querySelector('#incomeByPersonContainer');
    if (!container) return;

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Group income by person for current month
    const incomeByPerson = {};
    incomeExpense.income.forEach(income => {
        const incomeDate = new Date(income.date);
        if (incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear) {
            const personName = income.receivedByName || 'Unknown';
            if (!incomeByPerson[personName]) {
                incomeByPerson[personName] = { amount: 0, count: 0 };
            }
            incomeByPerson[personName].amount += income.amount;
            incomeByPerson[personName].count += 1;
        }
    });

    container.innerHTML = '';

    if (Object.keys(incomeByPerson).length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">No income recorded this month</div>';
        return;
    }

    Object.keys(incomeByPerson).sort().forEach(personName => {
        const data = incomeByPerson[personName];
        const card = document.createElement('div');
        card.className = 'bg-emerald-50 rounded-lg shadow-md p-6 border-l-4 border-emerald-500';
        card.innerHTML = `
            <div class="flex items-start justify-between mb-4">
                <div>
                    <h5 class="text-lg font-semibold text-emerald-900">${personName}</h5>
                    <p class="text-sm text-emerald-700">${data.count} transaction${data.count !== 1 ? 's' : ''}</p>
                </div>
                <div class="text-right">
                    <p class="text-2xl font-bold text-emerald-600">${formatBDCurrency(data.amount)}</p>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function loadExpenseByPersonMonthly() {
    const incomeExpense = getExternalIncomeExpense();
    const container = document.querySelector('#expenseByPersonContainer');
    if (!container) return;

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Group expense by person for current month
    const expenseByPerson = {};
    incomeExpense.expense.forEach(expense => {
        const expenseDate = new Date(expense.date);
        if (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
            const personName = expense.spentByName || 'Unknown';
            if (!expenseByPerson[personName]) {
                expenseByPerson[personName] = { amount: 0, count: 0 };
            }
            expenseByPerson[personName].amount += expense.amount;
            expenseByPerson[personName].count += 1;
        }
    });

    container.innerHTML = '';

    if (Object.keys(expenseByPerson).length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">No expense recorded this month</div>';
        return;
    }

    Object.keys(expenseByPerson).sort().forEach(personName => {
        const data = expenseByPerson[personName];
        const card = document.createElement('div');
        card.className = 'bg-amber-50 rounded-lg shadow-md p-6 border-l-4 border-amber-500';
        card.innerHTML = `
            <div class="flex items-start justify-between mb-4">
                <div>
                    <h5 class="text-lg font-semibold text-amber-900">${personName}</h5>
                    <p class="text-sm text-amber-700">${data.count} transaction${data.count !== 1 ? 's' : ''}</p>
                </div>
                <div class="text-right">
                    <p class="text-2xl font-bold text-amber-600">${formatBDCurrency(data.amount)}</p>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function loadBalanceByPersonMonthly() {
    const incomeExpense = getExternalIncomeExpense();
    const container = document.querySelector('#balanceByPersonContainer');
    if (!container) return;

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get previous month
    const prevDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonth = prevDate.getMonth();
    const prevYear = prevDate.getFullYear();

    // Get all unique person names (both income and expense)
    const allPersons = new Set();
    const incomeByPerson = {};
    const expenseByPerson = {};
    const prevIncomeByPerson = {};
    const prevExpenseByPerson = {};

    // Group income by person for current month
    incomeExpense.income.forEach(income => {
        const incomeDate = new Date(income.date);
        if (incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear) {
            const personName = income.receivedByName || 'Unknown';
            allPersons.add(personName);
            if (!incomeByPerson[personName]) {
                incomeByPerson[personName] = 0;
            }
            incomeByPerson[personName] += income.amount;
        }
        // Also track previous month
        if (incomeDate.getMonth() === prevMonth && incomeDate.getFullYear() === prevYear) {
            const personName = income.receivedByName || 'Unknown';
            allPersons.add(personName);
            if (!prevIncomeByPerson[personName]) {
                prevIncomeByPerson[personName] = 0;
            }
            prevIncomeByPerson[personName] += income.amount;
        }
    });

    // Group expense by person for current month
    incomeExpense.expense.forEach(expense => {
        const expenseDate = new Date(expense.date);
        if (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
            const personName = expense.spentByName || 'Unknown';
            allPersons.add(personName);
            if (!expenseByPerson[personName]) {
                expenseByPerson[personName] = 0;
            }
            expenseByPerson[personName] += expense.amount;
        }
        // Also track previous month
        if (expenseDate.getMonth() === prevMonth && expenseDate.getFullYear() === prevYear) {
            const personName = expense.spentByName || 'Unknown';
            allPersons.add(personName);
            if (!prevExpenseByPerson[personName]) {
                prevExpenseByPerson[personName] = 0;
            }
            prevExpenseByPerson[personName] += expense.amount;
        }
    });

    container.innerHTML = '';

    if (allPersons.size === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">No transactions recorded this month</div>';
        return;
    }

    Array.from(allPersons).sort().forEach(personName => {
        const prevIncome = prevIncomeByPerson[personName] || 0;
        const prevExpense = prevExpenseByPerson[personName] || 0;
        const prevBalance = prevIncome - prevExpense;

        const income = incomeByPerson[personName] || 0;
        const expense = expenseByPerson[personName] || 0;
        const currentBalance = income - expense;

        const totalBalance = prevBalance + currentBalance;

        const card = document.createElement('div');
        const balanceColor = totalBalance > 0 ? 'blue' : totalBalance < 0 ? 'red' : 'gray';
        const borderColor = balanceColor === 'blue' ? 'border-blue-500' : balanceColor === 'red' ? 'border-red-500' : 'border-gray-500';
        const bgColor = balanceColor === 'blue' ? 'bg-blue-50' : balanceColor === 'red' ? 'bg-red-50' : 'bg-gray-50';
        const textColor = balanceColor === 'blue' ? 'text-blue-900' : balanceColor === 'red' ? 'text-red-900' : 'text-gray-900';
        const balanceTextColor = balanceColor === 'blue' ? 'text-blue-600' : balanceColor === 'red' ? 'text-red-600' : 'text-gray-600';

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const prevMonthName = monthNames[prevMonth];
        const currMonthName = monthNames[currentMonth];

        card.className = `${bgColor} rounded-lg shadow-md p-6 border-l-4 ${borderColor}`;
        card.innerHTML = `
            <div class="mb-4">
                <h5 class="text-lg font-semibold ${textColor}">${personName}</h5>
            </div>
            <div class="space-y-3 text-sm">
                <!-- Previous Month Balance -->
                <div class="pb-3 border-b border-gray-300">
                    <div class="text-xs font-semibold text-gray-500 mb-2">${prevMonthName} Balance</div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Previous:</span>
                        <span class="font-semibold text-purple-600">${formatBDCurrency(prevBalance)}</span>
                    </div>
                </div>
                
                <!-- Current Month Activity -->
                <div class="pb-3 border-b border-gray-300">
                    <div class="text-xs font-semibold text-gray-500 mb-2">${currMonthName} Activity</div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Income:</span>
                        <span class="font-semibold text-emerald-600">${formatBDCurrency(income)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Expense:</span>
                        <span class="font-semibold text-amber-600">${formatBDCurrency(expense)}</span>
                    </div>
                </div>
                
                <!-- Total Balance -->
                <div>
                    <div class="flex justify-between">
                        <span class="font-bold">Total Balance:</span>
                        <span class="text-xl font-bold ${balanceTextColor}">${formatBDCurrency(totalBalance)}</span>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function loadExternalTransactions() {
    // Load expense data and initialize the screen
    loadExternalExpenseList();
    updateExternalExpenseStats();
    loadExpenseByPersonMonthly();
    populatePeopleDropdowns();
}

function showPrintBalanceReportModal() {
    const modal = document.getElementById('printBalanceReportModal');
    if (modal) {
        modal.classList.remove('hidden');

        // Set default month to current month
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const defaultMonth = `${year}-${month}`;

        const monthInput = document.getElementById('printBalanceMonth');
        if (monthInput) monthInput.value = defaultMonth;

        // Populate person dropdown
        const userData = getUserData();
        const people = getPeople();
        const personSelect = document.getElementById('printBalancePerson');

        if (personSelect) {
            personSelect.innerHTML = '<option value="">All Persons</option>';
            Object.keys(people).forEach(personId => {
                const person = people[personId];
                const option = document.createElement('option');
                option.value = person.name;
                option.textContent = person.name;
                personSelect.appendChild(option);
            });
        }
    }
}

function closePrintBalanceReportModal() {
    const modal = document.getElementById('printBalanceReportModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function generateMonthlyBalanceReport() {
    const monthInput = document.getElementById('printBalanceMonth');
    const personSelect = document.getElementById('printBalancePerson');

    const selectedMonth = monthInput ? monthInput.value : '';
    const selectedPerson = personSelect ? personSelect.value : '';

    closePrintBalanceReportModal();
    printMonthlyBalanceReport(selectedMonth, selectedPerson);
}

function printMonthlyBalanceReport(selectedMonth, selectedPerson) {
    const userData = getUserData();
    const settings = userData.settings || {};
    const companyName = settings.companyName || 'Voucher System';
    const companyAddress = settings.companyAddress || '';
    const companyPhone = settings.companyPhone || '';
    const companyEmail = settings.companyEmail || '';

    const externalData = userData.externalIncomeExpense || { income: [], expense: [] };
    const people = getPeople();

    const now = new Date();
    let currentMonth = now.getMonth();
    let currentYear = now.getFullYear();

    // If a specific month is selected, use that instead
    if (selectedMonth) {
        const [year, month] = selectedMonth.split('-');
        currentMonth = parseInt(month) - 1;
        currentYear = parseInt(year);
    }

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const personNames = new Set();
    externalData.income.forEach(inc => {
        if (inc.receivedByName) personNames.add(inc.receivedByName);
    });
    externalData.expense.forEach(exp => {
        if (exp.spentByName) personNames.add(exp.spentByName);
    });

    let sortedPersonNames = Array.from(personNames).sort();

    // Filter by selected person if specified
    if (selectedPerson) {
        sortedPersonNames = sortedPersonNames.filter(name => name === selectedPerson);
    }

    let reportHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Monthly Balance Report</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    color: #333;
                    line-height: 1.6;
                    padding: 20px;
                    background: white;
                }
                
                .print-container {
                    max-width: 900px;
                    margin: 0 auto;
                    background: white;
                }
                
                .company-header {
                    text-align: center;
                    border-bottom: 2px solid #1f2937;
                    padding: 15px 0;
                    margin-bottom: 20px;
                }
                
                .company-name {
                    font-size: 24px;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 5px;
                }
                
                .company-info {
                    font-size: 12px;
                    color: #6b7280;
                    line-height: 1.4;
                }
                
                .header {
                    text-align: center;
                    border-bottom: 3px solid #1f2937;
                    padding: 20px 0 15px 0;
                    margin-bottom: 20px;
                }
                
                .header h1 {
                    font-size: 28px;
                    color: #1f2937;
                    margin-bottom: 5px;
                }
                
                .header p {
                    color: #6b7280;
                    font-size: 14px;
                }
                
                .report-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 25px;
                    padding: 10px;
                    background: #f9fafb;
                    border-radius: 4px;
                }
                
                .info-item {
                    font-size: 13px;
                }
                
                .info-label {
                    color: #6b7280;
                    font-weight: 600;
                }
                
                .info-value {
                    color: #1f2937;
                    margin-top: 2px;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                }
                
                thead {
                    background: #1f2937;
                    color: white;
                }
                
                th {
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 14px;
                    border: 1px solid #d1d5db;
                }
                
                td {
                    padding: 10px 12px;
                    border: 1px solid #d1d5db;
                    font-size: 13px;
                }
                
                tbody tr:nth-child(even) {
                    background: #f9fafb;
                }
                
                tbody tr:hover {
                    background: #f3f4f6;
                }
                
                .text-right {
                    text-align: right;
                }
                
                .text-center {
                    text-align: center;
                }
                
                .amount {
                    font-weight: 600;
                    font-family: 'Courier New', monospace;
                }
                
                .positive {
                    color: #059669;
                }
                
                .negative {
                    color: #dc2626;
                }
                
                .zero {
                    color: #6b7280;
                }
                
                .section-title {
                    font-size: 16px;
                    font-weight: 700;
                    color: #1f2937;
                    margin: 20px 0 15px 0;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #e5e7eb;
                }
                
                .footer {
                    margin-top: 30px;
                    padding-top: 15px;
                    border-top: 1px solid #d1d5db;
                    text-align: center;
                    font-size: 12px;
                    color: #6b7280;
                }
                
                @media print {
                    body {
                        padding: 0;
                        margin: 0;
                    }
                    
                    .print-container {
                        max-width: 100%;
                        margin: 0;
                    }
                    
                    page-break-inside: avoid;
                    
                    tr {
                        page-break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
            <div class="print-container">
                <div class="company-header">
                    <div class="company-name">${companyName}</div>
                    <div class="company-info">
                        ${companyAddress ? `<div>${companyAddress}</div>` : ''}
                        ${companyPhone ? `<div>Phone: ${companyPhone}</div>` : ''}
                        ${companyEmail ? `<div>Email: ${companyEmail}</div>` : ''}
                    </div>
                </div>
                
                <div class="header">
                    <h1>Monthly Balance Report by Person</h1>
                    <p>External Income & Expense Tracking</p>
                </div>
                
                <div class="report-info">
                    <div class="info-item">
                        <div class="info-label">Report Date</div>
                        <div class="info-value">${formatDate(now)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Reporting Period</div>
                        <div class="info-value">${monthNames[currentMonth]} ${currentYear}</div>
                    </div>
                    ${selectedPerson ? `<div class="info-item">
                        <div class="info-label">Person</div>
                        <div class="info-value">${selectedPerson}</div>
                    </div>` : ''}
                    <div class="info-item">
                        <div class="info-label">Total Persons</div>
                        <div class="info-value">${sortedPersonNames.length}</div>
                    </div>
                </div>
                
                <div class="section-title">Balance Summary</div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Person Name</th>
                            <th class="text-right">Previous Month Balance</th>
                            <th class="text-right">Current Month Income</th>
                            <th class="text-right">Current Month Expense</th>
                            <th class="text-right">Total Balance</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    let totalPreviousBalance = 0;
    let totalCurrentIncome = 0;
    let totalCurrentExpense = 0;
    let totalBalance = 0;

    sortedPersonNames.forEach(personName => {
        // Calculate previous month balance
        const prevIncomeAmount = externalData.income
            .filter(inc => {
                if (inc.receivedByName !== personName) return false;
                const incDate = new Date(inc.date);
                return incDate.getMonth() === previousMonth && incDate.getFullYear() === previousYear;
            })
            .reduce((sum, inc) => sum + (parseFloat(inc.amount) || 0), 0);

        const prevExpenseAmount = externalData.expense
            .filter(exp => {
                if (exp.spentByName !== personName) return false;
                const expDate = new Date(exp.date);
                return expDate.getMonth() === previousMonth && expDate.getFullYear() === previousYear;
            })
            .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

        const previousBalance = prevIncomeAmount - prevExpenseAmount;

        // Calculate current month activity
        const currentIncomeAmount = externalData.income
            .filter(inc => {
                if (inc.receivedByName !== personName) return false;
                const incDate = new Date(inc.date);
                return incDate.getMonth() === currentMonth && incDate.getFullYear() === currentYear;
            })
            .reduce((sum, inc) => sum + (parseFloat(inc.amount) || 0), 0);

        const currentExpenseAmount = externalData.expense
            .filter(exp => {
                if (exp.spentByName !== personName) return false;
                const expDate = new Date(exp.date);
                return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
            })
            .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

        const totalBalance2 = previousBalance + currentIncomeAmount - currentExpenseAmount;

        const balanceClass = totalBalance2 > 0 ? 'positive' : (totalBalance2 < 0 ? 'negative' : 'zero');

        reportHTML += `
                        <tr>
                            <td>${personName}</td>
                            <td class="text-right amount positive">${formatBDCurrency(previousBalance)}</td>
                            <td class="text-right amount positive">${formatBDCurrency(currentIncomeAmount)}</td>
                            <td class="text-right amount negative">${formatBDCurrency(currentExpenseAmount)}</td>
                            <td class="text-right amount ${balanceClass}">${formatBDCurrency(totalBalance2)}</td>
                        </tr>
        `;

        totalPreviousBalance += previousBalance;
        totalCurrentIncome += currentIncomeAmount;
        totalCurrentExpense += currentExpenseAmount;
        totalBalance += totalBalance2;
    });

    const totalsClass = totalBalance > 0 ? 'positive' : (totalBalance < 0 ? 'negative' : 'zero');

    reportHTML += `
                    </tbody>
                </table>
                
                <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 4px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px;">
                        <div>
                            <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">Total Previous Balance</div>
                            <div style="font-size: 18px; font-weight: 700; color: #059669;">${formatBDCurrency(totalPreviousBalance)}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">Total Current Income</div>
                            <div style="font-size: 18px; font-weight: 700; color: #059669;">${formatBDCurrency(totalCurrentIncome)}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">Total Current Expense</div>
                            <div style="font-size: 18px; font-weight: 700; color: #dc2626;">${formatBDCurrency(totalCurrentExpense)}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">Total Balance</div>
                            <div style="font-size: 18px; font-weight: 700; color: ${totalBalance > 0 ? '#059669' : (totalBalance < 0 ? '#dc2626' : '#6b7280')};">${formatBDCurrency(totalBalance)}</div>
                        </div>
                    </div>
                </div>
                
                <div class="footer">
                    <p>This report was automatically generated on ${formatDate(now)} at ${now.toLocaleTimeString()}</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '', 'height=600,width=900');
    printWindow.document.write(reportHTML);
    printWindow.document.close();

    setTimeout(() => {
        printWindow.print();
    }, 250);
}

function printIncomeTransactions() {
    const personFilterSelect = document.getElementById('incomePersonFilter');
    const monthFilterInput = document.getElementById('incomeMonthFilter');
    const searchInput = document.getElementById('incomeSearchInput');

    const selectedPerson = personFilterSelect ? personFilterSelect.value : '';
    const selectedMonth = monthFilterInput ? monthFilterInput.value : '';
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

    const userData = getUserData();
    const settings = userData.settings || {};
    const companyName = settings.companyName || 'Voucher System';
    const companyAddress = settings.companyAddress || '';
    const companyPhone = settings.companyPhone || '';
    const companyEmail = settings.companyEmail || '';

    const incomeExpense = getExternalIncomeExpense();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter transactions
    const filteredIncome = incomeExpense.income.filter(income => {
        const matchDescription = income.description.toLowerCase().includes(searchTerm);
        const matchSource = (income.source || '').toLowerCase().includes(searchTerm);
        const matchPerson = (income.receivedByName || '').toLowerCase().includes(searchTerm);
        const matchAmount = income.amount.toString().includes(searchTerm);
        const matchComment = (income.comment || '').toLowerCase().includes(searchTerm);

        const matchSearchTerm = !searchTerm || matchDescription || matchSource || matchPerson || matchAmount || matchComment;
        const matchPersonFilter = !selectedPerson || income.receivedByName === selectedPerson;

        let matchMonthFilter = true;
        if (selectedMonth) {
            const incomeDate = new Date(income.date);
            const [year, month] = selectedMonth.split('-');
            matchMonthFilter = incomeDate.getMonth() === parseInt(month) - 1 && incomeDate.getFullYear() === parseInt(year);
        }

        return matchSearchTerm && matchPersonFilter && matchMonthFilter;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    // Get month/year for report
    let reportMonth = currentMonth;
    let reportYear = currentYear;
    if (selectedMonth) {
        const [year, month] = selectedMonth.split('-');
        reportMonth = parseInt(month) - 1;
        reportYear = parseInt(year);
    }

    let reportHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Income Transaction Report</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    color: #333;
                    line-height: 1.6;
                    padding: 20px;
                    background: white;
                }
                
                .print-container {
                    max-width: 1000px;
                    margin: 0 auto;
                    background: white;
                }
                
                .company-header {
                    text-align: center;
                    border-bottom: 2px solid #1f2937;
                    padding: 15px 0;
                    margin-bottom: 20px;
                }
                
                .company-name {
                    font-size: 24px;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 5px;
                }
                
                .company-info {
                    font-size: 12px;
                    color: #6b7280;
                    line-height: 1.4;
                }
                
                .header {
                    text-align: center;
                    border-bottom: 3px solid #1f2937;
                    padding: 15px 0;
                    margin-bottom: 20px;
                }
                
                .header h1 {
                    font-size: 28px;
                    color: #1f2937;
                    margin-bottom: 5px;
                }
                
                .header p {
                    color: #6b7280;
                    font-size: 14px;
                    margin: 2px 0;
                }
                
                .report-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 25px;
                    padding: 10px;
                    background: #f9fafb;
                    border-radius: 4px;
                    flex-wrap: wrap;
                }
                
                .info-item {
                    font-size: 13px;
                    margin: 5px 15px;
                }
                
                .info-label {
                    color: #6b7280;
                    font-weight: 600;
                }
                
                .info-value {
                    color: #1f2937;
                    margin-top: 2px;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                }
                
                thead {
                    background: #10b981;
                    color: white;
                }
                
                th {
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 14px;
                    border: 1px solid #d1d5db;
                }
                
                td {
                    padding: 10px 12px;
                    border: 1px solid #d1d5db;
                    font-size: 13px;
                }
                
                tbody tr:nth-child(even) {
                    background: #f9fafb;
                }
                
                .text-right {
                    text-align: right;
                }
                
                .amount {
                    font-weight: 600;
                    font-family: 'Courier New', monospace;
                    color: #059669;
                }
                
                .total-row {
                    background: #ecfdf5;
                    font-weight: 700;
                }
                
                .total-row td {
                    border-top: 2px solid #10b981;
                }
                
                .footer {
                    margin-top: 30px;
                    padding-top: 15px;
                    border-top: 1px solid #d1d5db;
                    text-align: center;
                    font-size: 12px;
                    color: #6b7280;
                }
                
                @media print {
                    body {
                        padding: 0;
                        margin: 0;
                    }
                    
                    .print-container {
                        max-width: 100%;
                        margin: 0;
                    }
                    
                    tr {
                        page-break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
            <div class="print-container">
                <div class="company-header">
                    <div class="company-name">${companyName}</div>
                    <div class="company-info">
                        ${companyAddress ? `<div>${companyAddress}</div>` : ''}
                        ${companyPhone ? `<div>Phone: ${companyPhone}</div>` : ''}
                        ${companyEmail ? `<div>Email: ${companyEmail}</div>` : ''}
                    </div>
                </div>
                
                <div class="header">
                    <h1>Income Transaction Report</h1>
                    <p>Detailed Income Entries</p>
                </div>
                
                <div class="report-info">
                    <div class="info-item">
                        <div class="info-label">Report Date</div>
                        <div class="info-value">${formatDate(now)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Period</div>
                        <div class="info-value">${monthNames[reportMonth]} ${reportYear}</div>
                    </div>
                    ${selectedPerson ? `<div class="info-item">
                        <div class="info-label">Person</div>
                        <div class="info-value">${selectedPerson}</div>
                    </div>` : ''}
                    <div class="info-item">
                        <div class="info-label">Total Transactions</div>
                        <div class="info-value">${filteredIncome.length}</div>
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Source</th>
                            <th>Received By</th>
                            <th class="text-right">Amount (৳)</th>
                            <th>Comment</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    let totalAmount = 0;
    if (filteredIncome.length === 0) {
        reportHTML += `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #6b7280;">No income transactions found for the selected filters</td></tr>`;
    } else {
        filteredIncome.forEach((income, index) => {
            reportHTML += `
                        <tr>
                            <td>${formatDate(income.date)}</td>
                            <td>${income.description}</td>
                            <td>${income.source || '-'}</td>
                            <td>${income.receivedByName || '-'}</td>
                            <td class="text-right amount">${formatBDCurrency(income.amount)}</td>
                            <td>${income.comment ? income.comment.substring(0, 50) + (income.comment.length > 50 ? '...' : '') : '-'}</td>
                        </tr>
            `;
            totalAmount += parseFloat(income.amount) || 0;
        });

        reportHTML += `
                        <tr class="total-row">
                            <td colspan="4" style="text-align: right;">TOTAL:</td>
                            <td class="text-right" style="color: #059669;">${formatBDCurrency(totalAmount)}</td>
                            <td></td>
                        </tr>
        `;
    }

    reportHTML += `
                    </tbody>
                </table>
                
                <div class="footer">
                    <p>This report was automatically generated on ${formatDate(now)} at ${now.toLocaleTimeString()}</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '', 'height=600,width=900');
    printWindow.document.write(reportHTML);
    printWindow.document.close();

    setTimeout(() => {
        printWindow.print();
    }, 250);
}

function printExpenseTransactions() {
    const personFilterSelect = document.getElementById('expensePersonFilter');
    const monthFilterInput = document.getElementById('expenseMonthFilter');
    const searchInput = document.getElementById('expenseSearchInput');

    const selectedPerson = personFilterSelect ? personFilterSelect.value : '';
    const selectedMonth = monthFilterInput ? monthFilterInput.value : '';
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

    const userData = getUserData();
    const settings = userData.settings || {};
    const companyName = settings.companyName || 'Voucher System';
    const companyAddress = settings.companyAddress || '';
    const companyPhone = settings.companyPhone || '';
    const companyEmail = settings.companyEmail || '';

    const incomeExpense = getExternalIncomeExpense();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter transactions
    const filteredExpense = incomeExpense.expense.filter(expense => {
        const matchDescription = expense.description.toLowerCase().includes(searchTerm);
        const matchSource = (expense.source || '').toLowerCase().includes(searchTerm);
        const matchPerson = (expense.spentByName || '').toLowerCase().includes(searchTerm);
        const matchAmount = expense.amount.toString().includes(searchTerm);
        const matchComment = (expense.comment || '').toLowerCase().includes(searchTerm);

        const matchSearchTerm = !searchTerm || matchDescription || matchSource || matchPerson || matchAmount || matchComment;
        const matchPersonFilter = !selectedPerson || expense.spentByName === selectedPerson;

        let matchMonthFilter = true;
        if (selectedMonth) {
            const expenseDate = new Date(expense.date);
            const [year, month] = selectedMonth.split('-');
            matchMonthFilter = expenseDate.getMonth() === parseInt(month) - 1 && expenseDate.getFullYear() === parseInt(year);
        }

        return matchSearchTerm && matchPersonFilter && matchMonthFilter;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    // Get month/year for report
    let reportMonth = currentMonth;
    let reportYear = currentYear;
    if (selectedMonth) {
        const [year, month] = selectedMonth.split('-');
        reportMonth = parseInt(month) - 1;
        reportYear = parseInt(year);
    }

    let reportHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Expense Transaction Report</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    color: #333;
                    line-height: 1.6;
                    padding: 20px;
                    background: white;
                }
                
                .print-container {
                    max-width: 1000px;
                    margin: 0 auto;
                    background: white;
                }
                
                .company-header {
                    text-align: center;
                    border-bottom: 2px solid #1f2937;
                    padding: 15px 0;
                    margin-bottom: 20px;
                }
                
                .company-name {
                    font-size: 24px;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 5px;
                }
                
                .company-info {
                    font-size: 12px;
                    color: #6b7280;
                    line-height: 1.4;
                }
                
                .header {
                    text-align: center;
                    border-bottom: 3px solid #1f2937;
                    padding: 15px 0;
                    margin-bottom: 20px;
                }
                
                .header h1 {
                    font-size: 28px;
                    color: #1f2937;
                    margin-bottom: 5px;
                }
                
                .header p {
                    color: #6b7280;
                    font-size: 14px;
                    margin: 2px 0;
                }
                
                .report-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 25px;
                    padding: 10px;
                    background: #f9fafb;
                    border-radius: 4px;
                    flex-wrap: wrap;
                }
                
                .info-item {
                    font-size: 13px;
                    margin: 5px 15px;
                }
                
                .info-label {
                    color: #6b7280;
                    font-weight: 600;
                }
                
                .info-value {
                    color: #1f2937;
                    margin-top: 2px;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                }
                
                thead {
                    background: #f59e0b;
                    color: white;
                }
                
                th {
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 14px;
                    border: 1px solid #d1d5db;
                }
                
                td {
                    padding: 10px 12px;
                    border: 1px solid #d1d5db;
                    font-size: 13px;
                }
                
                tbody tr:nth-child(even) {
                    background: #f9fafb;
                }
                
                .text-right {
                    text-align: right;
                }
                
                .amount {
                    font-weight: 600;
                    font-family: 'Courier New', monospace;
                    color: #dc2626;
                }
                
                .total-row {
                    background: #fef2f2;
                    font-weight: 700;
                }
                
                .total-row td {
                    border-top: 2px solid #f59e0b;
                }
                
                .footer {
                    margin-top: 30px;
                    padding-top: 15px;
                    border-top: 1px solid #d1d5db;
                    text-align: center;
                    font-size: 12px;
                    color: #6b7280;
                }
                
                @media print {
                    body {
                        padding: 0;
                        margin: 0;
                    }
                    
                    .print-container {
                        max-width: 100%;
                        margin: 0;
                    }
                    
                    tr {
                        page-break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
            <div class="print-container">
                <div class="company-header">
                    <div class="company-name">${companyName}</div>
                    <div class="company-info">
                        ${companyAddress ? `<div>${companyAddress}</div>` : ''}
                        ${companyPhone ? `<div>Phone: ${companyPhone}</div>` : ''}
                        ${companyEmail ? `<div>Email: ${companyEmail}</div>` : ''}
                    </div>
                </div>
                
                <div class="header">
                    <h1>Expense Transaction Report</h1>
                    <p>Detailed Expense Entries</p>
                </div>
                
                <div class="report-info">
                    <div class="info-item">
                        <div class="info-label">Report Date</div>
                        <div class="info-value">${formatDate(now)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Period</div>
                        <div class="info-value">${monthNames[reportMonth]} ${reportYear}</div>
                    </div>
                    ${selectedPerson ? `<div class="info-item">
                        <div class="info-label">Person</div>
                        <div class="info-value">${selectedPerson}</div>
                    </div>` : ''}
                    <div class="info-item">
                        <div class="info-label">Total Transactions</div>
                        <div class="info-value">${filteredExpense.length}</div>
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Source</th>
                            <th>Spent By</th>
                            <th class="text-right">Amount (৳)</th>
                            <th>Comment</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    let totalAmount = 0;
    if (filteredExpense.length === 0) {
        reportHTML += `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #6b7280;">No expense transactions found for the selected filters</td></tr>`;
    } else {
        filteredExpense.forEach((expense, index) => {
            reportHTML += `
                        <tr>
                            <td>${formatDate(expense.date)}</td>
                            <td>${expense.description}</td>
                            <td>${expense.source || '-'}</td>
                            <td>${expense.spentByName || '-'}</td>
                            <td class="text-right amount">${formatBDCurrency(expense.amount)}</td>
                            <td>${expense.comment ? expense.comment.substring(0, 50) + (expense.comment.length > 50 ? '...' : '') : '-'}</td>
                        </tr>
            `;
            totalAmount += parseFloat(expense.amount) || 0;
        });

        reportHTML += `
                        <tr class="total-row">
                            <td colspan="4" style="text-align: right;">TOTAL:</td>
                            <td class="text-right" style="color: #dc2626;">${formatBDCurrency(totalAmount)}</td>
                            <td></td>
                        </tr>
        `;
    }

    reportHTML += `
                    </tbody>
                </table>
                
                <div class="footer">
                    <p>This report was automatically generated on ${formatDate(now)} at ${now.toLocaleTimeString()}</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '', 'height=600,width=900');
    printWindow.document.write(reportHTML);
    printWindow.document.close();

    setTimeout(() => {
        printWindow.print();
    }, 250);
}

function switchExternalTab(tab) {
    const incomeSection = document.getElementById('incomeSection');
    const expenseSection = document.getElementById('expenseSection');
    const incomeTabBtn = document.getElementById('incomeTabBtn');
    const expenseTabBtn = document.getElementById('expenseTabBtn');

    if (tab === 'income') {
        incomeSection.classList.remove('hidden');
        expenseSection.classList.add('hidden');
        incomeTabBtn.classList.remove('bg-gray-200', 'text-gray-700');
        incomeTabBtn.classList.add('bg-emerald-600', 'text-white');
        expenseTabBtn.classList.remove('bg-emerald-600', 'text-white');
        expenseTabBtn.classList.add('bg-gray-200', 'text-gray-700');
    } else {
        incomeSection.classList.add('hidden');
        expenseSection.classList.remove('hidden');
        incomeTabBtn.classList.remove('bg-emerald-600', 'text-white');
        incomeTabBtn.classList.add('bg-gray-200', 'text-gray-700');
        expenseTabBtn.classList.remove('bg-gray-200', 'text-gray-700');
        expenseTabBtn.classList.add('bg-emerald-600', 'text-white');
    }
}

function handleUserForm(e) {
    console.log('handleUserForm called');

    if (e) {
        e.preventDefault();
    }

    // Prevent double submission - check both possible forms
    const submitButton = e.target.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
    }

    try {
        console.log('Step 1: Getting form values');
        const editingId = document.getElementById('editingUserId').value;
        const fullName = document.getElementById('userFullName').value.trim();
        const phone = document.getElementById('userPhone').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const address = document.getElementById('userAddress').value.trim();
        const username = document.getElementById('userUsername').value.trim();
        const password = document.getElementById('userPassword').value;

        console.log('Step 2: Validating fields');
        if (!fullName || !phone || !username) {
            console.log('Missing required fields');
            showToast('Please fill in all required fields', 'error');
            if (submitButton) submitButton.disabled = false;
            return;
        }

        console.log('Step 3: Getting companies from storage');
        const companies = getCompanies();
        console.log('Step 4: Got companies, count:', Object.keys(companies).length);

        if (!editingId && companies[username]) {
            console.log('Company already exists');
            showToast('Company with this contact person already exists!', 'error');
            if (submitButton) submitButton.disabled = false;
            return;
        }

        console.log('Step 5: Creating/updating company object');
        if (editingId) {
            companies[username].fullName = fullName;
            companies[username].phone = phone;
            companies[username].email = email;
            companies[username].address = address;
        } else {
            companies[username] = {
                fullName: fullName,
                phone: phone,
                email: email,
                address: address,
                contactPerson: username,
                status: 'active',
                createdAt: new Date().toISOString()
            };
        }

        console.log('Step 6: Saving companies');
        saveCompanies(companies);
        console.log('Step 7: Companies saved');

        console.log('Step 8: Clearing form');
        e.target.reset();

        console.log('Step 9: Navigating back or closing modal');
        // Check if we're in the full-page create user screen or modal
        const createUserScreen = document.getElementById('createUserScreen');
        if (createUserScreen && !createUserScreen.classList.contains('hidden')) {
            // We're in the full-page screen, navigate back to companies
            navigateTo('companies');
        } else {
            // We're in the modal, close it
            closeUserModal();
        }

        console.log('Step 10: Scheduling list reload');
        setTimeout(function () {
            console.log('Step 11: Loading company list');
            loadCompaniesList();
            console.log('Step 12: Showing toast');
            showToast(editingId ? 'Company updated!' : 'Company created!', 'success');
            console.log('Step 13: Done');
        }, 100);

    } catch (error) {
        console.error('ERROR:', error);
        console.error('Stack:', error.stack);
        showToast('Error: ' + error.message, 'error');
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
}

function deleteUser(username) {
    if (username === 'admin') {
        showToast('Cannot delete super admin!', 'error');
        return;
    }

    if (!confirm('Are you sure you want to delete this user? All their data will be lost.')) return;

    const users = getUsers();
    delete users[username];
    saveUsers(users);

    localStorage.removeItem(APP_PREFIX + 'user_' + username);

    loadUsersList();
    showToast('User deleted!', 'success');
}

// =====================================================
// SETTINGS MANAGEMENT
// =====================================================

function updateOpacityDisplay(value) {
    document.getElementById('opacityValue').textContent = value + '%';
}

function updateHeaderLogoSizeDisplay(value) {
    document.getElementById('headerLogoSizeValue').textContent = value + 'px';
}

function updateHeaderLogoVerticalDisplay(value) {
    document.getElementById('headerLogoVerticalValue').textContent = value + '%';
}

function updateWatermarkSizeDisplay(value) {
    document.getElementById('watermarkSizeValue').textContent = value + '%';
}

function updateWatermarkVerticalDisplay(value) {
    document.getElementById('watermarkVerticalValue').textContent = value + '%';
}

function updateSignatureSizeDisplay(value) {
    document.getElementById('signatureSizeValue').textContent = value + 'px';
}

function updateSignatureHorizontalDisplay(value) {
    document.getElementById('signatureHorizontalValue').textContent = value + '%';
}

function updatePaidSealSizeDisplay(value) {
    document.getElementById('paidSealSizeValue').textContent = value + 'px';
}

function updatePaidSealOpacityDisplay(value) {
    document.getElementById('paidSealOpacityValue').textContent = value + '%';
}

function updatePaidSealHorizontalDisplay(value) {
    document.getElementById('paidSealHorizontalValue').textContent = value + '%';
}

function updatePaidSealVerticalDisplay(value) {
    document.getElementById('paidSealVerticalValue').textContent = value + '%';
}

function updateDueSealSizeDisplay(value) {
    document.getElementById('dueSealSizeValue').textContent = value + 'px';
}

function updateDueSealOpacityDisplay(value) {
    document.getElementById('dueSealOpacityValue').textContent = value + '%';
}

function updateDueSealHorizontalDisplay(value) {
    document.getElementById('dueSealHorizontalValue').textContent = value + '%';
}

function updateDueSealVerticalDisplay(value) {
    document.getElementById('dueSealVerticalValue').textContent = value + '%';
}

function loadSettings() {
    const userData = getUserData();
    const settings = userData.settings || {};

    // Company info
    document.getElementById('companyName').value = settings.companyName || '';
    document.getElementById('companyShortName').value = settings.companyShortName || '';
    document.getElementById('companyAddress').value = settings.companyAddress || '';
    document.getElementById('companyPhone').value = settings.companyPhone || '';
    document.getElementById('companyEmail').value = settings.companyEmail || '';
    document.getElementById('companyWebsite').value = settings.companyWebsite || '';

    // Header logo
    document.getElementById('showHeaderLogo').checked = settings.showHeaderLogo !== false;
    document.getElementById('headerLogoSize').value = settings.headerLogoSize || 40;
    document.getElementById('headerLogoSizeValue').textContent = (settings.headerLogoSize || 40) + 'px';
    document.getElementById('headerLogoVertical').value = settings.headerLogoVertical || 0;
    document.getElementById('headerLogoVerticalValue').textContent = (settings.headerLogoVertical || 0) + '%';

    const headerPos = settings.headerLogoPosition || 'left';
    document.querySelector(`input[name="headerLogoPosition"][value="${headerPos}"]`).checked = true;

    if (settings.headerLogo) {
        document.getElementById('headerLogoPreview').src = settings.headerLogo;
        document.getElementById('headerLogoPreviewContainer').classList.remove('hidden');
    } else {
        document.getElementById('headerLogoPreviewContainer').classList.add('hidden');
    }

    // Watermark
    document.getElementById('showWatermark').checked = settings.showWatermark !== false;
    document.getElementById('watermarkSize').value = settings.watermarkSize || 40;
    document.getElementById('watermarkSizeValue').textContent = (settings.watermarkSize || 40) + '%';
    document.getElementById('watermarkOpacity').value = settings.watermarkOpacity || 8;
    document.getElementById('opacityValue').textContent = (settings.watermarkOpacity || 8) + '%';
    document.getElementById('watermarkVertical').value = settings.watermarkVertical || 50;
    document.getElementById('watermarkVerticalValue').textContent = (settings.watermarkVertical || 50) + '%';

    const watermarkHPos = settings.watermarkHPosition || 'center';
    document.querySelector(`input[name="watermarkHPosition"][value="${watermarkHPos}"]`).checked = true;

    if (settings.watermarkLogo) {
        document.getElementById('watermarkLogoPreview').src = settings.watermarkLogo;
        document.getElementById('watermarkLogoPreviewContainer').classList.remove('hidden');
    } else {
        document.getElementById('watermarkLogoPreviewContainer').classList.add('hidden');
    }

    // Signature
    document.getElementById('showSignature').checked = settings.showSignature === true;
    document.getElementById('signatureSize').value = settings.signatureSize || 60;
    document.getElementById('signatureSizeValue').textContent = (settings.signatureSize || 60) + 'px';
    document.getElementById('signatureHorizontal').value = settings.signatureHorizontal || 50;
    document.getElementById('signatureHorizontalValue').textContent = (settings.signatureHorizontal || 50) + '%';

    if (settings.signature) {
        document.getElementById('signaturePreview').src = settings.signature;
        document.getElementById('signaturePreviewContainer').classList.remove('hidden');
    } else {
        document.getElementById('signaturePreviewContainer').classList.add('hidden');
    }

    // Paid Seal
    document.getElementById('paidSealSize').value = settings.paidSealSize || 80;
    document.getElementById('paidSealSizeValue').textContent = (settings.paidSealSize || 80) + 'px';
    document.getElementById('paidSealOpacity').value = settings.paidSealOpacity || 70;
    document.getElementById('paidSealOpacityValue').textContent = (settings.paidSealOpacity || 70) + '%';
    document.getElementById('paidSealHorizontal').value = settings.paidSealHorizontal || 75;
    document.getElementById('paidSealHorizontalValue').textContent = (settings.paidSealHorizontal || 75) + '%';
    document.getElementById('paidSealVertical').value = settings.paidSealVertical || 60;
    document.getElementById('paidSealVerticalValue').textContent = (settings.paidSealVertical || 60) + '%';

    if (settings.paidSeal) {
        document.getElementById('paidSealPreview').src = settings.paidSeal;
        document.getElementById('paidSealPreviewContainer').classList.remove('hidden');
    } else {
        document.getElementById('paidSealPreviewContainer').classList.add('hidden');
    }

    // Due Seal
    document.getElementById('dueSealSize').value = settings.dueSealSize || 80;
    document.getElementById('dueSealSizeValue').textContent = (settings.dueSealSize || 80) + 'px';
    document.getElementById('dueSealOpacity').value = settings.dueSealOpacity || 70;
    document.getElementById('dueSealOpacityValue').textContent = (settings.dueSealOpacity || 70) + '%';
    document.getElementById('dueSealHorizontal').value = settings.dueSealHorizontal || 75;
    document.getElementById('dueSealHorizontalValue').textContent = (settings.dueSealHorizontal || 75) + '%';
    document.getElementById('dueSealVertical').value = settings.dueSealVertical || 60;
    document.getElementById('dueSealVerticalValue').textContent = (settings.dueSealVertical || 60) + '%';

    if (settings.dueSeal) {
        document.getElementById('dueSealPreview').src = settings.dueSeal;
        document.getElementById('dueSealPreviewContainer').classList.remove('hidden');
    } else {
        document.getElementById('dueSealPreviewContainer').classList.add('hidden');
    }
}

function handleSettingsSave(e) {
    e.preventDefault();

    const userData = getUserData();
    const headerLogoPosition = document.querySelector('input[name="headerLogoPosition"]:checked')?.value || 'left';
    const watermarkHPosition = document.querySelector('input[name="watermarkHPosition"]:checked')?.value || 'center';

    userData.settings = {
        ...userData.settings,
        companyName: document.getElementById('companyName').value,
        companyShortName: document.getElementById('companyShortName').value,
        companyAddress: document.getElementById('companyAddress').value,
        companyPhone: document.getElementById('companyPhone').value,
        companyEmail: document.getElementById('companyEmail').value,
        companyWebsite: document.getElementById('companyWebsite').value,
        showHeaderLogo: document.getElementById('showHeaderLogo').checked,
        showWatermark: document.getElementById('showWatermark').checked,
        showSignature: document.getElementById('showSignature').checked,
        headerLogoSize: parseInt(document.getElementById('headerLogoSize').value) || 40,
        headerLogoPosition: headerLogoPosition,
        headerLogoVertical: parseInt(document.getElementById('headerLogoVertical').value) || 0,
        watermarkSize: parseInt(document.getElementById('watermarkSize').value) || 40,
        watermarkOpacity: parseInt(document.getElementById('watermarkOpacity').value) || 8,
        watermarkHPosition: watermarkHPosition,
        watermarkVertical: parseInt(document.getElementById('watermarkVertical').value) || 50,
        signatureSize: parseInt(document.getElementById('signatureSize').value) || 60,
        signatureHorizontal: parseInt(document.getElementById('signatureHorizontal').value) || 50,
        paidSealSize: parseInt(document.getElementById('paidSealSize').value) || 80,
        paidSealOpacity: parseInt(document.getElementById('paidSealOpacity').value) || 70,
        paidSealHorizontal: parseInt(document.getElementById('paidSealHorizontal').value) || 75,
        paidSealVertical: parseInt(document.getElementById('paidSealVertical').value) || 60,
        dueSealSize: parseInt(document.getElementById('dueSealSize').value) || 80,
        dueSealOpacity: parseInt(document.getElementById('dueSealOpacity').value) || 70,
        dueSealHorizontal: parseInt(document.getElementById('dueSealHorizontal').value) || 75,
        dueSealVertical: parseInt(document.getElementById('dueSealVertical').value) || 60
    };

    saveUserData(userData);
    showToast('Settings saved successfully!', 'success');
    showDashboard();
}

function loadSiteSettings() {
    const userData = getUserData() || {};
    const settings = userData.settings || {};

    // Logo type
    const useText = !!settings.siteHeaderLogoUseText;
    document.querySelectorAll('input[name="siteHeaderLogoType"]').forEach(r => r.checked = (r.value === (useText ? 'text' : 'image')));

    // Image preview
    if (settings.siteHeaderLogo) {
        const preview = document.getElementById('siteHeaderLogoPreview');
        preview.src = settings.siteHeaderLogo;
        document.getElementById('siteHeaderLogoPreviewContainer').classList.remove('hidden');
    } else {
        document.getElementById('siteHeaderLogoPreviewContainer').classList.add('hidden');
    }

    // Size
    document.getElementById('siteHeaderLogoSize').value = settings.siteHeaderLogoSize || 40;
    document.getElementById('siteHeaderLogoSizeValue').textContent = (settings.siteHeaderLogoSize || 40) + 'px';

    // Text option
    document.getElementById('siteHeaderText').value = settings.siteHeaderText || '';
    document.getElementById('siteHeaderTextPreview').textContent = settings.siteHeaderText || '';

    // Show checkbox
    document.getElementById('siteShowHeaderLogo').checked = !!settings.siteShowHeaderLogo;

    // Site title
    document.getElementById('siteTitle').value = settings.siteTitle || 'BazarPOS';

    // Favicon
    if (settings.favicon) {
        const preview = document.getElementById('faviconPreview');
        preview.src = settings.favicon;
        document.getElementById('faviconPreviewContainer').classList.remove('hidden');
    } else {
        document.getElementById('faviconPreviewContainer').classList.add('hidden');
    }

    // Toggle sections
    updateSiteHeaderSections();
    // Update site header display across the app
    updateSiteHeaderDisplay();
}

function handleSiteSettingsSave(e) {
    e.preventDefault();
    const userData = getUserData();
    userData.settings = userData.settings || {};

    const selected = document.querySelector('input[name="siteHeaderLogoType"]:checked')?.value || 'image';
    userData.settings.siteHeaderLogoUseText = (selected === 'text');
    userData.settings.siteHeaderText = document.getElementById('siteHeaderText').value || '';
    userData.settings.siteHeaderLogoSize = parseInt(document.getElementById('siteHeaderLogoSize').value) || 40;
    userData.settings.siteShowHeaderLogo = document.getElementById('siteShowHeaderLogo').checked;
    userData.settings.siteTitle = document.getElementById('siteTitle').value || 'BazarPOS';

    saveUserData(userData);
    showToast('Site settings saved!', 'success');
    // Update page title
    document.title = userData.settings.siteTitle || 'BazarPOS';
    updateSiteHeaderDisplay();
    showDashboard();
    // Update URL hash to dashboard
    window.location.hash = 'dashboard';
}

function updateSiteHeaderSections() {
    const selected = document.querySelector('input[name="siteHeaderLogoType"]:checked')?.value || 'image';
    if (selected === 'image') {
        document.getElementById('siteHeaderImageSection').classList.remove('hidden');
        document.getElementById('siteHeaderTextSection').classList.add('hidden');
    } else {
        document.getElementById('siteHeaderImageSection').classList.add('hidden');
        document.getElementById('siteHeaderTextSection').classList.remove('hidden');
    }
    // Ensure header icon visibility updates when switching between image/text
    updateSiteHeaderDisplay();
}

function updateSiteHeaderDisplay() {
    const userData = getUserData() || {};
    const settings = userData.settings || {};
    const useText = !!settings.siteHeaderLogoUseText;
    const text = settings.siteHeaderText || 'BazarPOS';
    const logo = settings.siteHeaderLogo;
    const size = settings.siteHeaderLogoSize || 40;

    const headers = document.querySelectorAll('h1[data-route="dashboard"]');
    headers.forEach(h => {
        // preserve classes, replace contents
        h.innerHTML = '';
        if (useText) {
            h.textContent = text;
        } else if (logo) {
            const img = document.createElement('img');
            img.src = logo;
            img.alt = text;
            img.style.height = size + 'px';
            img.style.objectFit = 'contain';
            h.appendChild(img);
        } else {
            h.textContent = text;
        }
    });
    // Toggle site header icon visibility: hide when image logo is used, show otherwise
    const icons = document.querySelectorAll('.site-header-icon');
    if (!useText && logo) {
        icons.forEach(i => i.classList.add('hidden'));
    } else {
        icons.forEach(i => i.classList.remove('hidden'));
    }

    // Improve Site Settings button in header: always show a settings (gear) icon, add badge when custom branding exists
    try {
        const siteBtn = document.querySelector('button[data-route="site-settings"]');
        if (siteBtn) {
            siteBtn.title = 'Site Settings';
            siteBtn.style.position = siteBtn.style.position || 'relative';

            const existingBadge = siteBtn.querySelector('.site-btn-badge');
            const svgHtml = '<i class="fi fi-rr-settings"></i>';

            // Ensure the button shows the gear SVG (do not show site logo image here)
            // Remove any image that might have been added earlier
            const existingImg = siteBtn.querySelector('img.site-icon-img');
            if (existingImg) existingImg.remove();

            if (!siteBtn.querySelector('svg')) {
                const wrapper = document.createElement('span');
                wrapper.innerHTML = svgHtml;
                siteBtn.prepend(wrapper.firstChild);
            }

            const hasCustom = (!!logo) || (!!(text && text.trim()));
            if (hasCustom) {
                if (!existingBadge) {
                    const badge = document.createElement('span');
                    badge.className = 'site-btn-badge';
                    siteBtn.appendChild(badge);
                }
            } else if (existingBadge) {
                existingBadge.remove();
            }
        }
    } catch (e) {
        console.warn('updateSiteHeaderDisplay: header update failed', e);
    }
}

// Logo upload handlers
function handleLogoUpload(inputId, previewId, containerId, settingKey) {
    const input = document.getElementById(inputId);
    const file = input.files[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) {
            showToast('File size must be less than 2MB', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = function (event) {
            const userData = getUserData();
            userData.settings = userData.settings || {};
            userData.settings[settingKey] = event.target.result;
            saveUserData(userData);
            document.getElementById(previewId).src = event.target.result;
            document.getElementById(containerId).classList.remove('hidden');
            // If site header image changed, update site header immediately
            if (settingKey === 'siteHeaderLogo') updateSiteHeaderDisplay();
        };
        reader.readAsDataURL(file);
    }
}

function handleFaviconUpload() {
    const input = document.getElementById('faviconUpload');
    const file = input.files[0];
    if (file) {
        if (file.size > 1 * 1024 * 1024) {
            showToast('File size must be less than 1MB', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = function (event) {
            const userData = getUserData();
            userData.settings = userData.settings || {};
            userData.settings.favicon = event.target.result;
            saveUserData(userData);
            document.getElementById('faviconPreview').src = event.target.result;
            document.getElementById('faviconPreviewContainer').classList.remove('hidden');
            // Update favicon in the page
            updatePageFavicon();
            showToast('Favicon uploaded successfully!', 'success');
        };
        reader.readAsDataURL(file);
    }
}

function removeFavicon() {
    const userData = getUserData();
    if (userData.settings) {
        delete userData.settings.favicon;
    }
    saveUserData(userData);
    document.getElementById('faviconPreviewContainer').classList.add('hidden');
    document.getElementById('faviconUpload').value = '';
    updatePageFavicon();
    showToast('Favicon removed', 'success');
}

function updatePageFavicon() {
    const userData = getUserData() || {};
    const settings = userData.settings || {};
    const favicon = settings.favicon;

    if (favicon) {
        let link = document.querySelector("link[rel='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = favicon;
    } else {
        const link = document.querySelector("link[rel='icon']");
        if (link) link.remove();
    }
}

function removeHeaderLogo() {
    const userData = getUserData();
    if (userData.settings) {
        delete userData.settings.headerLogo;
        delete userData.settings.siteHeaderLogo;
    }
    saveUserData(userData);
    const c1 = document.getElementById('headerLogoPreviewContainer');
    if (c1) c1.classList.add('hidden');
    const c2 = document.getElementById('siteHeaderLogoPreviewContainer');
    if (c2) c2.classList.add('hidden');
    const i1 = document.getElementById('headerLogoUpload');
    if (i1) i1.value = '';
    const i2 = document.getElementById('siteHeaderLogoUpload');
    if (i2) i2.value = '';
    updateSiteHeaderDisplay();
}

function removeWatermarkLogo() {
    const userData = getUserData();
    if (userData.settings) delete userData.settings.watermarkLogo;
    saveUserData(userData);
    document.getElementById('watermarkLogoPreviewContainer').classList.add('hidden');
    document.getElementById('watermarkLogoUpload').value = '';
}

function removeSignature() {
    const userData = getUserData();
    if (userData.settings) delete userData.settings.signature;
    saveUserData(userData);
    document.getElementById('signaturePreviewContainer').classList.add('hidden');
    document.getElementById('signatureUpload').value = '';
}

function removePaidSeal() {
    const userData = getUserData();
    if (userData.settings) delete userData.settings.paidSeal;
    saveUserData(userData);
    document.getElementById('paidSealPreviewContainer').classList.add('hidden');
    document.getElementById('paidSealUpload').value = '';
}

function removeDueSeal() {
    const userData = getUserData();
    if (userData.settings) delete userData.settings.dueSeal;
    saveUserData(userData);
    document.getElementById('dueSealPreviewContainer').classList.add('hidden');
    document.getElementById('dueSealUpload').value = '';
}

// =====================================================
// CLIENT AUTOCOMPLETE
// =====================================================

function getUniqueClients() {
    const userData = getUserData();
    const vouchers = userData.vouchers || [];
    const clientsMap = new Map();

    // Get unique clients based on phone number (or name if no phone)
    vouchers.forEach(v => {
        const key = v.clientPhone || v.clientName;
        if (key && !clientsMap.has(key)) {
            clientsMap.set(key, {
                name: v.clientName || '',
                phone: v.clientPhone || '',
                address: v.clientAddress || '',
                email: v.clientEmail || ''
            });
        }
    });

    return Array.from(clientsMap.values());
}

// Helper to get manual clients
function getClients() {
    const userData = getUserData();
    return userData.clients || [];
}

// Helper to merge manual clients and voucher history
function getAllClientsMerged() {
    const manualClients = getClients();
    const historyClients = getUniqueClients();

    // Map by phone number to avoid duplicates, preferring manual clients
    const clientMap = new Map();

    // 1. Add history clients first (lower priority)
    historyClients.forEach(c => {
        if (c.phone) clientMap.set(c.phone, c);
        else clientMap.set('NAME_' + c.name, c); // Fallback for no-phone clients
    });

    // 2. Add/Override with manual clients (higher priority)
    manualClients.forEach(c => {
        if (c.phone) clientMap.set(c.phone, c);
        else clientMap.set('NAME_' + c.name, c);
    });

    return Array.from(clientMap.values());
}

function setupClientAutocomplete() {
    const clientNameInput = document.getElementById('clientName');
    const clientPhoneInput = document.getElementById('clientPhone');
    const nameSuggestions = document.getElementById('clientNameSuggestions');
    const phoneSuggestions = document.getElementById('clientPhoneSuggestions');

    if (!clientNameInput || !clientPhoneInput) return;

    // Helper to render suggestions
    const showSuggestions = (input, suggestionsBox, filterType) => {
        const query = input.value.trim().toLowerCase();

        // Min chars requirement
        if ((filterType === 'name' && query.length < 1) || (filterType === 'phone' && query.length < 3)) {
            suggestionsBox.classList.add('hidden');
            return;
        }

        const allClients = getAllClientsMerged();
        const matches = allClients.filter(c => {
            if (filterType === 'name') return c.name.toLowerCase().includes(query);
            if (filterType === 'phone') return c.phone.includes(query);
            return false;
        }).slice(0, 8); // Limit to 8 results

        if (matches.length === 0) {
            suggestionsBox.classList.add('hidden');
            return;
        }

        suggestionsBox.innerHTML = matches.map(c => `
            <div class="suggestion-item p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                 onclick="fillClientDetailsFromSuggestion('${c.phone ? c.phone.replace(/'/g, "\\'") : ''}', '${c.name.replace(/'/g, "\\'")}')">
                 <div class="font-semibold text-gray-900 text-sm">${c.name}</div>
                 <div class="flex flex-col gap-0.5 mt-1">
                    ${c.phone ? `<div class="text-xs text-gray-600">📱 ${c.phone}</div>` : ''}
                    ${c.email ? `<div class="text-xs text-gray-600">✉️ ${c.email}</div>` : ''}
                 </div>
            </div>
        `).join('');

        suggestionsBox.classList.remove('hidden');
    };

    // Event Listeners for Name
    clientNameInput.addEventListener('input', () => {
        showSuggestions(clientNameInput, nameSuggestions, 'name');
        updatePreviousDueForClient();
    });
    clientNameInput.addEventListener('focus', () => {
        if (clientNameInput.value.trim().length > 0) showSuggestions(clientNameInput, nameSuggestions, 'name');
    });

    // Event Listeners for Phone
    clientPhoneInput.addEventListener('input', () => showSuggestions(clientPhoneInput, phoneSuggestions, 'phone'));
    clientPhoneInput.addEventListener('focus', () => {
        if (clientPhoneInput.value.trim().length > 0) showSuggestions(clientPhoneInput, phoneSuggestions, 'phone');
    });

    // Hide on blur
    document.addEventListener('click', (e) => {
        if (!clientNameInput.contains(e.target) && !nameSuggestions.contains(e.target)) {
            nameSuggestions.classList.add('hidden');
        }
        if (!clientPhoneInput.contains(e.target) && !phoneSuggestions.contains(e.target)) {
            phoneSuggestions.classList.add('hidden');
        }
    });

    // Helper to fill details (global to be accessible from onclick string)
    window.fillClientDetailsFromSuggestion = function (phone, name) {
        const allClients = getAllClientsMerged();
        // Priority find: Phone -> Name
        let client = allClients.find(c => c.phone === phone);
        if (!client) client = allClients.find(c => c.name === name);

        if (client) {
            clientNameInput.value = client.name || '';
            clientPhoneInput.value = client.phone || '';
            document.getElementById('clientEmail').value = client.email || '';
            document.getElementById('clientAddress').value = client.address || '';

            nameSuggestions.classList.add('hidden');
            phoneSuggestions.classList.add('hidden');
            
            // Update previous due for the selected client
            updatePreviousDueForClient();
        }
    };
}

function renderSuggestions(container, matches, query, searchField) {
    container.innerHTML = '';

    matches.forEach(client => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';

        // Highlight matching text
        let displayName = client.name;
        let displayPhone = client.phone;

        if (searchField === 'name' && query) {
            const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
            displayName = client.name.replace(regex, '<span class="suggestion-highlight">$1</span>');
        } else if (searchField === 'phone' && query) {
            const regex = new RegExp(`(${escapeRegex(query)})`, 'g');
            displayPhone = client.phone.replace(regex, '<span class="suggestion-highlight">$1</span>');
        }

        item.innerHTML = `
            <div class="suggestion-name">${displayName}</div>
            <div class="suggestion-details">
                ${displayPhone ? `📞 ${displayPhone}` : ''}
                ${client.email ? ` • ✉️ ${client.email}` : ''}
            </div>
        `;

        item.addEventListener('click', () => {
            fillClientDetails(client);
            container.classList.add('hidden');
        });

        container.appendChild(item);
    });

    container.classList.remove('hidden');
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function fillClientDetails(client) {
    document.getElementById('clientName').value = client.name;
    document.getElementById('clientPhone').value = client.phone;
    document.getElementById('clientAddress').value = client.address;
    document.getElementById('clientEmail').value = client.email;
    document.getElementById('clientWebsite').value = client.website || '';
}

// =====================================================
// SALES REPORT FUNCTIONS
// =====================================================

function showSalesTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.sales-tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.sales-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedContent = document.getElementById(tabName + 'Sales');
    if (selectedContent) {
        selectedContent.classList.remove('hidden');
    }
    
    // Add active class to selected tab
    const selectedTab = document.getElementById(tabName + 'SalesTab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Load data based on tab
    switch(tabName) {
        case 'all':
            loadAllSales();
            break;
    }
}

function loadAllSales() {
    const userData = getUserData();
    const vouchers = userData.vouchers || [];
    const salers = getSalers();
    const tbody = document.getElementById('historyTableBody');
    const noMessage = document.getElementById('noHistoryMessage');
    
    if (vouchers.length === 0) {
        tbody.innerHTML = '';
        noMessage.classList.remove('hidden');
        return;
    }
    
    noMessage.classList.add('hidden');
    
    tbody.innerHTML = vouchers.map((voucher, index) => {
        const balanceDue = voucher.balanceDue || voucher.balance_due || 0;
        const statusClass = balanceDue === 0 ? 'status-paid' : 'status-due';
        const statusText = balanceDue === 0 ? 'Paid' : 'Due';
        const statusBadge = `<span class="${statusClass}">${statusText}</span>`;
        
        // Get saler name from salers object
        const salerName = voucher.salerId ? (salers[voucher.salerId]?.name || 'N/A') : (voucher.salerName || '-');
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-900">${voucher.voucherNo || '#' + (index + 1)}</td>
                <td class="px-4 py-3 text-sm text-gray-500">${voucher.voucherDate ? formatDate(voucher.voucherDate) : '-'}</td>
                <td class="px-4 py-3 text-sm text-gray-500">${salerName}</td>
                <td class="px-4 py-3 text-sm text-gray-900 font-medium">${voucher.clientName || '-'}</td>
                <td class="px-4 py-3 text-sm text-right font-semibold text-blue-600">${voucher.netTotal ? formatBDCurrency(voucher.netTotal) : '-'}</td>
                <td class="px-4 py-3 text-sm text-right text-orange-600">${voucher.previousDue ? formatBDCurrency(voucher.previousDue) : '-'}</td>
                <td class="px-4 py-3 text-sm text-right text-green-600">${voucher.paidAmount ? formatBDCurrency(voucher.paidAmount) : '-'}</td>
                <td class="px-4 py-3 text-sm text-right font-semibold text-red-600">${balanceDue ? formatBDCurrency(balanceDue) : '-'}</td>
                <td class="px-4 py-3 text-center">${statusBadge}</td>
                <td class="px-4 py-3 text-center">
                    <button onclick="viewVoucherDetails('${voucher.voucherNo || (index + 1)}')" class="text-blue-600 hover:text-blue-800 mr-2" title="View Details">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-1.274 4.057a2 2 0 01-.707 0l-6.414 6.414a1 1 0 01-.707 0l-6.414-6.414A1 1 0 013 6.586V12z"></path>
                        </svg>
                    </button>
                    <button onclick="printVoucher('${voucher.voucherNo || (index + 1)}')" class="text-green-600 hover:text-green-800" title="Print">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Update search results info
    updateSearchResultsInfo(vouchers.length);
}

function loadMonthlySales() {
    const monthPicker = document.getElementById('monthPicker');
    const selectedMonth = monthPicker.value;
    
    if (!selectedMonth) return;
    
    const userData = getUserData();
    const vouchers = userData.vouchers || [];
    const salers = getSalers();
    
    const [year, month] = selectedMonth.split('-');
    const monthVouchers = vouchers.filter(voucher => {
        if (!voucher.voucherDate) return false;
        const voucherDate = new Date(voucher.voucherDate);
        return voucherDate.getFullYear() === parseInt(year) && voucherDate.getMonth() === parseInt(month) - 1;
    });
    
    const totalRevenue = monthVouchers.reduce((sum, v) => sum + (v.netTotal || 0), 0);
    
    // Update monthly revenue
    document.getElementById('monthlySalesRevenue').textContent = formatBDCurrency(totalRevenue);
    
// Load monthly vouchers in table
    const tbody = document.getElementById('historyTableBody');
    const noMessage = document.getElementById('noHistoryMessage');
    
    if (monthVouchers.length === 0) {
        tbody.innerHTML = '';
        noMessage.classList.remove('hidden');
        noMessage.innerHTML = '<p class="text-gray-500">No sales found for selected month</p>';
        return;
    }
    
    noMessage.classList.add('hidden');
    
    tbody.innerHTML = monthVouchers.map((voucher, index) => {
        const balanceDue = voucher.balanceDue || voucher.balance_due || 0;
        const statusClass = balanceDue === 0 ? 'status-paid' : 'status-due';
        const statusText = balanceDue === 0 ? 'Paid' : 'Due';
        const statusBadge = `<span class="${statusClass}">${statusText}</span>`;
        
        // Get saler name from salers object
        const salerName = voucher.salerId ? (salers[voucher.salerId]?.name || 'N/A') : (voucher.salerName || '-');
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-900">${voucher.voucherNo || '#' + (index + 1)}</td>
                <td class="px-4 py-3 text-sm text-gray-500">${voucher.voucherDate ? formatDate(voucher.voucherDate) : '-'}</td>
                <td class="px-4 py-3 text-sm text-gray-500">${salerName}</td>
                <td class="px-4 py-3 text-sm text-gray-900 font-medium">${voucher.clientName || '-'}</td>
                <td class="px-4 py-3 text-sm text-right font-semibold text-blue-600">${voucher.netTotal ? formatBDCurrency(voucher.netTotal) : '-'}</td>
                <td class="px-4 py-3 text-sm text-right text-orange-600">${voucher.previousDue ? formatBDCurrency(voucher.previousDue) : '-'}</td>
                <td class="px-4 py-3 text-sm text-right text-green-600">${voucher.paidAmount ? formatBDCurrency(voucher.paidAmount) : '-'}</td>
                <td class="px-4 py-3 text-sm text-right font-semibold text-red-600">${balanceDue ? formatBDCurrency(balanceDue) : '-'}</td>
                <td class="px-4 py-3 text-center">${statusBadge}</td>
                <td class="px-4 py-3 text-center">
                    <button onclick="viewVoucherDetails('${voucher.voucherNo || (index + 1)}')" class="text-blue-600 hover:text-blue-800 mr-2" title="View Details">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-1.274 4.057a2 2 0 01-.707 0l-6.414 6.414a1 1 0 01-.707 0l-6.414-6.414A1 1 0 013 6.586V12z"></path>
                        </svg>
                    </button>
                    <button onclick="printVoucher('${voucher.voucherNo || (index + 1)}')" class="text-green-600 hover:text-green-800" title="Print">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Update search results info
    updateSearchResultsInfo(monthVouchers.length);
}

function updateSearchResultsInfo(count) {
    const searchInfo = document.getElementById('searchResultsInfo');
    if (searchInfo) {
        searchInfo.classList.remove('hidden');
        document.getElementById('searchResultsCount').textContent = `Found ${count} voucher${count !== 1 ? 's' : ''}`;
    }
}

// =====================================================
// PRODUCT AUTOCOMPLETE FOR VOUCHER
// =====================================================

function setupProductAutocomplete(row) {
    const descInput = row.querySelector('.product-description');
    const rateInput = row.querySelector('.product-rate');
    const qtyInput = row.querySelector('.product-qty');
    const suggestionsDiv = row.querySelector('.product-suggestions');
    const stockInfoDiv = row.querySelector('.product-stock-info');

    let selectedProductCode = null;
    let barcodeBuffer = '';

    // Handle barcode scanning (typically ends with Enter key)
    descInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            
            // If we have a barcode buffer, try to find product by barcode
            if (barcodeBuffer.length > 0) {
                const product = findProductByBarcode(barcodeBuffer);
                if (product) {
                    // Product found by barcode
                    descInput.value = product.name;
                    rateInput.value = product.price || 0;
                    row.querySelector('.product-code').value = product.code;
                    row.querySelector('.product-warranty').value = product.warranty || 0;
                    selectedProductCode = product.code;
                    
                    // Update stock info
                    updateStockWarning(product.code, qtyInput, stockInfoDiv);
                    
                    // Clear suggestions and barcode buffer
                    suggestionsDiv.classList.add('hidden');
                    barcodeBuffer = '';
                    
                    // Calculate amounts
                    calculateRowAmount(qtyInput);
                    calculateTotal();
                    
                    showToast(`Product found: ${product.name}`, 'success');
                    
                    // Move to next row or quantity field
                    if (qtyInput) {
                        qtyInput.focus();
                        qtyInput.select();
                    } else {
                        addProductRow();
                    }
                } else {
                    // No product found with this barcode
                    showToast('No product found with this barcode', 'error');
                    barcodeBuffer = '';
                    descInput.value = '';
                }
            } else {
                // Regular Enter key behavior - add new row
                if (descInput.value.trim()) {
                    addProductRow();
                }
            }
        } else if (e.key.length === 1) {
            // Build barcode buffer for quick scanning
            barcodeBuffer += e.key;
            
            // Clear buffer after 2 seconds of inactivity
            setTimeout(() => {
                if (barcodeBuffer === descInput.value) {
                    barcodeBuffer = '';
                }
            }, 2000);
        }
    });

    // Show suggestions on input
    descInput.addEventListener('input', function () {
        const query = this.value.trim();

        if (query.length < 1) {
            suggestionsDiv.classList.add('hidden');
            stockInfoDiv.classList.add('hidden');
            selectedProductCode = null;
            return;
        }

        // Check if input looks like a barcode (12+ digits)
        if (/^\d{12,}$/.test(query)) {
            const product = findProductByBarcode(query);
            if (product) {
                // Product found by barcode
                descInput.value = product.name;
                rateInput.value = product.price || 0;
                row.querySelector('.product-code').value = product.code;
                row.querySelector('.product-warranty').value = product.warranty || 0;
                selectedProductCode = product.code;
                
                // Update stock info
                updateStockWarning(product.code, qtyInput, stockInfoDiv);
                
                // Clear suggestions
                suggestionsDiv.classList.add('hidden');
                
                // Calculate amounts
                calculateRowAmount(qtyInput);
                calculateTotal();
                
                showToast(`Product found: ${product.name}`, 'success');
                
                // Move to quantity field
                if (qtyInput) {
                    qtyInput.focus();
                    qtyInput.select();
                }
                return;
            }
        }

        const products = getProducts();
        const matches = products.filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.code.toLowerCase().includes(query.toLowerCase()) ||
            (p.barcode && p.barcode.includes(query))
        );

        if (matches.length === 0) {
            suggestionsDiv.classList.add('hidden');
            selectedProductCode = null;
            return;
        }

        renderProductSuggestions(suggestionsDiv, matches, query, descInput, rateInput, qtyInput, stockInfoDiv, (code) => {
            selectedProductCode = code;
        });
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', function (e) {
        if (!descInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.classList.add('hidden');
        }
    });

    // Show suggestions on focus if there's text
    descInput.addEventListener('focus', function () {
        if (this.value.trim().length > 0) {
            const event = new Event('input');
            this.dispatchEvent(event);
        }
    });

    // Check stock when quantity changes
    if (qtyInput) {
        qtyInput.addEventListener('input', function () {
            if (selectedProductCode) {
                updateStockWarning(selectedProductCode, qtyInput, stockInfoDiv);
            }
        });
    }
}

function renderProductSuggestions(container, matches, query, descInput, rateInput, qtyInput, stockInfoDiv, setSelectedCode) {
    container.innerHTML = matches.map(product => {
        const stockStatus = getStockStatus(product);
        const stockBadgeClass = stockStatus === 'out' ? 'bg-red-100 text-red-700' :
            stockStatus === 'low' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700';
        const stockText = stockStatus === 'out' ? 'Out of Stock' : `${product.quantity} in stock`;

        const nameMatch = product.name.toLowerCase().indexOf(query.toLowerCase());
        const codeMatch = product.code.toLowerCase().indexOf(query.toLowerCase());

        let displayName = product.name;
        let displayCode = product.code;

        if (nameMatch !== -1) {
            const before = product.name.substring(0, nameMatch);
            const match = product.name.substring(nameMatch, nameMatch + query.length);
            const after = product.name.substring(nameMatch + query.length);
            displayName = `${before}<strong class="bg-yellow-200">${match}</strong>${after}`;
        }

        if (codeMatch !== -1) {
            const before = product.code.substring(0, codeMatch);
            const match = product.code.substring(codeMatch, codeMatch + query.length);
            const after = product.code.substring(codeMatch + query.length);
            displayCode = `${before}<strong class="bg-yellow-200">${match}</strong>${after}`;
        }

        return `
            <div class="suggestion-item p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                 data-code="${product.code}"
                 data-name="${product.name}"
                 data-price="${product.sellingPrice || product.price || 0}"
                 data-warranty="${product.warranty || 0}"
                 data-quantity="${product.quantity}">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="font-medium text-gray-900">${displayName}</div>
                        <div class="text-xs text-gray-500 mt-1">Code: ${displayCode}</div>
                        ${product.description ? `<div class="text-xs text-gray-600 mt-1">${product.description}</div>` : ''}
                    </div>
                    <div class="ml-4 text-right">
                        <div class="font-semibold text-gray-900">${formatBDCurrency(product.sellingPrice || product.price || 0)}</div>
                        <span class="inline-block mt-1 px-2 py-1 text-xs rounded-full ${stockBadgeClass}">${stockText}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.classList.remove('hidden');

    // Add click handlers to suggestions
    container.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', function () {
            const code = this.dataset.code;
            const name = this.dataset.name;
            const price = parseFloat(this.dataset.price);
            const warranty = parseInt(this.dataset.warranty) || 0;
            const stockQty = parseInt(this.dataset.quantity);

            // Fill in the product details
            descInput.value = name;
            if (rateInput) {
                rateInput.value = price.toFixed(2);
            }

            // Store product code in hidden field
            const row = descInput.closest('tr');
            const codeInput = row.querySelector('.product-code');
            if (codeInput) {
                codeInput.value = code;
            }

            // Store and display warranty
            const warrantyInput = row.querySelector('.product-warranty');
            const warrantyDisplay = row.querySelector('.product-warranty-display');
            if (warrantyInput) {
                warrantyInput.value = warranty;
                if (warranty > 0 && warrantyDisplay) {
                    warrantyDisplay.textContent = `Warranty: ${warranty} days`;
                    warrantyDisplay.classList.remove('hidden');
                } else if (warrantyDisplay) {
                    warrantyDisplay.classList.add('hidden');
                }
            }

            // Trigger calculation
            if (rateInput) {
                calculateRowAmount(rateInput);
                calculateTotal();
            }

            // Set selected product code
            setSelectedCode(code);

            // Show stock info
            updateStockWarning(code, qtyInput, stockInfoDiv);

            // Hide suggestions
            container.classList.add('hidden');
        });
    });
}

function updateStockWarning(productCode, qtyInput, stockInfoDiv) {
    const products = getProducts();
    const product = products.find(p => p.code === productCode);

    if (!product || !qtyInput) {
        stockInfoDiv.classList.add('hidden');
        return;
    }

    const requestedQty = parseInt(qtyInput.value) || 0;
    const availableQty = product.quantity;

    if (requestedQty > availableQty) {
        stockInfoDiv.innerHTML = `
            <div class="flex items-center space-x-1 text-red-600">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                <span class="font-medium">Warning: Only ${availableQty} in stock!</span>
            </div>
        `;
        stockInfoDiv.classList.remove('hidden');
        qtyInput.classList.add('border-red-500', 'border-2');
    } else if (requestedQty > 0 && availableQty <= product.lowStockAlert) {
        stockInfoDiv.innerHTML = `
            <div class="flex items-center space-x-1 text-yellow-600">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                <span>Low stock: ${availableQty} available</span>
            </div>
        `;
        stockInfoDiv.classList.remove('hidden');
        qtyInput.classList.remove('border-red-500', 'border-2');
    } else {
        stockInfoDiv.innerHTML = `
            <div class="flex items-center space-x-1 text-green-600">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <span>${availableQty} available</span>
            </div>
        `;
        stockInfoDiv.classList.remove('hidden');
        qtyInput.classList.remove('border-red-500', 'border-2');
    }
}

function checkStockForRow(element) {
    // This function is called when quantity changes
    // The actual check is done in updateStockWarning via the event listener
    // This is just a placeholder for the onchange attribute
}

// =====================================================
// VOUCHER FORM MANAGEMENT
// =====================================================

function initializeVoucherForm() {
    document.getElementById('voucherNo').value = generateVoucherNumber();
    document.getElementById('voucherDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('voucherTemplate').value = 'Default';
    document.getElementById('voucherSaler').value = '';

    document.getElementById('clientName').value = '';
    document.getElementById('clientPhone').value = '';
    document.getElementById('clientAddress').value = '';
    document.getElementById('clientEmail').value = '';
    document.getElementById('discount').value = '0';
    document.getElementById('previousPayment').value = '0';
    document.getElementById('paidAmount').value = '0';

    document.getElementById('showNote').checked = false;
    document.getElementById('noteSection').classList.add('hidden');
    document.getElementById('voucherNote').value = '';

    document.getElementById('showPaidSeal').checked = false;
    document.getElementById('showDueSeal').checked = false;

    document.getElementById('productTableBody').innerHTML = '';
    updateTemplateColumns();
    addProductRow();

    populateSalersDropdown();
    calculateTotal();
}

function toggleNoteSection() {
    const showNote = document.getElementById('showNote').checked;
    const noteSection = document.getElementById('noteSection');
    if (showNote) {
        noteSection.classList.remove('hidden');
    } else {
        noteSection.classList.add('hidden');
    }
}

function updateTemplateColumns() {
    const template = document.getElementById('voucherTemplate').value;

    const qtyHeader = document.getElementById('qtyHeader');
    const rateHeader = document.getElementById('rateHeader');

    // Update headers based on template
    if (template === 'Student') {
        qtyHeader.textContent = 'Students';
        rateHeader.textContent = 'Cost/Student';
        qtyHeader.classList.remove('hidden');
        rateHeader.classList.remove('hidden');
    } else if (template === 'Website') {
        qtyHeader.classList.add('hidden');
        rateHeader.classList.add('hidden');
    } else {
        // Default template
        qtyHeader.textContent = 'Qty';
        rateHeader.textContent = 'Unit Price';
        qtyHeader.classList.remove('hidden');
        rateHeader.classList.remove('hidden');
    }

    // Update existing rows
    updateProductTableRows();
}

function updateProductTableRows() {
    const template = document.getElementById('voucherTemplate').value;
    const rows = document.querySelectorAll('#productTableBody tr');
    const isWebsite = template === 'Website';

    rows.forEach(row => {
        const qtyCell = row.querySelector('.qty-cell');
        const rateCell = row.querySelector('.rate-cell');
        const amountInput = row.querySelector('.product-amount');

        if (isWebsite) {
            if (qtyCell) qtyCell.classList.add('hidden');
            if (rateCell) rateCell.classList.add('hidden');
            // Make amount editable for Website template
            if (amountInput) amountInput.removeAttribute('readonly');
        } else {
            if (qtyCell) qtyCell.classList.remove('hidden');
            if (rateCell) rateCell.classList.remove('hidden');
            // Make amount readonly for other templates
            if (amountInput) amountInput.setAttribute('readonly', 'readonly');
        }
    });
}

function addProductRow() {
    const tbody = document.getElementById('productTableBody');
    const rowCount = tbody.children.length + 1;
    const template = document.getElementById('voucherTemplate').value;
    const isWebsite = template === 'Website';

    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="px-2 py-2 text-center text-sm">${rowCount}</td>
        <td class="px-2 py-2 relative">
            <input type="hidden" class="product-code" value="">
            <input type="hidden" class="product-warranty" value="0">
            <input type="text" class="input-field text-sm product-description" placeholder="Enter description or search products..." autocomplete="off">
            <div class="product-warranty-display text-xs text-gray-500 mt-1 hidden"></div>
            <div class="product-suggestions absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 hidden max-h-96 overflow-y-auto"></div>
            <div class="product-stock-info text-xs mt-1 hidden"></div>
        </td>
        <td class="px-2 py-2 qty-cell ${isWebsite ? 'hidden' : ''}">
            <input type="number" class="input-field text-center text-sm product-qty" placeholder="1" step="1" min="1" value="1" onchange="calculateRowAmount(this); calculateTotal(); checkStockForRow(this)">
        </td>
        <td class="px-2 py-2 rate-cell ${isWebsite ? 'hidden' : ''}">
            <input type="number" class="input-field text-right text-sm product-rate" placeholder="0.00" step="0.01" min="0" onchange="calculateRowAmount(this); calculateTotal()">
        </td>
        <td class="px-2 py-2">
            <input type="number" class="input-field text-right text-sm product-amount" placeholder="0.00" step="0.01" min="0" onchange="calculateTotal()" ${isWebsite ? '' : 'readonly'}>
        </td>
        <td class="px-2 py-2 text-center">
            <button type="button" onclick="removeProductRow(this)" class="text-red-600 hover:text-red-800 p-1">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        </td>
    `;

    tbody.appendChild(row);

    // Setup product autocomplete for this new row
    setupProductAutocomplete(row);
}

function calculateRowAmount(input) {
    const row = input.closest('tr');
    const qty = parseFloat(row.querySelector('.product-qty').value) || 0;
    const rate = parseFloat(row.querySelector('.product-rate').value) || 0;
    const amount = qty * rate;
    row.querySelector('.product-amount').value = amount.toFixed(2);
}

function removeProductRow(button) {
    const tbody = document.getElementById('productTableBody');
    if (tbody.children.length > 1) {
        button.closest('tr').remove();
        updateRowNumbers();
        calculateTotal();
    }
}

function updateRowNumbers() {
    const rows = document.querySelectorAll('#productTableBody tr');
    rows.forEach((row, index) => {
        row.cells[0].textContent = index + 1;
    });
}

// Calculate client's previous due amount
function getClientPreviousDue(clientName, currentVoucherNo = null) {
    const userData = getUserData();
    const vouchers = userData.vouchers || [];
    
    let previousDue = 0;
    
    vouchers.forEach(voucher => {
        // Skip current voucher if editing
        if (currentVoucherNo && voucher.voucherNo === currentVoucherNo) {
            return;
        }
        
        // Only include vouchers for the same client
        if (voucher.clientName === clientName && voucher.balanceDue > 0) {
            previousDue += voucher.balanceDue;
        }
    });
    
    return previousDue;
}

// Auto-populate previous due when client is selected
function updatePreviousDueForClient() {
    const clientName = document.getElementById('clientName').value.trim();
    const voucherNo = document.getElementById('voucherNo').value;
    const previousPaymentInput = document.getElementById('previousPayment');
    
    if (!clientName) {
        previousPaymentInput.value = '0';
        calculateTotal();
        return;
    }
    
    const previousDue = getClientPreviousDue(clientName, voucherNo);
    previousPaymentInput.value = previousDue;
    calculateTotal();
    
    // Show notification if previous due found
    if (previousDue > 0) {
        showToast(`Previous due of ৳${previousDue.toFixed(2)} found for ${clientName}`, 'info');
    }
}

function calculateTotal() {
    let subtotal = 0;
    document.querySelectorAll('.product-amount').forEach(input => {
        subtotal += parseFloat(input.value) || 0;
    });

    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const previousDue = parseFloat(document.getElementById('previousPayment').value) || 0;
    const paidAmount = parseFloat(document.getElementById('paidAmount').value) || 0;

    const netTotal = subtotal - discount;
    const totalPaid = paidAmount;
    const balanceDue = netTotal + previousDue - totalPaid;

    document.getElementById('subtotalDisplay').textContent = formatBDCurrency(subtotal);
    document.getElementById('netTotalDisplay').textContent = formatBDCurrency(netTotal);
    document.getElementById('totalPaidDisplay').textContent = formatBDCurrency(totalPaid);
    document.getElementById('balanceDueDisplay').textContent = formatBDCurrency(balanceDue);

    // Update amount in words based on checkbox selections
    updateAmountInWords();
}

// Update Amount in Words based on checkbox selections
function updateAmountInWords() {
    const amountInWordsDiv = document.getElementById('amountInWords');
    if (!amountInWordsDiv) return;

    const netTotal = parseFloat(document.getElementById('netTotalDisplay').textContent.replace(/[৳,]/g, '')) || 0;
    const totalPaid = parseFloat(document.getElementById('totalPaidDisplay').textContent.replace(/[৳,]/g, '')) || 0;
    const balanceDue = parseFloat(document.getElementById('balanceDueDisplay').textContent.replace(/[৳,]/g, '')) || 0;

    const showNetTotal = document.getElementById('showNetTotalWords')?.checked || false;
    const showPaidAmount = document.getElementById('showPaidAmountWords')?.checked || false;
    const showBalanceDue = document.getElementById('showBalanceDueWords')?.checked || false;

    let wordsHTML = '';

    if (showNetTotal) {
        wordsHTML += `<p><strong>Net Total:</strong> ${numberToWords(netTotal > 0 ? netTotal : 0)}</p>`;
    }

    if (showPaidAmount) {
        wordsHTML += `<p><strong>Paid Amount:</strong> ${numberToWords(totalPaid > 0 ? totalPaid : 0)}</p>`;
    }

    if (showBalanceDue) {
        wordsHTML += `<p><strong>Balance Due:</strong> ${numberToWords(balanceDue > 0 ? balanceDue : 0)}</p>`;
    }

    if (!wordsHTML) {
        wordsHTML = '<p class="text-gray-500">Select an option above to display amount in words</p>';
    }

    amountInWordsDiv.innerHTML = wordsHTML;
}


function getVoucherFormData() {
    const template = document.getElementById('voucherTemplate').value;
    const products = [];

    document.querySelectorAll('#productTableBody tr').forEach((row, index) => {
        const productCode = row.querySelector('.product-code')?.value || '';
        const description = row.querySelector('.product-description').value;
        const qty = parseFloat(row.querySelector('.product-qty').value) || 1;
        const rate = parseFloat(row.querySelector('.product-rate').value) || 0;
        const warranty = parseInt(row.querySelector('.product-warranty')?.value) || 0;
        const amount = parseFloat(row.querySelector('.product-amount').value) || 0;

        if (description || amount > 0) {
            products.push({ sl: index + 1, productCode, description, qty, rate, price: rate, warranty, amount });
        }
    });

    let subtotal = 0;
    products.forEach(p => subtotal += p.amount);

    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const previousDue = parseFloat(document.getElementById('previousPayment').value) || 0;
    const paidAmount = parseFloat(document.getElementById('paidAmount').value) || 0;
    const netTotal = subtotal - discount;
    const balanceDue = netTotal + previousDue - paidAmount;

    return {
        voucherNo: document.getElementById('voucherNo').value,
        voucherDate: document.getElementById('voucherDate').value,
        voucherType: document.getElementById('voucherType').value,
        voucherTemplate: template,
        showWarranty: template === 'Default',
        salerId: document.getElementById('voucherSaler').value || null,
        clientName: document.getElementById('clientName').value,
        clientPhone: document.getElementById('clientPhone').value,
        clientAddress: document.getElementById('clientAddress').value,
        clientEmail: document.getElementById('clientEmail').value,
        clientWebsite: document.getElementById('clientWebsite').value,
        products,
        subtotal,
        discount,
        previousDue,
        paidAmount,
        netTotal,
        balanceDue,
        showNote: document.getElementById('showNote').checked,
        note: document.getElementById('voucherNote').value,
        showPaidSeal: document.getElementById('showPaidSeal').checked,
        showDueSeal: document.getElementById('showDueSeal').checked
    };
}

// =====================================================
// PRINT PREVIEW
// =====================================================

function previewVoucher() {
    const formData = getVoucherFormData();

    if (!formData.clientName) {
        showToast('Please enter client name!', 'error');
        return;
    }

    if (!formData.salerId) {
        showToast('Please select a saler!', 'error');
        return;
    }

    if (formData.products.length === 0) {
        showToast('Please add at least one product!', 'error');
        return;
    }

    // Validate stock availability
    const stockValidation = validateStockAvailability(formData.products);
    if (!stockValidation.valid) {
        showToast(stockValidation.message, 'error');
        return;
    }

    currentVoucherData = formData;
    renderVoucherPreview(formData);

    hideAllScreens();
    document.getElementById('printPreviewScreen').classList.remove('hidden');

    setTimeout(autoScaleVoucherContent, 100);
}

function validateStockAvailability(products) {
    const inventory = getProducts();

    for (const product of products) {
        if (!product.productCode) {
            // Product not from inventory (manually entered description)
            continue;
        }

        const inventoryItem = inventory.find(p => p.code === product.productCode);

        if (!inventoryItem) {
            return {
                valid: false,
                message: `Product "${product.description}" not found in inventory`
            };
        }

        if (product.qty > inventoryItem.quantity) {
            return {
                valid: false,
                message: `Insufficient stock for "${product.description}". Available: ${inventoryItem.quantity}, Requested: ${product.qty}`
            };
        }
    }

    return { valid: true };
}

function renderVoucherPreview(data) {
    const userData = getUserData();
    const settings = userData.settings || {};
    const voucherPage = document.getElementById('voucherPage');

    // Company info
    document.getElementById('printCompanyName').textContent = settings.companyName || 'Company Name';
    document.getElementById('printCompanyAddress').textContent = settings.companyAddress || '';

    // Contact info with icons
    const phoneEl = document.getElementById('printCompanyPhone');
    const emailEl = document.getElementById('printCompanyEmail');
    const websiteEl = document.getElementById('printCompanyWebsite');

    if (settings.companyPhone) {
        phoneEl.querySelector('.contact-text').textContent = settings.companyPhone;
        phoneEl.classList.remove('hidden');
    } else {
        phoneEl.classList.add('hidden');
    }

    if (settings.companyEmail) {
        emailEl.querySelector('.contact-text').textContent = settings.companyEmail;
        emailEl.classList.remove('hidden');
    } else {
        emailEl.classList.add('hidden');
    }

    if (settings.companyWebsite) {
        websiteEl.querySelector('.contact-text').textContent = settings.companyWebsite;
        websiteEl.classList.remove('hidden');
    } else {
        websiteEl.classList.add('hidden');
    }

    // Header logo - Always use company settings for vouchers
    const headerLogoContainer = document.getElementById('headerLogoContainer');
    const headerLogo = document.getElementById('printHeaderLogo');
    // Clear existing text/logo
    headerLogoContainer.querySelectorAll('.text-logo').forEach(n => n.remove());

    if (settings.headerLogoUseText) {
        // Show company text logo
        headerLogo.classList.add('hidden');
        const text = settings.headerText || settings.companyName || '';
        const textEl = document.createElement('div');
        textEl.className = 'text-logo font-bold text-gray-800';
        textEl.style.fontSize = (settings.headerLogoSize || 28) + 'px';
        textEl.textContent = text;
        headerLogoContainer.appendChild(textEl);
        headerLogoContainer.className = 'header-logo-wrapper logo-' + (settings.headerLogoPosition || 'left');
        headerLogoContainer.style.top = (settings.headerLogoVertical || 0) + '%';
    } else if (settings.headerLogo && settings.showHeaderLogo) {
        // Show company logo image
        headerLogo.src = settings.headerLogo;
        headerLogo.classList.remove('hidden');

        voucherPage.style.setProperty('--header-logo-size', (settings.headerLogoSize || 40) + 'px');
        headerLogoContainer.className = 'header-logo-wrapper logo-' + (settings.headerLogoPosition || 'left');
        headerLogoContainer.style.top = (settings.headerLogoVertical || 0) + '%';
    } else {
        // Hide logo
        headerLogo.classList.add('hidden');
    }

    // Watermark
    const watermark = document.getElementById('printWatermark');
    if (settings.watermarkLogo && settings.showWatermark) {
        watermark.src = settings.watermarkLogo;
        watermark.className = 'watermark h-pos-' + (settings.watermarkHPosition || 'center');
        watermark.classList.remove('hidden');

        voucherPage.style.setProperty('--watermark-opacity', (settings.watermarkOpacity || 8) / 100);
        voucherPage.style.setProperty('--watermark-size', (settings.watermarkSize || 40) + '%');
        voucherPage.style.setProperty('--watermark-vertical', (settings.watermarkVertical || 50) + '%');
    } else {
        watermark.classList.add('hidden');
    }

    // Signature with positioning
    const signatureImg = document.getElementById('printSignature');
    const signatureRow = document.getElementById('signatureRow');
    if (settings.signature && settings.showSignature) {
        signatureImg.src = settings.signature;
        signatureImg.classList.remove('hidden');

        voucherPage.style.setProperty('--signature-size', (settings.signatureSize || 60) + 'px');

        // Adjust signature row padding based on horizontal position
        const hPos = settings.signatureHorizontal || 50;
        const padding = Math.abs(hPos - 50) * 1.5;
        if (hPos < 50) {
            signatureRow.style.paddingLeft = (50 - hPos) + '%';
            signatureRow.style.paddingRight = '20px';
        } else {
            signatureRow.style.paddingLeft = '20px';
            signatureRow.style.paddingRight = (hPos - 50) + '%';
        }
    } else {
        signatureImg.classList.add('hidden');
        signatureRow.style.paddingLeft = '20px';
        signatureRow.style.paddingRight = '20px';
    }

    // Paid Seal
    const paidSeal = document.getElementById('printPaidSeal');
    if (settings.paidSeal && data.showPaidSeal) {
        paidSeal.src = settings.paidSeal;
        paidSeal.classList.remove('hidden');

        voucherPage.style.setProperty('--paid-seal-size', (settings.paidSealSize || 80) + 'px');
        voucherPage.style.setProperty('--paid-seal-opacity', (settings.paidSealOpacity || 70) / 100);
        voucherPage.style.setProperty('--paid-seal-horizontal', (settings.paidSealHorizontal || 75) + '%');
        voucherPage.style.setProperty('--paid-seal-vertical', (settings.paidSealVertical || 60) + '%');
    } else {
        paidSeal.classList.add('hidden');
    }

    // Due Seal
    const dueSeal = document.getElementById('printDueSeal');
    if (settings.dueSeal && data.showDueSeal) {
        dueSeal.src = settings.dueSeal;
        dueSeal.classList.remove('hidden');

        voucherPage.style.setProperty('--due-seal-size', (settings.dueSealSize || 80) + 'px');
        voucherPage.style.setProperty('--due-seal-opacity', (settings.dueSealOpacity || 70) / 100);
        voucherPage.style.setProperty('--due-seal-horizontal', (settings.dueSealHorizontal || 75) + '%');
        voucherPage.style.setProperty('--due-seal-vertical', (settings.dueSealVertical || 60) + '%');
    } else {
        dueSeal.classList.add('hidden');
    }

    // Voucher info
    document.getElementById('printVoucherType').textContent = data.voucherType;
    document.getElementById('printVoucherNo').textContent = data.voucherNo;
    document.getElementById('printVoucherDate').textContent = formatDate(data.voucherDate);

    // Client info
    const clientNameEl = document.getElementById('printClientName');
    if (clientNameEl) {
        clientNameEl.textContent = data.clientName || '';
    }
    const clientAddressEl = document.getElementById('printClientAddress');
    if (clientAddressEl) {
        clientAddressEl.textContent = data.clientAddress || '';
    }
    document.getElementById('printClientPhone').textContent = data.clientPhone ? `Phone: ${data.clientPhone}` : '';
    document.getElementById('printClientEmail').textContent = data.clientEmail ? `Email: ${data.clientEmail}` : '';
    document.getElementById('printClientWebsite').textContent = data.clientWebsite ? `Website: ${data.clientWebsite}` : '';


    // Update table headers based on template
    const printQtyHeader = document.getElementById('printQtyHeader');
    const printRateHeader = document.getElementById('printRateHeader');

    if (data.voucherTemplate === 'Student') {
        printQtyHeader.textContent = 'Students';
        printRateHeader.textContent = 'Cost/Student';
        printQtyHeader.classList.remove('hidden');
        printRateHeader.classList.remove('hidden');
    } else if (data.voucherTemplate === 'Website') {
        printQtyHeader.classList.add('hidden');
        printRateHeader.classList.add('hidden');
    } else {
        printQtyHeader.textContent = 'Qty';
        printRateHeader.textContent = 'Unit Price';
        printQtyHeader.classList.remove('hidden');
        printRateHeader.classList.remove('hidden');
    }

    // Products table
    const tbody = document.getElementById('printProductTableBody');
    tbody.innerHTML = '';
    data.products.forEach(product => {
        const row = document.createElement('tr');

        let html = `<td class="text-center">${product.sl}</td>`;
        
        // Description with warranty info below
        let descHtml = product.description;
        if (data.voucherTemplate === 'Default' && product.warranty > 0) {
            descHtml += `<br/><span style="font-size: 0.8em; color: #666;">Warranty: ${product.warranty} days</span>`;
        }
        html += `<td>${descHtml}</td>`;

        if (data.voucherTemplate !== 'Website') {
            html += `<td class="text-center">${product.qty}</td>`;
            html += `<td class="amount-cell">${formatBDCurrency(product.rate)}</td>`;
        }

        html += `<td class="amount-cell">${formatBDCurrency(product.amount)}</td>`;

        row.innerHTML = html;
        tbody.appendChild(row);
    });

    // Summary
    document.getElementById('printSubtotal').textContent = formatBDCurrency(data.subtotal);
    document.getElementById('printDiscount').textContent = formatBDCurrency(data.discount);
    document.getElementById('printNetTotal').textContent = formatBDCurrency(data.netTotal);
    document.getElementById('printPreviousPayment').textContent = formatBDCurrency(data.previousDue);
    document.getElementById('printPaidAmount').textContent = formatBDCurrency(data.paidAmount);
    document.getElementById('printBalanceDue').textContent = formatBDCurrency(data.balanceDue);

    // Amount in Words - based on checkbox selections
    const printAmountInWordsDiv = document.getElementById('printAmountInWords');
    const showNetTotal = document.getElementById('showNetTotalWords')?.checked || false;
    const showPaidAmount = document.getElementById('showPaidAmountWords')?.checked || false;
    const showBalanceDue = document.getElementById('showBalanceDueWords')?.checked || false;

    let wordsHTML = '';
    const totalPaid = (data.paidAmount || 0);

    if (showNetTotal) {
        wordsHTML += `<p><strong>Net Total:</strong> ${numberToWords(data.netTotal > 0 ? data.netTotal : 0)}</p>`;
    }

    if (showPaidAmount) {
        wordsHTML += `<p><strong>Paid Amount:</strong> ${numberToWords(totalPaid > 0 ? totalPaid : 0)}</p>`;
    }

    if (showBalanceDue) {
        wordsHTML += `<p><strong>Balance Due:</strong> ${numberToWords(data.balanceDue > 0 ? data.balanceDue : 0)}</p>`;
    }

    if (!wordsHTML) {
        wordsHTML = '<p class="text-gray-500">No amount selected</p>';
    }

    printAmountInWordsDiv.innerHTML = wordsHTML;

    // Note
    const noteSection = document.getElementById('printNoteSection');
    if (data.showNote && data.note) {
        document.getElementById('printNote').textContent = data.note;
        noteSection.classList.remove('hidden');
    } else {
        noteSection.classList.add('hidden');
    }
}

function autoScaleVoucherContent() {
    const voucherPage = document.getElementById('voucherPage');
    const voucherContent = voucherPage.querySelector('.voucher-content');

    voucherPage.classList.remove('scale-95', 'scale-90', 'scale-85', 'scale-80', 'scale-75', 'scale-70');

    const a4ContentHeight = 277 * 3.7795275591; // 277mm to px
    const contentHeight = voucherContent.scrollHeight;
    const ratio = a4ContentHeight / contentHeight;

    if (ratio < 1) {
        if (ratio >= 0.95) voucherPage.classList.add('scale-95');
        else if (ratio >= 0.90) voucherPage.classList.add('scale-90');
        else if (ratio >= 0.85) voucherPage.classList.add('scale-85');
        else if (ratio >= 0.80) voucherPage.classList.add('scale-80');
        else if (ratio >= 0.75) voucherPage.classList.add('scale-75');
        else if (ratio >= 0.70) voucherPage.classList.add('scale-70');
    }
}

function closePrintPreview() {
    if (isViewingHistory) {
        showVoucherHistory();
    } else {
        showCreateVoucher(isEditingVoucher);
    }
}

function printVoucher(voucherNo) {
    // Find the voucher by voucherNo
    const userData = getUserData();
    const vouchers = userData.vouchers || [];
    const voucher = vouchers.find(v => v.voucher_no === voucherNo || v.voucherNo === voucherNo);
    
    if (!voucher) {
        showToast('Voucher not found', 'error');
        return;
    }
    
    // Set current voucher data for printing
    currentVoucherData = voucher;
    
    // Load voucher data into the print form
    loadVoucherForPrinting(voucher);
    
    // Show the voucher section and hide others
    showSection('voucher');
    
    // Print the voucher
    setTimeout(() => {
        window.print();
    }, 500);
}

function loadVoucherForPrinting(voucher) {
    // Load voucher data into the form fields
    document.getElementById('voucherNo').value = voucher.voucher_no || voucher.voucherNo || '';
    document.getElementById('voucherDate').value = voucher.date || voucher.voucherDate || '';
    document.getElementById('clientName').value = voucher.client_name || voucher.clientName || '';
    document.getElementById('clientPhone').value = voucher.clientPhone || '';
    document.getElementById('clientAddress').value = voucher.clientAddress || '';
    document.getElementById('salerName').value = voucher.saler_name || voucher.salerName || '';
    document.getElementById('previousDue').value = voucher.previous_due || voucher.previousDue || 0;
    document.getElementById('netTotal').value = voucher.total_amount || voucher.netTotal || 0;
    document.getElementById('totalPaid').value = voucher.paid_amount || voucher.paidAmount || 0;
    document.getElementById('balanceDue').value = voucher.balance_due || voucher.balanceDue || 0;
    document.getElementById('amountInWords').value = voucher.amountInWords || '';
    
    // Update display fields
    document.getElementById('subtotalDisplay').textContent = formatBDCurrency(voucher.subtotal || 0);
    document.getElementById('netTotalDisplay').textContent = formatBDCurrency(voucher.total_amount || voucher.netTotal || 0);
    document.getElementById('totalPaidDisplay').textContent = formatBDCurrency(voucher.paid_amount || voucher.paidAmount || 0);
    document.getElementById('balanceDueDisplay').textContent = formatBDCurrency(voucher.balance_due || voucher.balanceDue || 0);
    
    // Load items if available
    if (voucher.items && voucher.items.length > 0) {
        const itemsContainer = document.getElementById('itemsContainer');
        itemsContainer.innerHTML = '';
        
        voucher.items.forEach(item => {
            addItem();
            const itemRows = itemsContainer.querySelectorAll('.item-row');
            const lastRow = itemRows[itemRows.length - 1];
            
            lastRow.querySelector('.item-name').value = item.name || '';
            lastRow.querySelector('.item-quantity').value = item.quantity || 1;
            lastRow.querySelector('.item-price').value = item.price || 0;
            lastRow.querySelector('.item-total').textContent = formatBDCurrency(item.total || 0);
        });
        
        calculateTotal();
    }
}

function printVoucher() {
    if (currentVoucherData) {
        saveClientFromVoucher(currentVoucherData);
    }
    window.print();
}

function downloadPDF() {
    if (currentVoucherData) {
        saveClientFromVoucher(currentVoucherData);
    }
    window.print();
}

function saveVoucher() {
    if (!currentVoucherData) return;

    // Auto-save client
    saveClientFromVoucher(currentVoucherData);

    const userData = getUserData();
    const existingIndex = userData.vouchers.findIndex(v => v.voucherNo === currentVoucherData.voucherNo);

    // Check if this is a NEW voucher (not an edit)
    const isNewVoucher = existingIndex < 0;

    if (existingIndex >= 0) {
        userData.vouchers[existingIndex] = {
            ...currentVoucherData,
            updatedAt: new Date().toISOString()
        };
    } else {
        userData.vouchers.push({
            ...currentVoucherData,
            savedAt: new Date().toISOString()
        });
        userData.voucherCounter = (userData.voucherCounter || 0) + 1;
    }

    saveUserData(userData);

    // Deduct stock from inventory (only for new vouchers)
    if (isNewVoucher) {
        deductInventoryStock(currentVoucherData.products);
    }

    showToast('Voucher saved successfully!', 'success');

    if (!isViewingHistory) {
        showDashboard();
    }
}

function deductInventoryStock(voucherProducts) {
    let inventory = getProducts();
    let updated = false;

    voucherProducts.forEach(product => {
        if (!product.productCode) {
            // Skip products not from inventory
            return;
        }

        const inventoryIndex = inventory.findIndex(p => p.code === product.productCode);

        if (inventoryIndex !== -1) {
            inventory[inventoryIndex].quantity -= product.qty;

            // Ensure quantity doesn't go below 0
            if (inventory[inventoryIndex].quantity < 0) {
                inventory[inventoryIndex].quantity = 0;
            }

            updated = true;
        }
    });

    if (updated) {
        saveProducts(inventory);
        refreshInventoryIfVisible();
    }
}

function refreshInventoryIfVisible() {
    // Check if inventory screen is currently visible
    const inventoryScreen = document.getElementById('inventoryScreen');

    if (inventoryScreen && !inventoryScreen.classList.contains('hidden')) {
        // Refresh inventory display
        loadInventory();
    }
}

// =====================================================
// VOUCHER HISTORY
// =====================================================

function loadVoucherHistory() {
    const userData = getUserData();
    const vouchers = userData.vouchers || [];
    renderVoucherList(vouchers);

    // Populate saler filters
    const salers = getSalers();
    const salerFilter = document.getElementById('salerFilter');
    const printSalerFilter = document.getElementById('printSalerFilter');

    // Populate search filter dropdown
    if (salerFilter) {
        salerFilter.innerHTML = '<option value="">All Salers</option>';
        Object.keys(salers).forEach(salerId => {
            const saler = salers[salerId];
            const option = document.createElement('option');
            option.value = salerId;
            option.textContent = saler.fullName;
            salerFilter.appendChild(option);
        });
    }

    // Populate print filter dropdown
    if (printSalerFilter) {
        printSalerFilter.innerHTML = '<option value="">All Salers</option>';
        Object.keys(salers).forEach(salerId => {
            const saler = salers[salerId];
            const option = document.createElement('option');
            option.value = salerId;
            option.textContent = saler.fullName;
            printSalerFilter.appendChild(option);
        });
    }

    // Reset filters
    if (document.getElementById('searchInput')) {
        document.getElementById('searchInput').value = '';
    }
    if (document.getElementById('searchFilter')) {
        document.getElementById('searchFilter').value = 'all';
    }
    if (salerFilter) {
        salerFilter.value = '';
    }
    if (printSalerFilter) {
        printSalerFilter.value = '';
    }
    if (document.getElementById('filterFromDate')) {
        document.getElementById('filterFromDate').value = '';
    }
    if (document.getElementById('filterToDate')) {
        document.getElementById('filterToDate').value = '';
    }
    if (document.getElementById('searchResultsInfo')) {
        document.getElementById('searchResultsInfo').classList.add('hidden');
    }
}

function renderVoucherList(vouchers) {
    const tbody = document.getElementById('historyTableBody');
    const noHistoryMsg = document.getElementById('noHistoryMessage');

    tbody.innerHTML = '';

    if (vouchers.length === 0) {
        noHistoryMsg.classList.remove('hidden');
        return;
    }

    noHistoryMsg.classList.add('hidden');

    // Get all salers for lookup
    const salers = getSalers();

    // Sort by newest first: priority = savedAt/updatedAt > voucherDate > voucherNo (descending)
    vouchers.sort((a, b) => {
        // First priority: most recently saved/updated
        const aTime = new Date(a.updatedAt || a.savedAt || a.voucherDate);
        const bTime = new Date(b.updatedAt || b.savedAt || b.voucherDate);

        if (aTime.getTime() !== bTime.getTime()) {
            return bTime - aTime; // Newest first
        }

        // Second priority: voucher date
        const aDate = new Date(a.voucherDate);
        const bDate = new Date(b.voucherDate);

        if (aDate.getTime() !== bDate.getTime()) {
            return bDate - aDate; // Newest first
        }

        // Third priority: voucher number (descending)
        const aNum = parseInt(a.voucherNo.replace(/\D/g, '')) || 0;
        const bNum = parseInt(b.voucherNo.replace(/\D/g, '')) || 0;
        return bNum - aNum; // Higher numbers first
    });

    vouchers.forEach(voucher => {
        let status = voucher.balanceDue <= 0 ? 'paid' : (voucher.paidAmount > 0 ? 'partial' : 'due');
        const statusClass = status === 'paid' ? 'status-paid' : (status === 'partial' ? 'status-partial' : 'status-due');
        const statusText = status === 'paid' ? 'Paid' : (status === 'partial' ? 'Partial' : 'Due');
        
        // Get saler name
        const salerName = voucher.salerId && salers[voucher.salerId] ? salers[voucher.salerId].fullName : 'N/A';

        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-4 py-3 text-sm text-gray-900">${voucher.voucherNo}</td>
            <td class="px-4 py-3 text-sm text-gray-500">${formatDate(voucher.voucherDate)}</td>
            <td class="px-4 py-3 text-sm text-gray-500">${salerName}</td>
            <td class="px-4 py-3 text-sm text-gray-900 font-medium">${voucher.clientName || '-'}</td>
            <td class="px-4 py-3 text-sm text-right font-semibold text-blue-600">${voucher.netTotal ? formatBDCurrency(voucher.netTotal) : '-'}</td>
            <td class="px-4 py-3 text-sm text-right text-orange-600">${voucher.previousDue ? formatBDCurrency(voucher.previousDue) : '-'}</td>
            <td class="px-4 py-3 text-sm text-right text-green-600">${voucher.paidAmount ? formatBDCurrency(voucher.paidAmount) : '-'}</td>
            <td class="px-4 py-3 text-sm text-right font-semibold text-red-600">${voucher.balanceDue ? formatBDCurrency(voucher.balanceDue) : '-'}</td>
            <td class="px-4 py-3 text-center"><span class="${statusClass}">${statusText}</span></td>
            <td class="px-4 py-3 text-center">
                <button onclick="viewVoucher('${voucher.voucherNo}')" class="text-blue-600 hover:text-blue-800 mr-2" title="View">
                    <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                </button>
                <button onclick="editVoucher('${voucher.voucherNo}')" class="text-green-600 hover:text-green-800 mr-2" title="Edit">
                    <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>

                <button onclick="deleteVoucher('${voucher.voucherNo}')" class="text-red-600 hover:text-red-800" title="Delete">
                    <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function searchVouchers() {
    const searchTerm = document.getElementById('searchInput') ? document.getElementById('searchInput').value.trim().toLowerCase() : '';
    const filter = document.getElementById('searchFilter') ? document.getElementById('searchFilter').value : 'all';
    const salerFilter = document.getElementById('salerFilter') ? document.getElementById('salerFilter').value : '';
    const userData = getUserData();
    let vouchers = userData.vouchers || [];

    // First filter by saler if selected
    if (salerFilter) {
        vouchers = vouchers.filter(v => v.salerId === salerFilter);
    }

    // Then filter by search term if provided
    if (!searchTerm && !salerFilter) {
        renderVoucherList(userData.vouchers || []);
        if (document.getElementById('searchResultsInfo')) {
            document.getElementById('searchResultsInfo').classList.add('hidden');
        }
        return;
    }

    let filtered = vouchers;
    if (searchTerm) {
        filtered = vouchers.filter(v => {
            const vNo = (v.voucherNo || '').toLowerCase();
            const cName = (v.clientName || '').toLowerCase();
            const cPhone = (v.clientPhone || '').toLowerCase();

            switch (filter) {
                case 'voucherNo': return vNo.includes(searchTerm);
                case 'clientName': return cName.includes(searchTerm);
                case 'clientPhone': return cPhone.includes(searchTerm);
                default: return vNo.includes(searchTerm) || cName.includes(searchTerm) || cPhone.includes(searchTerm);
            }
        });
    }

    renderVoucherList(filtered);
    const totalVouchers = userData.vouchers ? userData.vouchers.length : 0;
    if (document.getElementById('searchResultsCount')) {
        document.getElementById('searchResultsCount').textContent = `Found ${filtered.length} of ${totalVouchers} vouchers`;
    }
    if (document.getElementById('searchResultsInfo')) {
        document.getElementById('searchResultsInfo').classList.remove('hidden');
    }
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchFilter').value = 'all';
    document.getElementById('searchResultsInfo').classList.add('hidden');
    loadVoucherHistory();
}

function viewVoucher(voucherNo) {
    const userData = getUserData();
    const voucher = userData.vouchers.find(v => v.voucherNo === voucherNo);

    if (voucher) {
        isViewingHistory = true;
        currentVoucherData = voucher;
        renderVoucherPreview(voucher);
        hideAllScreens();
        document.getElementById('printPreviewScreen').classList.remove('hidden');
        setTimeout(autoScaleVoucherContent, 100);
    }
}

function editVoucher(voucherNo) {
    const userData = getUserData();
    const voucher = userData.vouchers.find(v => v.voucherNo === voucherNo);

    if (voucher) {
        isEditingVoucher = true;
        editingVoucherNo = voucherNo;

        showCreateVoucher(true);

        document.getElementById('voucherNo').value = voucher.voucherNo;
        document.getElementById('voucherDate').value = voucher.voucherDate;
        document.getElementById('voucherType').value = voucher.voucherType;
        document.getElementById('voucherTemplate').value = voucher.voucherTemplate || 'Default';
        document.getElementById('clientName').value = voucher.clientName;
        document.getElementById('clientPhone').value = voucher.clientPhone || '';
        document.getElementById('clientAddress').value = voucher.clientAddress || '';
        document.getElementById('clientEmail').value = voucher.clientEmail || '';
        document.getElementById('discount').value = voucher.discount || 0;
        
        // Recalculate previous due excluding current voucher
        const recalculatedPreviousDue = getClientPreviousDue(voucher.clientName, voucher.voucherNo);
        document.getElementById('previousPayment').value = recalculatedPreviousDue;
        
        document.getElementById('paidAmount').value = voucher.paidAmount || 0;
        document.getElementById('showNote').checked = voucher.showNote || false;
        document.getElementById('voucherNote').value = voucher.note || '';
        document.getElementById('showPaidSeal').checked = voucher.showPaidSeal || false;
        document.getElementById('showDueSeal').checked = voucher.showDueSeal || false;
        
        // Populate salers dropdown before setting value
        populateSalersDropdown();
        
        // Set saler if exists
        if (voucher.salerId) {
            document.getElementById('voucherSaler').value = voucher.salerId;
        }

        toggleNoteSection();

        const tbody = document.getElementById('productTableBody');
        tbody.innerHTML = '';

        if (voucher.products && voucher.products.length > 0) {
            voucher.products.forEach((product, index) => {
                const template = voucher.voucherTemplate || 'Default';
                const isWebsite = template === 'Website';
                const warranty = parseInt(product.warranty) || 0;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-2 py-2 text-center text-sm">${index + 1}</td>
                    <td class="px-2 py-2">
                        <input type="hidden" class="product-code" value="">
                        <input type="hidden" class="product-warranty" value="${warranty}">
                        <input type="text" class="input-field text-sm product-description" value="${product.description || ''}">
                        <div class="product-warranty-display text-xs text-gray-500 mt-1 ${warranty > 0 ? '' : 'hidden'}">Warranty: ${warranty} days</div>
                    </td>
                    <td class="px-2 py-2 qty-cell ${isWebsite ? 'hidden' : ''}">
                        <input type="number" class="input-field text-center text-sm product-qty" value="${product.qty || 1}" onchange="calculateRowAmount(this); calculateTotal()">
                    </td>
                    <td class="px-2 py-2 rate-cell ${isWebsite ? 'hidden' : ''}">
                        <input type="number" class="input-field text-right text-sm product-rate" value="${product.rate || 0}" onchange="calculateRowAmount(this); calculateTotal()">
                    </td>
                    <td class="px-2 py-2">
                        <input type="number" class="input-field text-right text-sm product-amount" value="${product.amount || 0}" onchange="calculateTotal()" ${isWebsite ? '' : 'readonly'}>
                    </td>
                    <td class="px-2 py-2 text-center">
                        <button type="button" onclick="removeProductRow(this)" class="text-red-600 hover:text-red-800 p-1">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            addProductRow();
        }

        calculateTotal();
        updateTemplateColumns();
    }
}

function deleteVoucher(voucherNo) {
    if (!confirm('Are you sure you want to delete this voucher?')) return;

    const userData = getUserData();
    const voucherToDelete = userData.vouchers.find(v => v.voucherNo === voucherNo);
    
    userData.vouchers = userData.vouchers.filter(v => v.voucherNo !== voucherNo);
    saveUserData(userData);
    
    loadVoucherHistory();
    showToast('Voucher deleted!', 'success');
}

function printDueList() {
    const userData = getUserData();
    const vouchers = (userData.vouchers || []).filter(v => v.balanceDue > 0);

    if (vouchers.length === 0) {
        showToast('No due vouchers found!', 'info');
        return;
    }

    printVoucherList(vouchers, 'Due Vouchers List', 'due');
}

function printPaidList() {
    const userData = getUserData();
    const vouchers = (userData.vouchers || []).filter(v => v.balanceDue <= 0);

    if (vouchers.length === 0) {
        showToast('No paid vouchers found!', 'info');
        return;
    }

    printVoucherList(vouchers, 'Paid Vouchers List', 'paid');
}

function printVoucherList(vouchers, title, listType) {
    const userData = getUserData();
    const settings = userData.settings || {};

    // Sort by date
    vouchers.sort((a, b) => new Date(b.voucherDate) - new Date(a.voucherDate));

    // Calculate totals
    let totalAmount = 0;
    let totalPaid = 0;
    let totalDue = 0;

    vouchers.forEach(v => {
        totalAmount += v.netTotal || 0;
        totalPaid += (v.paidAmount || 0);
        totalDue += v.balanceDue || 0;
    });

    // Create print window content
    const printContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif; 
            padding: 20px;
            background: white;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }
        .header h1 {
            font-size: 24px;
            color: #333;
            margin-bottom: 5px;
        }
        .header p {
            font-size: 12px;
            color: #666;
            margin: 3px 0;
        }
        .title {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin: 20px 0;
            color: ${listType === 'due' ? '#ef4444' : listType === 'paid' ? '#22c55e' : '#2563eb'};
            text-transform: uppercase;
        }
        .info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 12px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
            font-size: 12px;
        }
        th {
            background-color: #f3f4f6;
            font-weight: bold;
            color: #333;
        }
        tr:nth-child(even) {
            background-color: #fafafa;
        }
        .amount-cell {
            text-align: right;
            font-weight: 500;
        }
        .status-paid { 
            color: #22c55e; 
            font-weight: bold;
        }
        .status-partial { 
            color: #eab308; 
            font-weight: bold;
        }
        .status-due { 
            color: #ef4444; 
            font-weight: bold;
        }
        .summary {
            margin-top: 20px;
            padding: 15px;
            background-color: #f9fafb;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            font-size: 14px;
        }
        .summary-row.total {
            font-weight: bold;
            font-size: 16px;
            border-top: 2px solid #333;
            padding-top: 10px;
            margin-top: 10px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 10px;
            color: #666;
        }
        @media print {
            body { padding: 10px; }
            @page { margin: 10mm; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${settings.companyName || 'Company Name'}</h1>
        ${settings.companyAddress ? `<p>${settings.companyAddress}</p>` : ''}
        ${settings.companyPhone ? `<p>Phone: ${settings.companyPhone}</p>` : ''}
        ${settings.companyEmail ? `<p>Email: ${settings.companyEmail}</p>` : ''}
    </div>
    
    <div class="title">${title}</div>
    
    <div class="info">
        <div>Total Vouchers: <strong>${vouchers.length}</strong></div>
        <div>Print Date: <strong>${formatDate(new Date().toISOString().split('T')[0])}</strong></div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th style="width: 50px;">SL</th>
                <th>Voucher No</th>
                <th>Date</th>
                <th>Client Name</th>
                <th>Phone</th>
                <th>Total Amount</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${vouchers.map((v, index) => {
        let status = v.balanceDue <= 0 ? 'paid' : (v.paidAmount > 0 ? 'partial' : 'due');
        // Check if product has been returned
        if (v.returns && v.returns.length > 0) {
            status = 'returned';
        }
        const statusClass = status === 'paid' ? 'status-paid' : (status === 'partial' ? 'status-partial' : (status === 'returned' ? 'status-returned' : 'status-due'));
        const statusText = status === 'paid' ? 'Paid' : (status === 'partial' ? 'Partial' : (status === 'returned' ? 'Returned' : 'Due'));

        return `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${v.voucherNo}</td>
                        <td>${formatDate(v.voucherDate)}</td>
                        <td style="text-align: left;">${v.clientName}</td>
                        <td>${v.clientPhone || '-'}</td>
                        <td class="amount-cell">${formatBDCurrency(v.netTotal)}</td>
                        <td class="amount-cell">${formatBDCurrency(v.paidAmount || 0)}</td>
                        <td class="amount-cell">${formatBDCurrency(v.balanceDue)}</td>
                        <td class="${statusClass}">${statusText}</td>
                    </tr>
                `;
    }).join('')}
        </tbody>
    </table>
    
    <div class="summary">
        <div class="summary-row">
            <span>Total Amount:</span>
            <span>${formatBDCurrency(totalAmount)}</span>
        </div>
        <div class="summary-row">
            <span>Total Paid:</span>
            <span style="color: #22c55e;">${formatBDCurrency(totalPaid)}</span>
        </div>
        <div class="summary-row total">
            <span>Total Due:</span>
            <span style="color: #ef4444;">${formatBDCurrency(totalDue)}</span>
        </div>
    </div>
    
    <div class="footer">
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>© ${new Date().getFullYear()} ${settings.companyName || 'BazarPOS'}. All rights reserved.</p>
    </div>
    
    <script>
        window.onload = function() {
            window.print();
        };
    </script>
</body>
</html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(printContent);
    printWindow.document.close();
}

function printAllVouchers() {
    const userData = getUserData();
    let vouchers = userData.vouchers || [];

    const fromDate = document.getElementById('filterFromDate').value;
    const toDate = document.getElementById('filterToDate').value;
    const salerFilter = document.getElementById('printSalerFilter').value;
    const salers = getSalers();

    // Filter by date range if provided
    if (fromDate || toDate) {
        vouchers = vouchers.filter(v => {
            const voucherDate = new Date(v.voucherDate);
            const from = fromDate ? new Date(fromDate) : new Date('1900-01-01');
            const to = toDate ? new Date(toDate) : new Date('2100-12-31');

            return voucherDate >= from && voucherDate <= to;
        });
    }

    // Filter by saler if provided
    if (salerFilter) {
        vouchers = vouchers.filter(v => v.salerId === salerFilter);
    }

    if (vouchers.length === 0) {
        showToast('No vouchers found in the selected filters!', 'info');
        return;
    }

    let title = 'All Vouchers List';
    let filterParts = [];

    if (fromDate && toDate) {
        filterParts.push(`${formatDate(fromDate)} to ${formatDate(toDate)}`);
    } else if (fromDate) {
        filterParts.push(`From ${formatDate(fromDate)}`);
    } else if (toDate) {
        filterParts.push(`To ${formatDate(toDate)}`);
    }

    if (salerFilter && salers[salerFilter]) {
        filterParts.push(`Saler: ${salers[salerFilter].fullName}`);
    }

    if (filterParts.length > 0) {
        title += ` (${filterParts.join(' - ')})`;
    }

    printVoucherList(vouchers, title, 'all');
}

function clearDateFilter() {
    document.getElementById('filterFromDate').value = '';
    document.getElementById('filterToDate').value = '';
    document.getElementById('printSalerFilter').value = '';
}


// =====================================================
// DASHBOARD STATS & CHARTS
// =====================================================

function updateDashboardStats() {
    const userData = getUserData();
    const vouchers = userData.vouchers || [];

    // Get current date for monthly comparison
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // All time stats
    let totalAmount = 0;
    let totalPaid = 0;
    let totalDue = 0;

    // Monthly stats
    let monthlyAmount = 0;
    let monthlyPaid = 0;
    let monthlyDue = 0;
    let monthlyVouchers = 0;

    vouchers.forEach(v => {
        totalAmount += v.netTotal || 0;
        totalPaid += (v.paidAmount || 0);
        totalDue += v.balanceDue || 0;

        // Check if voucher is from current month
        const vDate = new Date(v.voucherDate);
        if (vDate.getMonth() === currentMonth && vDate.getFullYear() === currentYear) {
            monthlyAmount += v.netTotal || 0;
            monthlyPaid += (v.paidAmount || 0);
            monthlyDue += v.balanceDue || 0;
            monthlyVouchers += 1;
        }
    });

    // Update All Time Stats
    document.getElementById('statTotalVouchers').textContent = vouchers.length;
    document.getElementById('statTotalAmount').textContent = formatBDCurrency(totalAmount);
    document.getElementById('statTotalPaid').textContent = formatBDCurrency(totalPaid);
    document.getElementById('statTotalDue').textContent = formatBDCurrency(totalDue);

    // Update Monthly Stats
    document.getElementById('statMonthlyVouchers').textContent = monthlyVouchers;
    document.getElementById('statMonthlyAmount').textContent = formatBDCurrency(monthlyAmount);
    document.getElementById('statMonthlyPaid').textContent = formatBDCurrency(monthlyPaid);
    document.getElementById('statMonthlyDue').textContent = formatBDCurrency(monthlyDue);

    // Update Income & Expense Overview by Inventory
    updateIncomeExpenseOverview(vouchers, userData.products || []);

    // Update Low Stock Alerts
    const products = userData.products || [];
    const lowStockItems = products.filter(p => {
        const status = getStockStatus(p);
        return status === 'low' || status === 'out';
    });

    const alertsDiv = document.getElementById('dashboardStockAlerts');
    const alertsBody = document.getElementById('dashboardStockAlertsBody');

    if (lowStockItems.length > 0) {
        alertsDiv.classList.remove('hidden');
        alertsBody.innerHTML = lowStockItems.slice(0, 5).map(product => {
            const stockStatus = getStockStatus(product);
            const badgeClass = stockStatus === 'out' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';
            const statusText = stockStatus === 'out' ? 'Out of Stock' : 'Low Stock';

            return `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${product.code}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-center font-bold ${stockStatus === 'out' ? 'text-red-600' : 'text-gray-900'}">${product.quantity}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}">
                            ${statusText}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    } else {
        alertsDiv.classList.add('hidden');
    }
}

function updateIncomeExpenseOverview(vouchers, products) {
    // Get current date for monthly comparison
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate total income from vouchers (includes all products and paid amounts)
    let totalIncome = 0;
    let monthlyIncome = 0;

    vouchers.forEach(voucher => {
        const vDate = new Date(voucher.voucherDate);
        const voucherPaidAmount = voucher.paidAmount || 0;
        
        // Add paid amount to income
        totalIncome += voucherPaidAmount;
        if (vDate.getMonth() === currentMonth && vDate.getFullYear() === currentYear) {
            monthlyIncome += voucherPaidAmount;
        }
    });

    // Calculate total expense from inventory (purchase price × quantity) + cost of goods sold
    let totalExpense = 0;
    let monthlyExpense = 0;

    // Add current inventory value to total expense
    products.forEach(product => {
        const totalCost = (product.quantity || 0) * (product.purchasePrice || product.price || 0);
        totalExpense += totalCost;

        // If this product was added in the current month, include its purchase cost in monthly expense
        if (product.createdAt) {
            try {
                const created = new Date(product.createdAt);
                if (created.getMonth() === currentMonth && created.getFullYear() === currentYear) {
                    monthlyExpense += totalCost;
                }
            } catch (e) {
                // invalid date, ignore
            }
        }
    });

    // Add cost of all goods ever sold (all-time and monthly)
    vouchers.forEach(voucher => {
        const vDate = new Date(voucher.voucherDate);
        if (voucher.products) {
            voucher.products.forEach(item => {
                // Find the product in inventory to get purchase price
                const product = products.find(p => p.code === item.productCode);
                if (product) {
                    const purchasePrice = product.purchasePrice || product.price || 0;
                    const itemCost = (item.qty || 0) * purchasePrice;
                    // Add to all-time expense
                    totalExpense += itemCost;
                    // Add to monthly expense if sold this month
                    if (vDate.getMonth() === currentMonth && vDate.getFullYear() === currentYear) {
                        monthlyExpense += itemCost;
                    }
                }
            });
        }
    });

    // Include external expenses into totals
    const externalIncomeExpense = getExternalIncomeExpense();
    let extTotalExpense = 0;
    let extMonthlyExpense = 0;
    externalIncomeExpense.expense.forEach(exp => {
        const date = new Date(exp.date);
        extTotalExpense += exp.amount || 0;
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            extMonthlyExpense += exp.amount || 0;
        }
    });

    // Add external expenses to inventory-based totals
    totalExpense += extTotalExpense;
    monthlyExpense += extMonthlyExpense;

    // Update DOM elements
    document.getElementById('statMonthlyIncome').textContent = formatBDCurrency(monthlyIncome);
    document.getElementById('statMonthlyExpense').textContent = formatBDCurrency(monthlyExpense);
    document.getElementById('statTotalIncome').textContent = formatBDCurrency(totalIncome);
    document.getElementById('statTotalExpense').textContent = formatBDCurrency(totalExpense);

    // Update external expense only
    updateExternalExpenseStats();
}

function updateExternalExpenseStats() {
    const incomeExpense = getExternalIncomeExpense();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalExternalExpense = 0;
    let monthlyExternalExpense = 0;

    // Calculate external expense only (removed income)
    incomeExpense.expense.forEach(expense => {
        const date = new Date(expense.date);
        totalExternalExpense += expense.amount;
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            monthlyExternalExpense += expense.amount;
        }
    });

    // Update DOM elements for expense only
    const monthlyExpenseEl = document.getElementById('statMonthlyExternalExpense');
    const totalExpenseEl = document.getElementById('statTotalExternalExpense');
    
    if (monthlyExpenseEl) monthlyExpenseEl.textContent = formatBDCurrency(monthlyExternalExpense);
    if (totalExpenseEl) totalExpenseEl.textContent = formatBDCurrency(totalExternalExpense);
}

// =====================================================
// REPORTS: Income / Expense Details
// =====================================================

let currentReportState = {
    type: 'income', // 'income' or 'expense'
    range: 'all', // 'all', 'monthly', or custom date range
    fromDate: null,
    toDate: null
};

// Populate report saler filter dropdown
function populateReportSalerFilter() {
    const salers = getSalers();
    const salerSelect = document.getElementById('reportSalerFilter');
    
    if (!salerSelect) return;
    
    // Keep the "All Salers" option and add saler options
    let options = '<option value="">All Salers</option>';
    
    Object.entries(salers).forEach(([salerId, saler]) => {
        options += `<option value="${salerId}">${saler.fullName}</option>`;
    });
    
    salerSelect.innerHTML = options;
}

// Apply report filter (including saler filter)
function applyReportDateFilter() {
    const fromDate = document.getElementById('reportFromDate').value;
    const toDate = document.getElementById('reportToDate').value;
    const salerFilter = document.getElementById('reportSalerFilter').value;

    if (!fromDate || !toDate) {
        showToast('Please select both From and To dates', 'warning');
        return;
    }

    currentReportState.range = 'custom';
    currentReportState.fromDate = fromDate;
    currentReportState.toDate = toDate;
    currentReportState.salerFilter = salerFilter;

    // Refresh the current report with new dates and saler filter
    if (currentReportState.type === 'income') {
        showIncomeReportCustom(fromDate, toDate, salerFilter);
    } else {
        showExpenseReportCustom(fromDate, toDate, salerFilter);
    }
}

function clearReportDateFilter() {
    document.getElementById('reportFromDate').value = '';
    document.getElementById('reportToDate').value = '';
    currentReportState.range = 'all';
    currentReportState.fromDate = null;
    currentReportState.toDate = null;

    // Refresh report
    if (currentReportState.type === 'income') {
        showIncomeReport('all');
    } else {
        showExpenseReport('all');
    }
}

function renderReportTable(title, columns, rows, footerHtml = '', totalsConfig = null) {
    document.getElementById('reportTitle').textContent = title;
    const container = document.getElementById('reportContent');
    let html = '<h3 class="text-lg font-semibold text-gray-800 mb-4">' + title + '</h3>';
    html += '<table class="report-table"><thead><tr>';
    columns.forEach(col => html += `<th>${col}</th>`);
    html += '</tr></thead><tbody>';

    if (rows.length === 0) {
        html += '<tr><td style="text-align: center; padding: 20px;" colspan="' + columns.length + '">No records found.</td></tr>';
    } else {
        rows.forEach(r => {
            html += '<tr>';
            columns.forEach(c => {
                const key = c.key || c;
                html += `<td>${r[key] !== undefined ? r[key] : ''}</td>`;
            });
            html += '</tr>';
        });

        // Add totals row if config provided
        if (totalsConfig && rows.length > 0) {
            html += '<tr class="totals-row">';
            columns.forEach((col, idx) => {
                if (col === totalsConfig.label) {
                    html += `<td>TOTAL</td>`;
                } else if (totalsConfig.columns.includes(col)) {
                    const total = calculateColumnTotal(rows, col);
                    html += `<td>${total}</td>`;
                } else {
                    html += `<td></td>`;
                }
            });
            html += '</tr>';
        }
    }

    html += '</tbody></table>';
    if (footerHtml) html += '<div class="mt-4">' + footerHtml + '</div>';
    container.innerHTML = html;

    hideAllScreens();
    document.getElementById('reportScreen').classList.remove('hidden');
}

function calculateColumnTotal(rows, columnName) {
    let total = 0;
    rows.forEach(row => {
        const value = row[columnName];
        if (value && typeof value === 'string') {
            // Extract number from formatted currency (e.g., "৳1000.00" -> 1000.00)
            const match = value.match(/[\d,.]+/);
            if (match) {
                const numStr = match[0].replace(/,/g, '');
                total += parseFloat(numStr) || 0;
            }
        } else if (typeof value === 'number') {
            total += value;
        }
    });

    // Return formatted total
    return formatBDCurrency(total);
}

function showIncomeReport(range = 'all') {
    currentReportState.type = 'income';
    currentReportState.range = range;
    currentReportState.fromDate = null;
    currentReportState.toDate = null;

    // Clear date filters and saler filter
    document.getElementById('reportFromDate').value = '';
    document.getElementById('reportToDate').value = '';
    document.getElementById('reportSalerFilter').value = '';

    // Populate saler filter dropdown
    populateReportSalerFilter();

    const userData = getUserData();
    const products = userData.products || [];
    const vouchers = userData.vouchers || [];
    const salers = getSalers();

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const rows = [];
    let totalSales = 0;
    let totalPaid = 0;
    let totalCost = 0;

    vouchers.forEach(v => {
        const vDate = new Date(v.voucherDate);
        if (range === 'monthly' && !(vDate.getMonth() === currentMonth && vDate.getFullYear() === currentYear)) return;
        if (!v.products || !Array.isArray(v.products)) return;

        const salerName = v.salerId && salers[v.salerId] ? salers[v.salerId].fullName : 'N/A';
        const voucherPaidAmount = v.paidAmount || 0;
        let voucherTotal = 0;
        let voucherCost = 0;

        v.products.forEach(item => {
            const salePrice = item.price || 0;
            const qty = item.qty || 0;
            const lineTotal = (qty * salePrice) || 0;
            
            // Get cost from product if it exists in inventory
            const product = products.find(p => p.code === item.productCode);
            const purchasePrice = product ? (product.purchasePrice || product.price || 0) : 0;
            const cost = qty * purchasePrice;
            const profit = lineTotal - cost;

            voucherTotal += lineTotal;
            voucherCost += cost;

            rows.push({
                'Saler': salerName,
                'Voucher No': v.voucherNo,
                'Date': formatDate(v.voucherDate),
                'Product Code': item.productCode || '-',
                'Product Name': item.description || '-',
                'Qty': qty,
                'Sale Price': formatBDCurrency(salePrice),
                'Line Total': formatBDCurrency(lineTotal),
                'Cost': formatBDCurrency(cost),
                'Profit': formatBDCurrency(profit),
                'Paid Amount': formatBDCurrency(voucherPaidAmount)
            });
        });

        totalSales += voucherTotal;
        totalPaid += voucherPaidAmount;
        totalCost += voucherCost;
    });

    // Add paid amount column
    const columns = ['Saler', 'Voucher No', 'Date', 'Product Code', 'Product Name', 'Qty', 'Sale Price', 'Line Total', 'Cost', 'Profit', 'Paid Amount'];
    renderReportTable(range === 'monthly' ? 'This Month - Income Details' : 'All Time - Income Details', columns, rows);
}

function showIncomeReportCustom(fromDate, toDate, salerFilter = '') {
    const userData = getUserData();
    const products = userData.products || [];
    const vouchers = userData.vouchers || [];
    const salers = getSalers();

    const from = new Date(fromDate);
    const to = new Date(toDate);

    const rows = [];
    let totalSales = 0;
    let totalPaid = 0;
    let totalCost = 0;

    vouchers.forEach(v => {
        const vDate = new Date(v.voucherDate);
        if (vDate < from || vDate > to) return;
        
        // Filter by saler if specified
        if (salerFilter && v.salerId !== salerFilter) return;
        
        if (!v.products || !Array.isArray(v.products)) return;

        const salerName = v.salerId && salers[v.salerId] ? salers[v.salerId].fullName : 'N/A';
        const voucherPaidAmount = v.paidAmount || 0;
        let voucherTotal = 0;
        let voucherCost = 0;

        v.products.forEach(item => {
            const salePrice = item.price || 0;
            const qty = item.qty || 0;
            const lineTotal = (qty * salePrice) || 0;
            
            // Get cost from product if it exists in inventory
            const product = products.find(p => p.code === item.productCode);
            const purchasePrice = product ? (product.purchasePrice || product.price || 0) : 0;
            const cost = qty * purchasePrice;
            const profit = lineTotal - cost;

            voucherTotal += lineTotal;
            voucherCost += cost;

            rows.push({
                'Saler': salerName,
                'Voucher No': v.voucherNo,
                'Date': formatDate(v.voucherDate),
                'Product Code': item.productCode || '-',
                'Product Name': item.description || '-',
                'Qty': qty,
                'Sale Price': formatBDCurrency(salePrice),
                'Line Total': formatBDCurrency(lineTotal),
                'Cost': formatBDCurrency(cost),
                'Profit': formatBDCurrency(profit),
                'Paid Amount': formatBDCurrency(voucherPaidAmount)
            });
        });

        totalSales += voucherTotal;
        totalPaid += voucherPaidAmount;
        totalCost += voucherCost;
    });

    const columns = ['Saler', 'Voucher No', 'Date', 'Product Code', 'Product Name', 'Qty', 'Sale Price', 'Line Total', 'Cost', 'Profit', 'Paid Amount'];
    renderReportTable(`Income Details (${fromDate} to ${toDate})`, columns, rows);
}

function showExpenseReport(range = 'all') {
    currentReportState.type = 'expense';
    currentReportState.range = range;
    currentReportState.fromDate = null;
    currentReportState.toDate = null;

    // Clear date filters
    document.getElementById('reportFromDate').value = '';
    document.getElementById('reportToDate').value = '';

    const userData = getUserData();
    const products = userData.products || [];
    const vouchers = userData.vouchers || [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // For all-time expense show inventory stock costs; for monthly show sold-items cost for the month
    if (range === 'all') {
        const rows = products.map(p => ({
            'Product Code': p.code,
            'Product Name': p.name,
            'Qty In Stock': p.quantity || 0,
            'Purchase Price': formatBDCurrency(p.purchasePrice || p.price || 0),
            'Total Cost': formatBDCurrency((p.quantity || 0) * (p.purchasePrice || p.price || 0))
        }));

        // Include external expenses (all time)
        const externalAll = getExternalIncomeExpense().expense || [];
        externalAll.forEach(exp => {
            rows.push({
                'Product Code': 'EXT',
                'Product Name': exp.description || exp.comment || 'External Expense',
                'Qty In Stock': formatDate(exp.date),
                'Purchase Price': exp.source || exp.spentBy || '',
                'Total Cost': formatBDCurrency(exp.amount || 0)
            });
        });

        const columns = ['Product Code', 'Product Name', 'Qty In Stock', 'Purchase Price', 'Total Cost'];
        renderReportTable('Inventory & Expenses (All Time)', columns, rows);
    }
}

// =====================================================
// INITIALIZATION & APP STARTUP
// =====================================================

function init() {
    try {
        console.log('Initializing app...');
        
        // Setup event listeners
        setupEventListeners();
        setupInactivityListeners();
        setupSidebarMenuClickListener();
        initRouter();

        // Set copyright year
        const copyrightYearEl = document.getElementById('copyrightYear');
        if (copyrightYearEl) {
            copyrightYearEl.textContent = new Date().getFullYear();
        }

        // Initialize super admin and data
        initializeSuperAdmin();
        initializeSampleProduct();

        // Check for existing session
        const session = getSession();
        const users = getUsers();

        if (session && users[session]) {
            currentUser = session;
            syncClientsFromHistory();
            resetInactivityTimer();

            // Handle initial route
            if (window.location.hash) {
                handleRouteChange();
            } else {
                window.location.hash = 'dashboard';
            }
        } else {
            // Not logged in
            window.location.hash = 'dashboard';
            handleRouteChange();
        }
        
        // Update site header and favicon
        updateSiteHeaderDisplay();
        updatePageFavicon();
        
        console.log('App initialization complete');
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Error starting application: ' + error.message, 'error');
    }
}

function setupEventListeners() {
    try {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.addEventListener('submit', handleLogin);

        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) changePasswordForm.addEventListener('submit', handleChangePassword);

        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) settingsForm.addEventListener('submit', handleSettingsSave);

        const siteSettingsForm = document.getElementById('siteSettingsForm');
        if (siteSettingsForm) siteSettingsForm.addEventListener('submit', handleSiteSettingsSave);

        const productForm = document.getElementById('productForm');
        if (productForm) productForm.addEventListener('submit', handleProductSave);

        const addProductForm = document.getElementById('addProductForm');
        if (addProductForm) addProductForm.addEventListener('submit', handleAddProductForm);

        const userForm = document.getElementById('userForm');
        if (userForm) userForm.addEventListener('submit', handleUserForm);

        const clientForm = document.getElementById('clientForm');
        if (clientForm) clientForm.addEventListener('submit', saveClient);

        const salerForm = document.getElementById('salerForm');
        if (salerForm) salerForm.addEventListener('submit', handleSalerForm);

        const incomeForm = document.getElementById('incomeForm');
        if (incomeForm) incomeForm.addEventListener('submit', handleIncomeForm);

        const expenseForm = document.getElementById('expenseForm');
        if (expenseForm) expenseForm.addEventListener('submit', handleExpenseForm);

        const personForm = document.getElementById('personForm');
        if (personForm) personForm.addEventListener('submit', handlePersonForm);

        console.log('Event listeners setup complete');
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

function setupSidebarMenuClickListener() {
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth < 1024) {
                closeSidebar();
            }
        });
    });
}

function initRouter() {
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    
    document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-route]');
        if (target) {
            e.preventDefault();
            const route = target.getAttribute('data-route');
            navigateTo(route);
        }
    });
}

function handleRouteChange() {
    if (!currentUser) {
        showLoginScreen();
        return;
    }

    const hash = window.location.hash.substring(1) || 'dashboard';

    switch(hash) {
        case 'dashboard': showDashboard(); break;
        case 'voucher': showCreateVoucher(false); break;
        case 'history': showVoucherHistory(); break;
        case 'inventory': showInventory(); break;
        case 'add-product': showAddProductScreen(); break;
        case 'clients': showClients(); break;
        case 'salers': showManageSalers(); break;
        case 'external-transactions': showExternalTransactions(); break;
        case 'barcode': showBarcodeScreen(); break;
        case 'settings': showSettings(); break;
        case 'site-settings': showSiteSettings(); break;
        case 'profile': showProfile(); break;
        case 'change-password': showChangePassword(); break;
        case 'companies': showManageUsers(); break;
        default: showDashboard();
    }
}

function initializeSampleProduct() {
    const userData = getUserData();
    if (!userData) {
        // No user logged in yet - skip initialization
        return;
    }
    if (!userData.products || userData.products.length === 0) {
        userData.products = [];
        saveUserData(userData);
    }
}

// App entry point
document.addEventListener('DOMContentLoaded', init);
