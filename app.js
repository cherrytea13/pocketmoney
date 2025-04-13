// 데이터 저장소 - 예산과 거래 데이터를 별도로 관리
let budgetRecords = [];
let transactionRecords = [];
let savingsRecords = [];
let initialSetupComplete = false;
let currentBalance = 0;

// DOM 요소
const initialSetupPage = document.getElementById('initial-setup');
const homePage = document.getElementById('home-page');
const budgetFormPage = document.getElementById('budget-form');
const transactionFormPage = document.getElementById('transaction-form-page');
const budgetPage = document.getElementById('budget-page');
const transactionPage = document.getElementById('transaction-page');
const tabMenu = document.getElementById('tab-menu');

// 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
    // flatpickr 초기화 및 한국어 로케일 적용
    const flatpickrConfig = {
        locale: 'ko',
        dateFormat: 'Y/m/d',
        defaultDate: new Date(),
        allowInput: true
    };
    
    // 모든 날짜 선택기에 flatpickr 적용
    document.querySelectorAll('.datepicker').forEach(element => {
        flatpickr(element, flatpickrConfig);
    });
    
    // localStorage에서 데이터 불러오기
    loadData();
    
    // 초기 설정 완료 여부 확인
    if (initialSetupComplete) {
        showHomePage();
    } else {
        showInitialSetupPage();
    }
    
    // 이벤트 리스너 설정
    setupEventListeners();
});

// 모든 이벤트 리스너 설정
function setupEventListeners() {
    // 초기 설정 버튼 클릭
    document.getElementById('start-button').addEventListener('click', handleInitialSetup);
    
    // 탭 전환
    document.getElementById('home-tab').addEventListener('click', showHomePage);
    document.getElementById('budget-tab').addEventListener('click', showBudgetPage);
    document.getElementById('transaction-tab').addEventListener('click', showTransactionPage);
    document.getElementById('savings-tab').addEventListener('click', showSavingsPage);
    
    // 예산 페이지 버튼
    document.getElementById('add-budget-expense-button').addEventListener('click', showBudgetExpenseForm);
    document.getElementById('add-budget-income-button').addEventListener('click', showBudgetIncomeForm);
    
    // 거래 페이지 버튼
    document.getElementById('add-transaction-expense-button').addEventListener('click', showTransactionExpenseForm);
    document.getElementById('add-transaction-income-button').addEventListener('click', showTransactionIncomeForm);
    
    // 저축 페이지 버튼
    document.getElementById('add-savings-button').addEventListener('click', showSavingsForm);
    
    // 예산 폼 제출
    document.getElementById('budget-expense-form').addEventListener('submit', handleBudgetExpenseFormSubmit);
    document.getElementById('budget-income-form').addEventListener('submit', handleBudgetIncomeFormSubmit);
    
    // 거래 폼 제출
    document.getElementById('transaction-expense-form').addEventListener('submit', handleTransactionExpenseFormSubmit);
    document.getElementById('transaction-income-form').addEventListener('submit', handleTransactionIncomeFormSubmit);
    
    // 저축 폼 제출
    document.getElementById('savings-form-element').addEventListener('submit', handleSavingsFormSubmit);
    
    // 취소 버튼
    document.getElementById('budget-expense-cancel-button').addEventListener('click', showBudgetPage);
    document.getElementById('budget-income-cancel-button').addEventListener('click', showBudgetPage);
    document.getElementById('transaction-expense-cancel-button').addEventListener('click', showTransactionPage);
    document.getElementById('transaction-income-cancel-button').addEventListener('click', showTransactionPage);
    document.getElementById('savings-cancel-button').addEventListener('click', showSavingsPage);
    
    // 필터 변경
    document.getElementById('budget-month-filter').addEventListener('change', updateBudgetTable);
    document.getElementById('budget-category-filter').addEventListener('change', updateBudgetTable);
    document.getElementById('budget-sort-order').addEventListener('change', updateBudgetTable);
    
    document.getElementById('transaction-month-filter').addEventListener('change', updateTransactionTable);
    document.getElementById('transaction-category-filter').addEventListener('change', updateTransactionTable);
    document.getElementById('transaction-sort-order').addEventListener('change', updateTransactionTable);
    
    document.getElementById('savings-month-filter').addEventListener('change', updateSavingsTable);
    document.getElementById('savings-category-filter').addEventListener('change', updateSavingsTable);
    document.getElementById('savings-sort-order').addEventListener('change', updateSavingsTable);
}

// 초기 설정 처리
function handleInitialSetup(event) {
    if (event) {
        event.preventDefault();
    }
    
    const initialBalance = parseFloat(document.getElementById('initial-balance').value) || 0;
    
    if (initialBalance < 0) {
        alert('초기 잔액은 0 이상이어야 합니다.');
        return;
    }
    
    // 초기 예산과 거래 기록 생성
    const today = new Date();
    const initialDate = today.toISOString().split('T')[0];
    
    // 초기 예산 기록
    const initialBudgetRecord = {
        date: initialDate,
        description: '초기 잔액',
        category: '기타',
        income: initialBalance,
        expense: 0,
        balance: initialBalance
    };
    
    // 초기 거래 기록
    const initialTransactionRecord = {
        date: initialDate,
        description: '초기 잔액',
        category: '기타',
        income: initialBalance,
        expense: 0,
        balance: initialBalance
    };
    
    budgetRecords.push(initialBudgetRecord);
    transactionRecords.push(initialTransactionRecord);
    initialSetupComplete = true;
    
    // 데이터 저장
    saveData();
    
    // 홈 페이지 표시
    showHomePage();
}

// 예산 지출 폼 제출 처리
function handleBudgetExpenseFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const isEditMode = form.getAttribute('data-edit-mode') === 'true';
    const editIndex = parseInt(form.getAttribute('data-edit-index'));
    
    const date = document.getElementById('budget-expense-date').value;
    const description = document.getElementById('budget-expense-description').value;
    const category = document.getElementById('budget-expense-category').value;
    const expense = parseFloat(document.getElementById('budget-expense-amount').value) || 0;
    
    if (category === '') {
        alert('카테고리를 선택해주세요.');
        return;
    }
    
    if (expense === 0) {
        alert('지출 금액을 입력해주세요.');
        return;
    }
    
    if (isEditMode) {
        // 기존 기록 수정
        budgetRecords[editIndex] = {
            date,
            description,
            category,
            income: 0,
            expense,
            balance: 0 // 임시 값, 재계산에서 업데이트
        };
        
        // 잔액 재계산
        recalculateBalances(budgetRecords);
        
        // 편집 모드 초기화
        form.removeAttribute('data-edit-mode');
        form.removeAttribute('data-edit-index');
        form.removeAttribute('data-edit-type');
    } else {
        // 새 잔액 계산
        const latestBalance = budgetRecords.length > 0 ? budgetRecords[budgetRecords.length - 1].balance : 0;
        const newBalance = latestBalance - expense;
        
        // 새 예산 기록 생성
        const newBudgetRecord = {
            date,
            description,
            category,
            income: 0,
            expense,
            balance: newBalance
        };
        
        budgetRecords.push(newBudgetRecord);
    }
    
    // 데이터 저장
    saveData();
    
    // 폼 초기화
    form.reset();
    const budgetExpenseDatePicker = document.getElementById('budget-expense-date')._flatpickr;
    if (budgetExpenseDatePicker) {
        budgetExpenseDatePicker.setDate(new Date());
    }
    document.getElementById('budget-expense-amount').value = 0;
    
    // 예산 페이지로 이동
    showBudgetPage();
}

// 예산 수입 폼 제출 처리
function handleBudgetIncomeFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const isEditMode = form.getAttribute('data-edit-mode') === 'true';
    const editIndex = parseInt(form.getAttribute('data-edit-index'));
    
    const date = document.getElementById('budget-income-date').value;
    const description = document.getElementById('budget-income-description').value;
    const category = document.getElementById('budget-income-category').value;
    const income = parseFloat(document.getElementById('budget-income-amount').value) || 0;
    
    if (category === '') {
        alert('카테고리를 선택해주세요.');
        return;
    }
    
    if (income === 0) {
        alert('수입 금액을 입력해주세요.');
        return;
    }
    
    if (isEditMode) {
        // 기존 기록 수정
        budgetRecords[editIndex] = {
            date,
            description,
            category,
            income,
            expense: 0,
            balance: 0 // 임시 값, 재계산에서 업데이트
        };
        
        // 잔액 재계산
        recalculateBalances(budgetRecords);
        
        // 편집 모드 초기화
        form.removeAttribute('data-edit-mode');
        form.removeAttribute('data-edit-index');
        form.removeAttribute('data-edit-type');
    } else {
        // 새 잔액 계산
        const latestBalance = budgetRecords.length > 0 ? budgetRecords[budgetRecords.length - 1].balance : 0;
        const newBalance = latestBalance + income;
        
        // 새 예산 기록 생성
        const newBudgetRecord = {
            date,
            description,
            category,
            income,
            expense: 0,
            balance: newBalance
        };
        
        budgetRecords.push(newBudgetRecord);
    }
    
    // 데이터 저장
    saveData();
    
    // 폼 초기화
    form.reset();
    const budgetIncomeDatePicker = document.getElementById('budget-income-date')._flatpickr;
    if (budgetIncomeDatePicker) {
        budgetIncomeDatePicker.setDate(new Date());
    }
    document.getElementById('budget-income-amount').value = 0;
    
    // 예산 페이지로 이동
    showBudgetPage();
}

// 거래 지출 폼 제출 처리
function handleTransactionExpenseFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const isEditMode = form.getAttribute('data-edit-mode') === 'true';
    const editIndex = parseInt(form.getAttribute('data-edit-index'));
    
    const date = document.getElementById('transaction-expense-date').value;
    const description = document.getElementById('transaction-expense-description').value;
    const category = document.getElementById('transaction-expense-category').value;
    const expense = parseFloat(document.getElementById('transaction-expense-amount').value) || 0;
    
    if (category === '') {
        alert('카테고리를 선택해주세요.');
        return;
    }
    
    if (expense === 0) {
        alert('지출 금액을 입력해주세요.');
        return;
    }
    
    if (isEditMode) {
        // 기존 기록 수정
        transactionRecords[editIndex] = {
            date,
            description,
            category,
            income: 0,
            expense,
            balance: 0 // 임시 값, 재계산에서 업데이트
        };
        
        // 잔액 재계산
        recalculateBalances(transactionRecords);
        
        // 편집 모드 초기화
        form.removeAttribute('data-edit-mode');
        form.removeAttribute('data-edit-index');
        form.removeAttribute('data-edit-type');
    } else {
        // 새 잔액 계산
        const latestBalance = transactionRecords.length > 0 ? transactionRecords[transactionRecords.length - 1].balance : 0;
        const newBalance = latestBalance - expense;
        
        // 새 거래 기록 생성
        const newTransactionRecord = {
            date,
            description,
            category,
            income: 0,
            expense,
            balance: newBalance
        };
        
        transactionRecords.push(newTransactionRecord);
    }
    
    // 데이터 저장
    saveData();
    
    // 폼 초기화
    form.reset();
    const transactionExpenseDatePicker = document.getElementById('transaction-expense-date')._flatpickr;
    if (transactionExpenseDatePicker) {
        transactionExpenseDatePicker.setDate(new Date());
    }
    document.getElementById('transaction-expense-amount').value = 0;
    
    // 거래 페이지로 이동
    showTransactionPage();
}

// 거래 수입 폼 제출 처리
function handleTransactionIncomeFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const isEditMode = form.getAttribute('data-edit-mode') === 'true';
    const editIndex = parseInt(form.getAttribute('data-edit-index'));
    
    const date = document.getElementById('transaction-income-date').value;
    const description = document.getElementById('transaction-income-description').value;
    const category = document.getElementById('transaction-income-category').value;
    const income = parseFloat(document.getElementById('transaction-income-amount').value) || 0;
    
    if (category === '') {
        alert('카테고리를 선택해주세요.');
        return;
    }
    
    if (income === 0) {
        alert('수입 금액을 입력해주세요.');
        return;
    }
    
    if (isEditMode) {
        // 기존 기록 수정
        transactionRecords[editIndex] = {
            date,
            description,
            category,
            income,
            expense: 0,
            balance: 0 // 임시 값, 재계산에서 업데이트
        };
        
        // 잔액 재계산
        recalculateBalances(transactionRecords);
        
        // 편집 모드 초기화
        form.removeAttribute('data-edit-mode');
        form.removeAttribute('data-edit-index');
        form.removeAttribute('data-edit-type');
    } else {
        // 새 잔액 계산
        const latestBalance = transactionRecords.length > 0 ? transactionRecords[transactionRecords.length - 1].balance : 0;
        const newBalance = latestBalance + income;
        
        // 새 거래 기록 생성
        const newTransactionRecord = {
            date,
            description,
            category,
            income,
            expense: 0,
            balance: newBalance
        };
        
        transactionRecords.push(newTransactionRecord);
    }
    
    // 데이터 저장
    saveData();
    
    // 폼 초기화
    form.reset();
    const transactionIncomeDatePicker = document.getElementById('transaction-income-date')._flatpickr;
    if (transactionIncomeDatePicker) {
        transactionIncomeDatePicker.setDate(new Date());
    }
    document.getElementById('transaction-income-amount').value = 0;
    
    // 거래 페이지로 이동
    showTransactionPage();
}

// 페이지 네비게이션 함수
function showInitialSetupPage() {
    hideAllPages();
    initialSetupPage.classList.remove('hidden');
    tabMenu.classList.add('hidden');
}

function showHomePage() {
    hideAllPages();
    updateHomePageData();
    homePage.classList.remove('hidden');
    tabMenu.classList.remove('hidden');
    setActiveTab('home-tab');
}

function showBudgetExpenseForm() {
    hideAllPages();
    document.getElementById('budget-expense-form').classList.remove('hidden');
    tabMenu.classList.remove('hidden');
}

function showBudgetIncomeForm() {
    hideAllPages();
    document.getElementById('budget-income-form').classList.remove('hidden');
    tabMenu.classList.remove('hidden');
}

function showTransactionExpenseForm() {
    hideAllPages();
    document.getElementById('transaction-expense-form').classList.remove('hidden');
    tabMenu.classList.remove('hidden');
}

function showTransactionIncomeForm() {
    hideAllPages();
    document.getElementById('transaction-income-form').classList.remove('hidden');
    tabMenu.classList.remove('hidden');
}

function showSavingsForm() {
    hideAllPages();
    document.getElementById('savings-form').classList.remove('hidden');
    document.getElementById('savings-date').valueAsDate = new Date();
    tabMenu.classList.remove('hidden');
}

function showBudgetPage() {
    hideAllPages();
    updateBudgetTable();
    populateBudgetMonthFilter();
    budgetPage.classList.remove('hidden');
    tabMenu.classList.remove('hidden');
    setActiveTab('budget-tab');
}

function showTransactionPage() {
    hideAllPages();
    updateTransactionTable();
    populateTransactionMonthFilter();
    transactionPage.classList.remove('hidden');
    tabMenu.classList.remove('hidden');
    setActiveTab('transaction-tab');
}

function showSavingsPage() {
    hideAllPages();
    updateSavingsTable();
    populateSavingsMonthFilter();
    document.getElementById('savings-page').classList.remove('hidden');
    tabMenu.classList.remove('hidden');
    setActiveTab('savings-tab');
}

// 저축 폼 제출 처리
function handleSavingsFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const isEditMode = form.getAttribute('data-edit-mode') === 'true';
    const editIndex = parseInt(form.getAttribute('data-edit-index'));
    
    const date = document.getElementById('savings-date').value;
    const description = document.getElementById('savings-description').value;
    const category = document.getElementById('savings-category').value;
    const amount = parseFloat(document.getElementById('savings-amount').value) || 0;
    
    if (category === '') {
        alert('카테고리를 선택해주세요.');
        return;
    }
    
    if (amount === 0) {
        alert('저축 금액을 입력해주세요.');
        return;
    }
    
    if (isEditMode) {
        // 기존 기록 수정
        savingsRecords[editIndex] = {
            date,
            description,
            category,
            amount,
            total: 0 // 임시 값, 재계산에서 업데이트
        };
        
        // 총합 재계산
        recalculateSavingsTotals();
        
        // 편집 모드 초기화
        form.removeAttribute('data-edit-mode');
        form.removeAttribute('data-edit-index');
        form.removeAttribute('data-edit-type');
    } else {
        // 새 총합 계산
        const latestTotal = savingsRecords.length > 0 ? savingsRecords[savingsRecords.length - 1].total : 0;
        const newTotal = latestTotal + amount;
        
        // 새 저축 기록 생성
        const newSavingsRecord = {
            date,
            description,
            category,
            amount,
            total: newTotal
        };
        
        savingsRecords.push(newSavingsRecord);
    }
    
    // 데이터 저장
    saveData();
    
    // 폼 초기화
    form.reset();
    const savingsDatePicker = document.getElementById('savings-date')._flatpickr;
    if (savingsDatePicker) {
        savingsDatePicker.setDate(new Date());
    }
    document.getElementById('savings-amount').value = 0;
    
    // 저축 페이지로 이동
    showSavingsPage();
}

// 저축 테이블 업데이트
function updateSavingsTable() {
    const tableBody = document.getElementById('savings-body');
    tableBody.innerHTML = '';
    
    // 필터 적용
    const filteredRecords = filterSavingsRecords();
    
    if (filteredRecords.length === 0) {
        const row = tableBody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 5;
        cell.textContent = '저축 기록이 없습니다.';
        cell.classList.add('empty-table-message');
        return;
    }
    
    // 테이블에 행 추가
    filteredRecords.forEach((record, index) => {
        const row = tableBody.insertRow();
        
        // 날짜
        const dateCell = row.insertCell(0);
        dateCell.textContent = formatDate(record.date);
        
        // 내용
        const descriptionCell = row.insertCell(1);
        descriptionCell.textContent = record.description;
        
        // 카테고리
        const categoryCell = row.insertCell(2);
        categoryCell.textContent = getCategoryWithEmoji(record.category);
        
        // 저축한 돈
        const amountCell = row.insertCell(3);
        amountCell.textContent = formatCurrency(record.amount);
        
        // 총합
        const totalCell = row.insertCell(4);
        totalCell.textContent = formatCurrency(record.total);
        
        // 관리 버튼
        const actionsCell = row.insertCell(5);
        actionsCell.classList.add('actions-cell');
        
        // 편집 버튼
        const editButton = document.createElement('button');
        editButton.textContent = '✏️';
        editButton.classList.add('edit-button');
        editButton.setAttribute('data-type', 'savings');
        editButton.setAttribute('data-index', index);
        editButton.addEventListener('click', () => handleEditRecord('savings', index));
        actionsCell.appendChild(editButton);
        
        // 삭제 버튼
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '🗑️';
        deleteButton.classList.add('delete-button');
        deleteButton.setAttribute('data-type', 'savings');
        deleteButton.setAttribute('data-index', index);
        deleteButton.addEventListener('click', () => handleDeleteRecord('savings', index));
        actionsCell.appendChild(deleteButton);
    });
}

// 저축 월 필터 채우기
function populateSavingsMonthFilter() {
    const monthFilter = document.getElementById('savings-month-filter');
    
    // 기존 옵션 제거 (첫 번째 옵션 '전체' 유지)
    while (monthFilter.options.length > 1) {
        monthFilter.remove(1);
    }
    
    // 중복 없는 월 목록 생성
    const months = new Set();
    
    savingsRecords.forEach(record => {
        const date = new Date(record.date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthYear);
    });
    
    // 월 정렬 (최신순)
    const sortedMonths = Array.from(months).sort().reverse();
    
    // 옵션 추가
    sortedMonths.forEach(month => {
        const [year, monthNum] = month.split('-');
        const option = document.createElement('option');
        option.value = month;
        option.textContent = `${year}년 ${monthNum}월`;
        monthFilter.appendChild(option);
    });
}

// 저축 기록 필터링
function filterSavingsRecords() {
    const monthFilter = document.getElementById('savings-month-filter').value;
    const categoryFilter = document.getElementById('savings-category-filter').value;
    const sortOrder = document.getElementById('savings-sort-order').value;
    
    let filteredRecords = [...savingsRecords];
    
    // 월 필터 적용
    if (monthFilter !== 'all') {
        filteredRecords = filteredRecords.filter(record => {
            const date = new Date(record.date);
            const recordMonthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return recordMonthYear === monthFilter;
        });
    }
    
    // 카테고리 필터 적용
    if (categoryFilter !== 'all') {
        filteredRecords = filteredRecords.filter(record => record.category === categoryFilter);
    }
    
    // 정렬 적용
    filteredRecords.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    return filteredRecords;
}

function hideAllPages() {
    initialSetupPage.classList.add('hidden');
    homePage.classList.add('hidden');
    budgetPage.classList.add('hidden');
    transactionPage.classList.add('hidden');
    document.getElementById('savings-page').classList.add('hidden');
    document.getElementById('budget-expense-form').classList.add('hidden');
    document.getElementById('budget-income-form').classList.add('hidden');
    document.getElementById('transaction-expense-form').classList.add('hidden');
    document.getElementById('transaction-income-form').classList.add('hidden');
    document.getElementById('savings-form').classList.add('hidden');
}

function setActiveTab(tabId) {
    document.querySelectorAll('.tab-button').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
}

// 데이터 업데이트 함수
function updateHomePageData() {
    // 현재 잔액 업데이트
    const currentBalance = transactionRecords.length > 0 ? transactionRecords[transactionRecords.length - 1].balance : 0;
    document.getElementById('current-balance').textContent = formatCurrency(currentBalance);
    
    // 현재 월 데이터 가져오기
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // 예산 데이터 필터링
    const currentMonthBudget = budgetRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });
    
    // 거래 데이터 필터링
    const currentMonthTransactions = transactionRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });
    
    // 예산 지출 계산
    const monthlyBudget = currentMonthBudget.reduce((sum, record) => sum + record.expense, 0);
    
    // 실제 지출 계산
    const monthlyExpense = currentMonthTransactions.reduce((sum, record) => sum + record.expense, 0);
    
    // 저축 총합 계산 - 저축 기록의 최신 총합 값 사용
    let totalSavings = 0;
    if (savingsRecords.length > 0) {
        // 저축 기록이 있는 경우, 가장 최신 기록의 총합 값 사용
        totalSavings = savingsRecords[savingsRecords.length - 1].total;
    }
    
    // UI 업데이트
    document.getElementById('monthly-budget').textContent = formatCurrency(monthlyBudget);
    document.getElementById('monthly-expense').textContent = formatCurrency(monthlyExpense);
    document.getElementById('total-savings').textContent = formatCurrency(totalSavings);
    
    // 차트 업데이트
    updateComparisonChart();
    updateCategoryChart();
    updateSavingsChart();
}

// 예산 테이블 업데이트
function updateBudgetTable() {
    const tbody = document.getElementById('budget-body');
    tbody.innerHTML = '';
    
    const monthFilter = document.getElementById('budget-month-filter').value;
    const categoryFilter = document.getElementById('budget-category-filter').value;
    const sortOrder = document.getElementById('budget-sort-order').value;
    
    let filteredRecords = [...budgetRecords];
    
    // 월별 필터 적용
    if (monthFilter !== 'all') {
        const [year, month] = monthFilter.split('-');
        filteredRecords = filteredRecords.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getFullYear() === parseInt(year) && 
                   recordDate.getMonth() === parseInt(month) - 1;
        });
    }
    
    // 카테고리 필터 적용
    if (categoryFilter !== 'all') {
        filteredRecords = filteredRecords.filter(record => record.category === categoryFilter);
    }
    
    // 정렬 적용
    filteredRecords.sort((a, b) => {
        if (sortOrder === 'newest') {
            return new Date(b.date) - new Date(a.date);
        } else {
            return new Date(a.date) - new Date(b.date);
        }
    });
    
    // 테이블 행 생성
    filteredRecords.forEach((record, index) => {
        const row = document.createElement('tr');
        
        // 날짜 포맷팅
        const formattedDate = formatDate(record.date);
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${record.description}</td>
            <td>${getCategoryWithEmoji(record.category)}</td>
            <td>${record.income > 0 ? formatCurrency(record.income) : '-'}</td>
            <td>${record.expense > 0 ? formatCurrency(record.expense) : '-'}</td>
            <td>${formatCurrency(record.balance)}</td>
            <td class="actions-cell"></td>
        `;
        
        tbody.appendChild(row);
        
        // 관리 버튼 추가
        const actionsCell = row.querySelector('.actions-cell');
        
        // 편집 버튼
        const editButton = document.createElement('button');
        editButton.textContent = '✏️';
        editButton.classList.add('edit-button');
        editButton.setAttribute('data-type', 'budget');
        editButton.setAttribute('data-index', index);
        editButton.addEventListener('click', () => handleEditRecord('budget', index));
        actionsCell.appendChild(editButton);
        
        // 삭제 버튼
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '🗑️';
        deleteButton.classList.add('delete-button');
        deleteButton.setAttribute('data-type', 'budget');
        deleteButton.setAttribute('data-index', index);
        deleteButton.addEventListener('click', () => handleDeleteRecord('budget', index));
        actionsCell.appendChild(deleteButton);
    });
}

// 거래 테이블 업데이트
function updateTransactionTable() {
    const tbody = document.getElementById('transaction-body');
    tbody.innerHTML = '';
    
    const monthFilter = document.getElementById('transaction-month-filter').value;
    const categoryFilter = document.getElementById('transaction-category-filter').value;
    const sortOrder = document.getElementById('transaction-sort-order').value;
    
    let filteredRecords = [...transactionRecords];
    
    // 월별 필터 적용
    if (monthFilter !== 'all') {
        const [year, month] = monthFilter.split('-');
        filteredRecords = filteredRecords.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getFullYear() === parseInt(year) && 
                   recordDate.getMonth() === parseInt(month) - 1;
        });
    }
    
    // 카테고리 필터 적용
    if (categoryFilter !== 'all') {
        filteredRecords = filteredRecords.filter(record => record.category === categoryFilter);
    }
    
    // 정렬 적용
    filteredRecords.sort((a, b) => {
        if (sortOrder === 'newest') {
            return new Date(b.date) - new Date(a.date);
        } else {
            return new Date(a.date) - new Date(b.date);
        }
    });
    
    // 테이블 행 생성
    filteredRecords.forEach((record, index) => {
        const row = document.createElement('tr');
        
        // 날짜 포맷팅
        const formattedDate = formatDate(record.date);
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${record.description}</td>
            <td>${getCategoryWithEmoji(record.category)}</td>
            <td>${record.income > 0 ? formatCurrency(record.income) : '-'}</td>
            <td>${record.expense > 0 ? formatCurrency(record.expense) : '-'}</td>
            <td>${formatCurrency(record.balance)}</td>
            <td class="actions-cell"></td>
        `;
        
        tbody.appendChild(row);
        
        // 관리 버튼 추가
        const actionsCell = row.querySelector('.actions-cell');
        
        // 편집 버튼
        const editButton = document.createElement('button');
        editButton.textContent = '✏️';
        editButton.classList.add('edit-button');
        editButton.setAttribute('data-type', 'transaction');
        editButton.setAttribute('data-index', index);
        editButton.addEventListener('click', () => handleEditRecord('transaction', index));
        actionsCell.appendChild(editButton);
        
        // 삭제 버튼
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '🗑️';
        deleteButton.classList.add('delete-button');
        deleteButton.setAttribute('data-type', 'transaction');
        deleteButton.setAttribute('data-index', index);
        deleteButton.addEventListener('click', () => handleDeleteRecord('transaction', index));
        actionsCell.appendChild(deleteButton);
    });
}

// 예산 월 필터 채우기
function populateBudgetMonthFilter() {
    const monthFilter = document.getElementById('budget-month-filter');
    
    // 현재 선택 저장
    const currentSelection = monthFilter.value;
    
    // 첫 번째 옵션을 제외한 모든 옵션 삭제
    while (monthFilter.options.length > 1) {
        monthFilter.remove(1);
    }
    
    // 기록에서 고유한 월 가져오기
    const months = new Set();
    
    budgetRecords.forEach(record => {
        const date = new Date(record.date);
        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        months.add(monthYear);
    });
    
    // 월 옵션 추가
    Array.from(months).sort().reverse().forEach(monthYear => {
        const [year, month] = monthYear.split('-');
        const option = document.createElement('option');
        option.value = monthYear;
        option.textContent = `${year}년 ${month}월`;
        monthFilter.appendChild(option);
    });
    
    // 이전 선택이 있는 경우 복원
    if (Array.from(monthFilter.options).some(option => option.value === currentSelection)) {
        monthFilter.value = currentSelection;
    }
}

// 거래 월 필터 채우기
function populateTransactionMonthFilter() {
    const monthFilter = document.getElementById('transaction-month-filter');
    
    // 현재 선택 저장
    const currentSelection = monthFilter.value;
    
    // 첫 번째 옵션을 제외한 모든 옵션 삭제
    while (monthFilter.options.length > 1) {
        monthFilter.remove(1);
    }
    
    // 기록에서 고유한 월 가져오기
    const months = new Set();
    
    transactionRecords.forEach(record => {
        const date = new Date(record.date);
        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        months.add(monthYear);
    });
    
    // 월 옵션 추가
    Array.from(months).sort().reverse().forEach(monthYear => {
        const [year, month] = monthYear.split('-');
        const option = document.createElement('option');
        option.value = monthYear;
        option.textContent = `${year}년 ${month}월`;
        monthFilter.appendChild(option);
    });
    
    // 이전 선택이 있는 경우 복원
    if (Array.from(monthFilter.options).some(option => option.value === currentSelection)) {
        monthFilter.value = currentSelection;
    }
}

// 예산 vs 실제 지출 비교 차트
function updateComparisonChart() {
    const ctx = document.getElementById('comparison-chart').getContext('2d');
    
    // 카테고리별 예산과 실제 지출 데이터 수집
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // 현재 월 데이터만 필터링
    const currentMonthBudget = budgetRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });
    
    const currentMonthTransactions = transactionRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });
    
    // 카테고리별 지출 계산
    const categories = ['식사', '교통비', '저축', '놀이', '문구', '패션', '책/학습', '기타'];
    const budgetByCategory = {};
    const expenseByCategory = {};
    
    // 초기화
    categories.forEach(category => {
        budgetByCategory[category] = 0;
        expenseByCategory[category] = 0;
    });
    
    // 예산 데이터 계산
    currentMonthBudget.forEach(record => {
        if (record.expense > 0 && categories.includes(record.category)) {
            budgetByCategory[record.category] += record.expense;
        }
    });
    
    // 실제 지출 데이터 계산
    currentMonthTransactions.forEach(record => {
        if (record.expense > 0 && categories.includes(record.category)) {
            expenseByCategory[record.category] += record.expense;
        }
    });
    
    // 차트 데이터 변환
    const budgetData = categories.map(category => budgetByCategory[category]);
    const expenseData = categories.map(category => expenseByCategory[category]);
    
    // 차트 생성 또는 업데이트
    if (window.comparisonChart) {
        window.comparisonChart.data.labels = categories.map(getCategoryWithEmoji);
        window.comparisonChart.data.datasets[0].data = budgetData;
        window.comparisonChart.data.datasets[1].data = expenseData;
        window.comparisonChart.update();
    } else {
        window.comparisonChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories.map(getCategoryWithEmoji),
                datasets: [
                    {
                        label: '예산',
                        data: budgetData,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: '실제 지출',
                        data: expenseData,
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// 카테고리별 지출 비율 차트
function updateCategoryChart() {
    const ctx = document.getElementById('category-chart').getContext('2d');
    
    // 카테고리별 지출 그룹화
    const categoryData = {};
    const categoryColors = {
        '식사': 'rgba(255, 99, 132, 0.8)',
        '교통비': 'rgba(54, 162, 235, 0.8)',
        '저축': 'rgba(255, 206, 86, 0.8)',
        '놀이': 'rgba(75, 192, 192, 0.8)',
        '문구': 'rgba(153, 102, 255, 0.8)',
        '패션': 'rgba(255, 159, 64, 0.8)',
        '책/학습': 'rgba(199, 199, 199, 0.8)',
        '기타': 'rgba(83, 102, 255, 0.8)'
    };
    
    // 현재 월 데이터만 필터링
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthTransactions = transactionRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });
    
    currentMonthTransactions.forEach(record => {
        if (record.expense > 0) {
            if (!categoryData[record.category]) {
                categoryData[record.category] = 0;
            }
            categoryData[record.category] += record.expense;
        }
    });
    
    // Chart.js용 배열로 변환
    const categories = Object.keys(categoryData);
    const expenses = categories.map(category => categoryData[category]);
    const backgroundColors = categories.map(category => categoryColors[category] || 'rgba(128, 128, 128, 0.8)');
    
    // 차트 생성 또는 업데이트
    if (window.categoryChart) {
        window.categoryChart.data.labels = categories.map(getCategoryWithEmoji);
        window.categoryChart.data.datasets[0].data = expenses;
        window.categoryChart.data.datasets[0].backgroundColor = backgroundColors;
        window.categoryChart.update();
    } else {
        window.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories.map(getCategoryWithEmoji),
                datasets: [{
                    data: expenses,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}
function updateSavingsChart() {
    // 기존 차트 제거
    if (window.savingsChart) {
        window.savingsChart.destroy();
        window.savingsChart = null;
    }
    
    const ctx = document.getElementById('savings-chart').getContext('2d');
    
    // 저축 기록이 없으면 차트를 표시하지 않음
    if (savingsRecords.length === 0) {
        return;
    }
    
    // 월별 저축 금액 계산
    const monthlySavings = {};
    
    // 저축 기록을 날짜순으로 정렬
    savingsRecords.forEach(record => {
        const date = new Date(record.date);
        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!monthlySavings[monthYear]) {
            monthlySavings[monthYear] = 0;
        }
        monthlySavings[monthYear] += record.amount;
    });
    
    // 월별 정렬
    const months = Object.keys(monthlySavings).sort();
    
    // 월별 저축 금액 배열
    const savings = months.map(month => monthlySavings[month]);
    
    // 누적 저축 금액 계산
    const cumulativeSavings = [];
    let total = 0;
    
    for (let i = 0; i < months.length; i++) {
        total += savings[i];
        cumulativeSavings.push(total);
    }
    
    // 월 라벨 포맷팅
    const labels = months.map(month => {
        const [year, monthNum] = month.split('-');
        return `${year}년 ${monthNum}월`;
    });
    
    // 새 차트 생성
    window.savingsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '월별 저축 금액',
                data: savings,
                backgroundColor: 'rgba(255, 193, 7, 0.8)',
                borderColor: 'rgba(255, 193, 7, 1)',
                borderWidth: 1,
                order: 2
            },
            {
                label: '누적 저축 금액',
                data: cumulativeSavings,
                type: 'line',
                backgroundColor: 'rgba(33, 150, 243, 0.4)',
                borderColor: 'rgba(33, 150, 243, 1)',
                borderWidth: 2,
                pointRadius: 4,
                fill: false,
                order: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.parsed.y);
                        }
                    }
                }
            }
        }
    });
}

// 필터 함수
function filterBudgetRecords() {
    updateBudgetTable();
}

function filterTransactionRecords() {
    updateTransactionTable();
}

// 헬퍼 함수
function formatCurrency(amount) {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' })
        .format(amount)
        .replace('KRW', '') + '원';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

function getCategoryWithEmoji(category) {
    const categoryEmojis = {
        '식사': '🍙 식사',
        '교통비': '🚍 교통비',
        '저축': '💰 저축',
        '놀이': '🎮 놀이',
        '문구': '✏️ 문구/학용품',
        '패션': '👕 패션',
        '책/학습': '📚 책/학습',
        '기타': '🛍️ 기타'
    };
    
    return categoryEmojis[category] || category;
}

// 편집 기록 처리
function handleEditRecord(type, index) {
    let record;
    let formToShow;
    
    // 레코드 가져오기
    if (type === 'budget') {
        record = budgetRecords[index];
        // 지출 또는 수입 폼 결정
        if (record.expense > 0) {
            formToShow = showBudgetExpenseForm;
            // 폼 필드 채우기
            document.getElementById('budget-expense-date').value = record.date;
            document.getElementById('budget-expense-description').value = record.description;
            document.getElementById('budget-expense-category').value = record.category;
            document.getElementById('budget-expense-amount').value = record.expense;
            
            // 편집 모드 설정
            document.getElementById('budget-expense-form').setAttribute('data-edit-mode', 'true');
            document.getElementById('budget-expense-form').setAttribute('data-edit-index', index);
            document.getElementById('budget-expense-form').setAttribute('data-edit-type', type);
        } else {
            formToShow = showBudgetIncomeForm;
            // 폼 필드 채우기
            document.getElementById('budget-income-date').value = record.date;
            document.getElementById('budget-income-description').value = record.description;
            document.getElementById('budget-income-category').value = record.category;
            document.getElementById('budget-income-amount').value = record.income;
            
            // 편집 모드 설정
            document.getElementById('budget-income-form').setAttribute('data-edit-mode', 'true');
            document.getElementById('budget-income-form').setAttribute('data-edit-index', index);
            document.getElementById('budget-income-form').setAttribute('data-edit-type', type);
        }
    } else if (type === 'transaction') {
        record = transactionRecords[index];
        // 지출 또는 수입 폼 결정
        if (record.expense > 0) {
            formToShow = showTransactionExpenseForm;
            // 폼 필드 채우기
            document.getElementById('transaction-expense-date').value = record.date;
            document.getElementById('transaction-expense-description').value = record.description;
            document.getElementById('transaction-expense-category').value = record.category;
            document.getElementById('transaction-expense-amount').value = record.expense;
            
            // 편집 모드 설정
            document.getElementById('transaction-expense-form').setAttribute('data-edit-mode', 'true');
            document.getElementById('transaction-expense-form').setAttribute('data-edit-index', index);
            document.getElementById('transaction-expense-form').setAttribute('data-edit-type', type);
        } else {
            formToShow = showTransactionIncomeForm;
            // 폼 필드 채우기
            document.getElementById('transaction-income-date').value = record.date;
            document.getElementById('transaction-income-description').value = record.description;
            document.getElementById('transaction-income-category').value = record.category;
            document.getElementById('transaction-income-amount').value = record.income;
            
            // 편집 모드 설정
            document.getElementById('transaction-income-form').setAttribute('data-edit-mode', 'true');
            document.getElementById('transaction-income-form').setAttribute('data-edit-index', index);
            document.getElementById('transaction-income-form').setAttribute('data-edit-type', type);
        }
    } else if (type === 'savings') {
        record = savingsRecords[index];
        formToShow = showSavingsForm;
        // 폼 필드 채우기
        document.getElementById('savings-date').value = record.date;
        document.getElementById('savings-description').value = record.description;
        document.getElementById('savings-category').value = record.category;
        document.getElementById('savings-amount').value = record.amount;
        
        // 편집 모드 설정
        document.getElementById('savings-form-element').setAttribute('data-edit-mode', 'true');
        document.getElementById('savings-form-element').setAttribute('data-edit-index', index);
        document.getElementById('savings-form-element').setAttribute('data-edit-type', type);
    }
    
    // 해당 폼 표시
    formToShow();
}

// 삭제 기록 처리
function handleDeleteRecord(type, index) {
    // 확인 대화상자 생성
    const dialog = document.createElement('div');
    dialog.classList.add('confirm-dialog');
    
    dialog.innerHTML = `
        <div class="confirm-dialog-content">
            <p>정말 이 기록을 삭제하시겠습니까?</p>
            <div class="confirm-dialog-buttons">
                <button class="confirm-button">확인</button>
                <button class="cancel-button">취소</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // 확인 버튼 클릭 시 삭제 수행
    dialog.querySelector('.confirm-button').addEventListener('click', () => {
        if (type === 'budget') {
            // 예산 기록 삭제
            budgetRecords.splice(index, 1);
            // 잔액 재계산
            recalculateBalances(budgetRecords);
            // 테이블 업데이트
            updateBudgetTable();
        } else if (type === 'transaction') {
            // 거래 기록 삭제
            transactionRecords.splice(index, 1);
            // 잔액 재계산
            recalculateBalances(transactionRecords);
            // 테이블 업데이트
            updateTransactionTable();
        } else if (type === 'savings') {
            // 저축 기록 삭제
            savingsRecords.splice(index, 1);
            // 총합 재계산
            recalculateSavingsTotals();
            // 테이블 업데이트
            updateSavingsTable();
        }
        
        // 데이터 저장
        saveData();
        
        // 대화상자 제거
        document.body.removeChild(dialog);
    });
    
    // 취소 버튼 클릭 시 대화상자만 제거
    dialog.querySelector('.cancel-button').addEventListener('click', () => {
        document.body.removeChild(dialog);
    });
}

// 잔액 재계산 함수
function recalculateBalances(records) {
    let balance = 0;
    
    records.forEach(record => {
        balance = balance + record.income - record.expense;
        record.balance = balance;
    });
}

// 저축 총합 재계산 함수
function recalculateSavingsTotals() {
    let total = 0;
    
    savingsRecords.forEach(record => {
        total += record.amount;
        record.total = total;
    });
}

// 데이터 저장 함수
function saveData() {
    localStorage.setItem('budgetRecords', JSON.stringify(budgetRecords));
    localStorage.setItem('transactionRecords', JSON.stringify(transactionRecords));
    localStorage.setItem('savingsRecords', JSON.stringify(savingsRecords));
    localStorage.setItem('initialSetupComplete', JSON.stringify(initialSetupComplete));
    
    // 홈 페이지 데이터 업데이트
    updateHomePageData();
}

// 데이터 불러오기 함수
function loadData() {
    const savedBudgetRecords = localStorage.getItem('budgetRecords');
    const savedTransactionRecords = localStorage.getItem('transactionRecords');
    const savedSavingsRecords = localStorage.getItem('savingsRecords');
    const savedSetupComplete = localStorage.getItem('initialSetupComplete');
    
    if (savedBudgetRecords) {
        budgetRecords = JSON.parse(savedBudgetRecords);
    }
    
    if (savedTransactionRecords) {
        transactionRecords = JSON.parse(savedTransactionRecords);
    }
    
    if (savedSavingsRecords) {
        savingsRecords = JSON.parse(savedSavingsRecords);
    }
    
    if (savedSetupComplete) {
        initialSetupComplete = JSON.parse(savedSetupComplete);
    }
}
