const targetBatchSize = 20;
let scannedCount = 0;
let isBatchLocked = true;
let secondsElapsed = 0;
let currentRole = 'employee';
const adminPassword = 'Admin@8033';

// محاكاة البيانات الحقيقية
const ordersData = [
  { id: 'ORD-001', sku: 'SKU99', qty: 2, status: 'sh', date: '2026-08-22 08:15', customer: 'محمد علي' },
  { id: 'ORD-002', sku: 'SKU88', qty: 1, status: 'sh', date: '2026-08-22 08:20', customer: 'فاطمة أحمد' },
  { id: 'ORD-003', sku: 'SKU77', qty: 3, status: 'pr', date: '2026-08-22 08:25', customer: 'علي محمود' },
  { id: 'ORD-004', sku: 'SKU66', qty: 1, status: 'pr', date: '2026-08-22 08:30', customer: 'سارة خالد' },
  { id: 'ORD-005', sku: 'SKU55', qty: 2, status: 'iss', date: '2026-08-22 08:35', customer: 'حسن إبراهيم' },
];

const auditLog = [
  { time: '08:45', action: 'مسح باركود', user: 'عامل 1', order: 'ORD-001', status: '✓' },
  { time: '08:40', action: 'فتح دفعة', user: 'مدير', order: 'B-102', status: '✓' },
  { time: '08:35', action: 'إكمال دفعة', user: 'عامل 2', order: 'B-101', status: '✓' },
  { time: '08:30', action: 'خطأ في المسح', user: 'عامل 1', order: 'ORD-003', status: '✗' },
];

const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const scanInput = document.getElementById('scanInput');
const scanError = document.getElementById('scanError');
const timerValue = document.getElementById('timerValue');
const lockBadge = document.getElementById('lockBadge');
const lockStatus = document.getElementById('lockStatus');
const packingLocked = document.getElementById('packingLocked');
const packingUnlocked = document.getElementById('packingUnlocked');
const adminModal = document.getElementById('adminModal');
const orderModal = document.getElementById('orderModal');

function setActiveTab(tab) {
  if (tab === 'dashboard' && currentRole !== 'admin') {
    setActiveTab('employee');
    return;
  }
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  document.querySelectorAll('.tab-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `${tab}View`);
  });

  // تحديث البيانات عند فتح كل تبويب
  if (tab === 'dispatch') renderDispatchList();
  if (tab === 'audit') renderAuditLog();
}

function updateTimer() {
  const minutes = Math.floor(secondsElapsed / 60);
  const seconds = secondsElapsed % 60;
  timerValue.textContent = `${minutes}م ${seconds}ث`;
}

function updateProgress() {
  const percent = (scannedCount / targetBatchSize) * 100;
  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${scannedCount} / ${targetBatchSize} أوردر`;
}

function updatePackingState() {
  const unlocked = !isBatchLocked;
  packingLocked.classList.toggle('hidden', unlocked);
  packingUnlocked.classList.toggle('hidden', !unlocked);

  lockBadge.textContent = isBatchLocked ? '🔒' : '🔓';
  lockBadge.classList.toggle('open', !isBatchLocked);

  lockStatus.innerHTML = isBatchLocked
    ? '<span class="status lock">🔒 مقفول</span>'
    : '<span class="status unlock">🔓 مفتوح</span>';
}

function setScanErrorState(show) {
  scanError.classList.toggle('hidden', !show);
}

function handleScan(event) {
  event.preventDefault();
  const value = scanInput.value.trim();
  const isValid = value.toUpperCase().includes('SKU') || value.length > 3;

  if (!isValid) {
    setScanErrorState(true);
    setTimeout(() => setScanErrorState(false), 2000);
    return;
  }

  if (scannedCount < targetBatchSize) {
    scannedCount += 1;
    scanInput.value = '';
    setScanErrorState(false);
    updateProgress();

    if (scannedCount >= targetBatchSize) {
      isBatchLocked = false;
      updatePackingState();
    }
  }
}

function handleAdminOverride() {
  const passwordInput = document.getElementById('adminPassword');
  const passwordError = document.getElementById('passwordError');
  if (passwordInput.value !== adminPassword) {
    passwordError.classList.remove('hidden');
    return;
  }
  isBatchLocked = false;
  updatePackingState();
  adminModal.classList.add('hidden');
  passwordInput.value = '';
  passwordError.classList.add('hidden');
  auditLog.unshift({ time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }), action: 'فتح قسري', user: 'مدير النظام', order: 'B-102', status: '✓' });
}

function renderDispatchList() {
  const list = document.getElementById('dispatchList');
  list.innerHTML = ordersData.map(order => `
    <div class="order-card" onclick="showOrderDetails('${order.id}')">
      <div class="order-card-header">
        <span class="order-id">${order.id}</span>
        <span class="order-status status-${order.status}">${order.status}</span>
      </div>
      <div class="order-info">
        <div class="order-info-row">
          <span class="order-info-label">SKU:</span>
          <span class="order-info-value">${order.sku}</span>
        </div>
        <div class="order-info-row">
          <span class="order-info-label">الكمية:</span>
          <span class="order-info-value">${order.qty}</span>
        </div>
        <div class="order-info-row">
          <span class="order-info-label">الزبون:</span>
          <span class="order-info-value">${order.customer}</span>
        </div>
        <div class="order-info-row">
          <span class="order-info-label">الوقت:</span>
          <span class="order-info-value">${order.date}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderAuditLog() {
  const log = document.getElementById('auditLog');
  log.innerHTML = `
    <table class="audit-table">
      <thead>
        <tr>
          <th>الوقت</th>
          <th>الإجراء</th>
          <th>المستخدم</th>
          <th>الأمر/الدفعة</th>
          <th>الحالة</th>
        </tr>
      </thead>
      <tbody>
        ${auditLog.map(log => `
          <tr>
            <td>${log.time}</td>
            <td>${log.action}</td>
            <td>${log.user}</td>
            <td>${log.order}</td>
            <td>${log.status}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function showOrderDetails(orderId) {
  const order = ordersData.find(o => o.id === orderId);
  if (!order) return;

  const content = document.getElementById('orderModalContent');
  content.innerHTML = `
    <div class="detail-row">
      <span class="detail-label">رقم الأوردر</span>
      <span class="detail-value">${order.id}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">SKU</span>
      <span class="detail-value">${order.sku}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">الكمية</span>
      <span class="detail-value">${order.qty} وحدة</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">اسم الزبون</span>
      <span class="detail-value">${order.customer}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">الحالة الحالية</span>
      <span class="detail-value" style="color: ${order.status === 'sh' ? '#22c55e' : order.status === 'pr' ? '#3b82f6' : '#f59e0b'}">
        ${order.status === 'sh' ? 'مُشحون' : order.status === 'pr' ? 'قيد التجهيز' : 'قيد الالتقاط'}
      </span>
    </div>
    <div class="detail-row">
      <span class="detail-label">تاريخ الأمر</span>
      <span class="detail-value">${order.date}</span>
    </div>
  `;

  document.getElementById('orderModalTitle').textContent = `تفاصيل الأوردر ${orderId}`;
  orderModal.classList.remove('hidden');
}

setInterval(() => {
  secondsElapsed += 1;
  updateTimer();
}, 1000);

updateTimer();
updateProgress();
updatePackingState();
setActiveTab('employee');

document.querySelectorAll('.nav-btn').forEach((button) => {
  button.addEventListener('click', () => setActiveTab(button.dataset.tab));
});

document.getElementById('scanForm').addEventListener('submit', handleScan);
document.getElementById('overrideBtn').addEventListener('click', () => adminModal.classList.remove('hidden'));
document.getElementById('cancelOverride').addEventListener('click', () => adminModal.classList.add('hidden'));
document.getElementById('confirmOverride').addEventListener('click', handleAdminOverride);
document.getElementById('roleSelect').addEventListener('change', (event) => {
  currentRole = event.target.value;
  document.querySelectorAll('.admin-only, .admin-only-view').forEach((element) => element.classList.toggle('hidden', currentRole !== 'admin'));
  setActiveTab(currentRole === 'admin' ? 'dashboard' : 'employee');
});
document.querySelectorAll('[data-integration]').forEach((button) => {
  button.addEventListener('click', () => {
    document.getElementById('integrationMessage').textContent = `سيتم إعداد اتصال ${button.dataset.integration} من الخادم الخلفي.`;
  });
});
document.getElementById('exportReport').addEventListener('click', () => {
  const rows = [['Order ID', 'SKU', 'Quantity', 'Status', 'Customer'], ...ordersData.map((order) => [order.id, order.sku, order.qty, order.status, order.customer])];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  link.download = `runner-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
});
document.querySelectorAll('[data-tab-target]').forEach((button) => button.addEventListener('click', () => setActiveTab(button.dataset.tabTarget)));
document.getElementById('closeOrderModal').addEventListener('click', () => orderModal.classList.add('hidden'));

// إغلاق الموديل عند النقر خارجه
orderModal.addEventListener('click', (e) => {
  if (e.target === orderModal) orderModal.classList.add('hidden');
});
