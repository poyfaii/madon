let items = [];
let isLoggedIn = false;
let allOrders = {};
let filteredOrders = {};
let currentReceiptOrder = null;
let isOrderSaved = false;

// Function to initialize the app based on the current page
window.onload = function() {
  const isIndexPage = document.getElementById('mainOrderForm');
  const isAdminPage = document.getElementById('adminDashboard');

  if (isIndexPage) {
    updateItemList();
  }
  
  if (isAdminPage) {
    // This is for the case where the admin page is loaded directly
    // A password check or session management would be needed in a real app
    // For this example, we'll assume the user needs to log in from index.html
    // and be redirected, but this is a fallback for direct access.
    isLoggedIn = true;
    showAdminDashboard();
    loadOrders();
  }
};

// Login functions
function showLoginModal() {
  document.getElementById('loginModal').classList.remove('hidden');
  document.getElementById('passwordInput').focus();
}

function hideLoginModal() {
  document.getElementById('loginModal').classList.add('hidden');
  document.getElementById('passwordInput').value = '';
}

function handlePasswordKeyPress(event) {
  if (event.key === 'Enter') {
    login();
  }
}

function login() {
  const password = document.getElementById('passwordInput').value;
  if (password === '1234') {
    isLoggedIn = true;
    hideLoginModal();
    // Redirect to admin page
    window.location.href = 'admin.html';
  } else {
    alert('รหัสผ่านไม่ถูกต้อง');
    document.getElementById('passwordInput').value = '';
  }
}

function logout() {
  isLoggedIn = false;
  // Redirect to main page
  window.location.href = 'index.html';
}

function showAdminDashboard() {
  // Logic to show admin dashboard and hide other elements
  // This is now handled by loading admin.html directly
}

function showMainForm() {
  // Logic to show main form and hide other elements
  // This is now handled by loading index.html directly
}

// Order management functions (from Firebase)
const { initializeApp } = firebase;
const { getDatabase, ref, push, set, get, child } = firebase.database;

const firebaseConfig = {
  apiKey: "AIzaSyCDAaW-OyL_13qkF7sCxXkMhpJyrOtntjg",
  authDomain: "orders-3d979.firebaseapp.com",
  databaseURL: "https://orders-3d979-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "orders-3d979",
  storageBucket: "orders-3d979.appspot.com",
  messagingSenderId: ". ",
  appId: "1:. :web:4f1b772b853b602cc93e94",
  measurementId: "G-P5JPR90CX8"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

window.saveOrderToFirebase = async function(order) {
  try {
    const ordersRef = ref(database, 'orders');
    const newOrderRef = push(ordersRef);
    await set(newOrderRef, order);
    return true;
  } catch (error) {
    console.error("Error saving order:", error);
    return false;
  }
};

window.getOrdersFromFirebase = async function() {
  try {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, 'orders'));
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return {};
    }
  } catch (error) {
    console.error("Error getting orders:", error);
    return {};
  }
};

window.updateOrderInFirebase = async function(orderId, updatedOrder) {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    await set(orderRef, updatedOrder);
    return true;
  } catch (error) {
    console.error("Error updating order:", error);
    return false;
  }
};

window.deleteOrderFromFirebase = async function(orderId) {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    await set(orderRef, null);
    return true;
  } catch (error) {
    console.error("Error deleting order:", error);
    return false;
  }
};

async function loadOrders() {
  try {
    allOrders = await window.getOrdersFromFirebase();
    filteredOrders = { ...allOrders };
    displayOrders(filteredOrders);
    calculateStats(allOrders);
  } catch (error) {
    console.error('Error loading orders:', error);
  }
}

function displayOrders(orders) {
  const ordersList = document.getElementById('ordersList');
  const emptyState = document.getElementById('emptyOrdersState');
  const displayedCount = document.getElementById('displayedOrdersCount');
  
  if (!orders || Object.keys(orders).length === 0) {
    ordersList.innerHTML = '';
    emptyState.classList.remove('hidden');
    displayedCount.textContent = '0';
    return;
  }

  emptyState.classList.add('hidden');
  const ordersArray = Object.entries(orders).map(([id, order]) => ({
    id,
    ...order
  }));

  ordersArray.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
  displayedCount.textContent = ordersArray.length;

  ordersList.innerHTML = ordersArray.map(order => {
    const statusColor = getStatusColor(order.status || 'รอดำเนินการ');
    const statusIcon = getStatusIcon(order.status || 'รอดำเนินการ');
    
    return `
      <div class="bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden card-hover">
        <div class="p-4 md:p-6">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span class="text-xl text-white">👤</span>
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="text-lg font-bold text-gray-800 mb-1 truncate">${order.customer?.name || 'ไม่ระบุชื่อ'}</h3>
                <div class="space-y-1 text-sm text-gray-600">
                  <div class="flex items-center gap-1">
                    <span>📱</span>
                    <span class="truncate">${order.customer?.phone || 'ไม่ระบุเบอร์'}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <span>🛒</span>
                    <span>${order.items?.length || 0} รายการ</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <span>📅</span>
                    <span>${new Date(order.orderDate).toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div class="text-center sm:text-right">
                <p class="text-xs text-gray-500 mb-1">ยอดรวม</p>
                <p class="text-2xl md:text-3xl font-bold text-green-600">${order.totalAmount?.toFixed(2) || '0.00'}</p>
                <p class="text-xs text-gray-500">บาท</p>
              </div>
              <div class="flex items-center">
                <span class="px-3 py-1 rounded-full text-xs font-bold ${statusColor} shadow-sm">
                  ${statusIcon} ${order.status || 'รอดำเนินการ'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 border-t border-gray-100 p-4 md:p-6">
          <div class="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <div class="flex items-center gap-2 flex-1">
              <label class="text-xs font-medium text-gray-700 whitespace-nowrap">สถานะ:</label>
              <select id="status-${order.id}" class="flex-1 lg:flex-none lg:w-32 input-modern px-2 py-1 text-xs rounded-lg border-gray-300 focus:border-honey-400">
                <option value="รอดำเนินการ" ${(order.status || 'รอดำเนินการ') === 'รอดำเนินการ' ? 'selected' : ''}>รอดำเนินการ</option>
                <option value="กำลังจัดส่ง" ${order.status === 'กำลังจัดส่ง' ? 'selected' : ''}>กำลังจัดส่ง</option>
                <option value="จัดส่งแล้ว" ${order.status === 'จัดส่งแล้ว' ? 'selected' : ''}>จัดส่งแล้ว</option>
                <option value="ยกเลิก" ${order.status === 'ยกเลิก' ? 'selected' : ''}>ยกเลิก</option>
              </select>
              <button onclick="updateOrderStatus('${order.id}')" class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg whitespace-nowrap">
                💾
              </button>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <button onclick="showReceiptView(${JSON.stringify(order).replace(/"/g, '&quot;')})" class="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg">
                📄 ใบเสร็จ
              </button>
              <button onclick="deleteOrder('${order.id}')" class="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg">
                🗑️ ลบ
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ... all other functions from the original script ...

function calculateStats(orders) {
  if (!orders) {
    document.getElementById('totalRevenue').textContent = '0 บาท';
    document.getElementById('totalOrders').textContent = '0';
    document.getElementById('todayOrders').textContent = '0';
    document.getElementById('pendingOrders').textContent = '0';
    document.getElementById('lastUpdate').textContent = '-';
    return;
  }

  const ordersArray = Object.values(orders);
  const totalRevenue = ordersArray.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const totalOrders = ordersArray.length;
  
  const today = new Date().toDateString();
  const todayOrders = ordersArray.filter(order => 
    new Date(order.orderDate).toDateString() === today
  ).length;

  const pendingOrders = ordersArray.filter(order => 
    (order.status || 'รอดำเนินการ') === 'รอดำเนินการ'
  ).length;

  document.getElementById('totalRevenue').textContent = `${totalRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท`;
  document.getElementById('totalOrders').textContent = totalOrders.toLocaleString('th-TH');
  document.getElementById('todayOrders').textContent = todayOrders.toLocaleString('th-TH');
  document.getElementById('pendingOrders').textContent = pendingOrders.toLocaleString('th-TH');
  document.getElementById('lastUpdate').textContent = new Date().toLocaleString('th-TH');
}

function refreshOrders() {
  loadOrders();
}

function handleAdminSearchKeyPress(event) {
  if (event.key === 'Enter') {
    searchAdminOrders();
  }
}

function searchAdminOrders() {
  const nameSearch = document.getElementById('adminSearchInput').value.trim().toLowerCase();
  const phoneSearch = document.getElementById('adminPhoneInput').value.trim().toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;

  filteredOrders = {};

  Object.entries(allOrders).forEach(([id, order]) => {
    const customerName = (order.customer?.name || '').toLowerCase();
    const customerPhone = (order.customer?.phone || '').toLowerCase();
    const orderStatus = order.status || 'รอดำเนินการ';

    const nameMatch = !nameSearch || customerName.includes(nameSearch);
    const phoneMatch = !phoneSearch || customerPhone.includes(phoneSearch);
    const statusMatch = !statusFilter || orderStatus === statusFilter;

    if (nameMatch && phoneMatch && statusMatch) {
      filteredOrders[id] = order;
    }
  });

  displayOrders(filteredOrders);
  
  const resultCount = Object.keys(filteredOrders).length;
  if (resultCount === 0 && (nameSearch || phoneSearch || statusFilter)) {
    showStatus('ไม่พบออร์เดอร์ที่ตรงกับเงื่อนไขการค้นหา', 'error');
  } else if (nameSearch || phoneSearch || statusFilter) {
    showStatus(`พบออร์เดอร์ ${resultCount} รายการ`, 'success');
  }
}

function filterOrders() {
  searchAdminOrders();
}

function addItem() {
  const name = document.getElementById('productName')?.value.trim() || '';
  const size = document.getElementById('productWeight')?.value.trim() || '';
  const qtyRaw = document.getElementById('productQty')?.value;
  const priceRaw = document.getElementById('productPrice')?.value;

  const qty = qtyRaw ? parseInt(qtyRaw) : 0;
  const price = priceRaw ? parseFloat(priceRaw) : 0;

  const item = {
    id: Date.now(),
    name,
    size,
    qty,
    price,
    total: qty * price,
  };

  items.push(item);
  updateItemList();
  clearProductForm();

  isOrderSaved = false;
}

function confirmRemoveItem(id) {
  if (confirm('คุณต้องการลบสินค้านี้หรือไม่?')) {
    removeItem(id);
  }
}

function removeItem(id) {
  items = items.filter(item => item.id !== id);
  updateItemList();
  isOrderSaved = false;
  showStatus('ลบสินค้าเรียบร้อยแล้ว', 'success');
}

function editItem(id) {
  const item = items.find(item => item.id === id);
  if (!item) return;

  document.getElementById('productName').value = item.name;
  document.getElementById('productWeight').value = item.size || '';
  document.getElementById('productQty').value = item.qty;
  document.getElementById('productPrice').value = item.price;

  items = items.filter(item => item.id !== id);
  updateItemList();
  isOrderSaved = false;
  
  document.getElementById('productName').scrollIntoView({ behavior: 'smooth' });
  document.getElementById('productName').focus();
  
  showStatus('กรุณาแก้ไขข้อมูลสินค้าและกดเพิ่มสินค้าอีกครั้ง', 'info');
}

function updateItemList() {
  const itemList = document.getElementById('itemList');
  const totalQtyElement = document.getElementById('totalQty');
  const totalPriceElement = document.getElementById('totalPrice');
  const cartBadge = document.getElementById('cartBadge');

  if (items.length === 0) {
    itemList.innerHTML = '<li class="text-center py-12 text-gray-500 premium-card rounded-2xl border-4 border-dashed border-gray-300"><div class="text-5xl mb-4 icon-bounce">🛒</div><p class="font-bold text-lg">ยังไม่มีสินค้าในตะกร้า</p><p class="text-base mt-2 font-medium">เพิ่มสินค้าเพื่อเริ่มสร้างออร์เดอร์</p><div class="flex justify-center mt-4 space-x-1"><div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div><div class="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style="animation-delay: 0.2s"></div><div class="w-2 h-2 bg-gray-600 rounded-full animate-pulse" style="animation-delay: 0.4s"></div></div></li>';
    if (totalQtyElement) totalQtyElement.textContent = '0';
    if (totalPriceElement) totalPriceElement.textContent = '0.00';
    if (cartBadge) cartBadge.textContent = '0 รายการ';
    return;
  }

  itemList.innerHTML = items.map(item => `
    <li class="premium-card p-4 md:p-6 rounded-2xl premium-shadow card-hover border-l-4 border-honey-400">
      <div class="block md:hidden">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 honey-gradient rounded-xl flex items-center justify-center premium-shadow pulse-ring flex-shrink-0">
            <span class="text-base icon-bounce">🍌</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-black text-base text-gray-800 truncate">
              ${item.name}
            </div>
            ${item.size ? `<div class="text-xs text-gray-600 font-medium truncate">${item.size}</div>` : ''}
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <button onclick="editItem(${item.id})" class="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white px-2 py-2 rounded-lg text-xs font-bold transition-all duration-300 transform hover:scale-105 premium-shadow">
              <span class="text-sm">✏️</span>
            </button>
            <button onclick="confirmRemoveItem(${item.id})" class="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white px-2 py-2 rounded-lg text-xs font-bold transition-all duration-300 transform hover:scale-105 premium-shadow">
              <span class="text-sm">🗑️</span>
            </button>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-gray-50 to-white p-3 rounded-xl border-2 border-gray-100">
          <div class="grid grid-cols-2 gap-3 text-sm mb-3">
            <div class="flex items-center justify-between">
              <span class="text-gray-600 font-medium text-xs">จำนวน:</span>
              <span class="font-black text-blue-600 text-base">${item.qty}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-600 font-medium text-xs">ราคา/หน่วย:</span>
              <span class="font-black text-green-600 text-base">${item.price.toFixed(2)}</span>
            </div>
          </div>
          <div class="border-t border-gray-200 pt-3">
            <div class="flex items-center justify-between">
              <span class="text-gray-700 font-bold text-sm">ยอดรวม:</span>
              <span class="font-black text-green-600 text-lg">${item.total.toFixed(2)} บาท</span>
            </div>
          </div>
        </div>
      </div>

      <div class="hidden md:flex justify-between items-start">
        <div class="flex-1">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 honey-gradient rounded-2xl flex items-center justify-center premium-shadow pulse-ring">
              <span class="text-lg icon-bounce">🍌</span>
            </div>
            <div>
              <div class="font-black text-lg text-gray-800">
                ${item.name}
              </div>
              ${item.size ? `<div class="text-sm text-gray-600 font-medium">${item.size}</div>` : ''}
            </div>
          </div>
          <div class="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border-2 border-gray-100">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-gray-600 font-medium">จำนวน:</span>
                <span class="font-black text-blue-600 text-lg">${item.qty}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-600 font-medium">ราคา/หน่วย:</span>
                <span class="font-black text-green-600 text-lg">${item.price.toFixed(2)} บาท</span>
              </div>
            </div>
          </div>
        </div>
        <div class="text-right ml-6 flex flex-col items-end gap-3">
          <div class="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white px-4 py-3 rounded-xl premium-shadow neon-glow">
            <div class="text-xs font-bold">ยอดรวม</div>
            <div class="text-lg font-black">${item.total.toFixed(2)} บาท</div>
          </div>
          <div class="flex gap-2">
            <button onclick="editItem(${item.id})" class="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white px-3 py-2 rounded-xl text-sm font-bold transition-all duration-500 transform hover:scale-110 premium-shadow hover:neon-glow">
              <span class="text-base mr-1">✏️</span> แก้ไข
            </button>
            <button onclick="confirmRemoveItem(${item.id})" class="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white px-3 py-2 rounded-xl text-sm font-bold transition-all duration-500 transform hover:scale-110 premium-shadow hover:neon-glow">
              <span class="text-base mr-1">🗑️</span> ลบ
            </button>
          </div>
        </div>
      </div>
    </li>
  `).join('');

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  if (totalQtyElement) totalQtyElement.textContent = totalItems;
  if (totalPriceElement) totalPriceElement.textContent = totalAmount.toFixed(2);
  if (cartBadge) cartBadge.textContent = `${items.length} รายการ`;
}

function clearProductForm() {
  document.getElementById('productName').value = '';
  document.getElementById('productWeight').value = '';
  document.getElementById('productQty').value = '';
  document.getElementById('productPrice').value = '';
}

function generateOrderObject() {
  const customerName = document.getElementById('customerName').value.trim();
  const customerPhone = document.getElementById('customerPhone').value.trim();
  const customerAddress = document.getElementById('customerAddress').value.trim();

  if (!customerName || !customerPhone || !customerAddress) {
    showStatus('กรุณากรอกข้อมูลลูกค้าให้ครบถ้วน (ชื่อ, เบอร์โทร, ที่อยู่)', 'error');
    return null;
  }

  if (items.length === 0) {
    showStatus('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ', 'error');
    return null;
  }

  return {
    customer: {
      name: customerName,
      phone: customerPhone,
      address: customerAddress
    },
    items: items,
    totalAmount: items.reduce((sum, item) => sum + item.total, 0),
    orderDate: new Date().toISOString(),
    status: 'รอดำเนินการ'
  };
}

function confirmGenerateReceipt() {
  if (!isOrderSaved) {
    alert("กรุณาบันทึกออร์เดอร์ก่อนสร้างใบเสร็จ");
    return;
  }

  generateReceipt();
}

function generateReceipt() {
  const order = generateOrderObject();
  if (!order) return;

  showReceiptView({
    id: `ORD${Date.now()}`,
    ...order
  });
  
  items = [];
  document.getElementById('customerName').value = '';
  document.getElementById('customerPhone').value = '';
  document.getElementById('customerAddress').value = '';
  clearProductForm();
  updateItemList();
  
  isOrderSaved = false;
  
  showStatus('สร้างใบเสร็จเรียบร้อยแล้ว', 'success');
}

function confirmSaveOrder() {
  if (!confirm("คุณต้องการบันทึกออร์เดอร์นี้ใช่หรือไม่?")) return;

  const order = generateOrderObject();
  if (!order || order.items.length === 0) {
    alert("กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการก่อนบันทึก");
    return;
  }

  showStatus('กำลังบันทึกออร์เดอร์...', 'info');

  window.saveOrderToFirebase(order).then(success => {
    if (success) {
      isOrderSaved = true;
      showStatus("บันทึกออร์เดอร์สำเร็จ", "success");
      setTimeout(() => confirmGenerateReceipt(), 500);
    } else {
      showStatus("เกิดข้อผิดพลาดในการบันทึกออร์เดอร์", "error");
    }
  }).catch(error => {
    console.error('Error saving order:', error);
    showStatus("เกิดข้อผิดพลาดในการบันทึกออร์เดอร์", "error");
  });
}

async function searchOrders() {
  const searchTerm = document.getElementById('searchInput').value.trim();
  
  if (!searchTerm) {
    showStatus('กรุณากรอกชื่อลูกค้าหรือเบอร์โทรศัพท์', 'error');
    return;
  }

  showStatus('กำลังค้นหาออร์เดอร์...', 'info');

  try {
    const orders = await window.getOrdersFromFirebase();
    
    if (!orders || Object.keys(orders).length === 0) {
      displaySearchResults([]);
      showStatus('ไม่พบออร์เดอร์ในระบบ', 'error');
      return;
    }

    const filteredOrders = Object.entries(orders)
      .filter(([id, order]) => {
        const customerName = (order.customer?.name || '').toLowerCase();
        const customerPhone = (order.customer?.phone || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        return customerName.includes(searchLower) || customerPhone.includes(searchLower);
      })
      .map(([id, order]) => ({ id, ...order }));

    displaySearchResults(filteredOrders);
    
    if (filteredOrders.length === 0) {
      showStatus('ไม่พบออร์เดอร์ที่ตรงกับการค้นหา', 'error');
    } else {
      showStatus(`พบออร์เดอร์ ${filteredOrders.length} รายการ`, 'success');
    }
  } catch (error) {
    showStatus('เกิดข้อผิดพลาดในการค้นหา', 'error');
    console.error('Search error:', error);
  }
}

function displaySearchResults(orders) {
  const searchResults = document.getElementById('searchResults');
  const searchResultsList = document.getElementById('searchResultsList');
  const searchCount = document.getElementById('searchCount');
  
  if (orders.length === 0) {
    searchResults.classList.add('hidden');
    return;
  }

  searchCount.textContent = `${orders.length} รายการ`;
  orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

  searchResultsList.innerHTML = orders.map(order => {
    const statusColor = getStatusColor(order.status || 'รอดำเนินการ');
    const statusIcon = getStatusIcon(order.status || 'รอดำเนินการ');
    
    return `
      <div class="bg-white border border-orange-200 rounded-xl p-4 hover:border-orange-300 hover:shadow-md cursor-pointer transition-all duration-200 transform hover:scale-102" onclick="showReceiptView(${JSON.stringify(order).replace(/"/g, '&quot;')})">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h3 class="font-bold text-lg text-gray-800">${order.customer?.name || 'ไม่ระบุชื่อ'}</h3>
            <p class="text-sm text-gray-600 flex items-center gap-1">
              <span>📱</span> ${order.customer?.phone || 'ไม่ระบุเบอร์'}
            </p>
            <p class="text-sm text-gray-600 flex items-center gap-1">
              <span>🛒</span> ${order.items?.length || 0} รายการสินค้า
            </p>
          </div>
          <div class="text-right">
            <p class="font-bold text-xl text-green-600">${order.totalAmount?.toFixed(2) || '0.00'} บาท</p>
            <p class="text-xs text-gray-500">${new Date(order.orderDate).toLocaleString('th-TH')}</p>
          </div>
        </div>
        
        <div class="flex items-center justify-center pt-3 border-t border-orange-100">
          <span class="px-4 py-2 rounded-full text-sm font-bold ${statusColor} shadow-sm">
            ${statusIcon} ${order.status || 'รอดำเนินการ'}
          </span>
        </div>
      </div>
    `;
  }).join('');

  searchResults.classList.remove('hidden');
}

function handleSearchKeyPress(event) {
  if (event.key === 'Enter') {
    searchOrders();
  }
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResults').classList.add('hidden');
  showStatus('ล้างการค้นหาเรียบร้อยแล้ว', 'success');
}

function showStatus(message, type) {
  const statusElement = document.getElementById('statusMessage');
  if (!statusElement) return;

  statusElement.textContent = message;
  statusElement.className = `p-4 rounded-xl text-center font-semibold shadow-lg ${
    type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
    type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
    'bg-blue-100 text-blue-800 border border-blue-200'
  }`;
  statusElement.classList.remove('hidden');
  
  setTimeout(() => {
    statusElement.classList.add('hidden');
  }, 3000);
}

function showReceiptView(order) {
  currentReceiptOrder = order;
  document.getElementById('adminDashboard')?.classList.add('hidden');
  document.getElementById('mainOrderForm')?.classList.add('hidden');
  document.getElementById('receiptView').classList.remove('hidden');
  
  document.getElementById('loginButtonContainer').classList.add('hidden');
  
  document.getElementById('receiptDate').textContent = new Date(order.orderDate).toLocaleString('th-TH');
  document.getElementById('receiptCustomerName').textContent = order.customer?.name || 'ไม่ระบุชื่อ';
  document.getElementById('receiptCustomerPhone').textContent = order.customer?.phone || 'ไม่ระบุเบอร์';
  document.getElementById('receiptCustomerAddress').textContent = order.customer?.address || 'ไม่ระบุที่อยู่';

  const receiptItems = document.getElementById('receiptItems');
  receiptItems.innerHTML = order.items?.map(item => `
    <tr class="border-b border-gray-200">
      <td class="p-3 text-sm font-medium">${item.name}${item.size ? ` (${item.size})` : ''}</td>
      <td class="p-3 text-sm text-center">${item.qty}</td>
      <td class="p-3 text-sm text-center">${item.price?.toFixed(2) || '0.00'}</td>
      <td class="p-3 text-sm text-right font-semibold text-green-600">${item.total?.toFixed(2) || '0.00'}</td>
    </tr>
  `).join('') || '<tr><td colspan="4" class="p-6 text-center text-gray-500">ไม่มีรายการสินค้า</td></tr>';

  document.getElementById('receiptTotal').textContent = order.totalAmount?.toFixed(2) || '0.00';
  
  const statusColor = getStatusColor(order.status || 'รอดำเนินการ');
  const statusIcon = getStatusIcon(order.status || 'รอดำเนินการ');
  document.getElementById('receiptStatus').className = `status-badge ${statusColor}`;
  document.getElementById('receiptStatus').innerHTML = `<span class="text-base">${statusIcon}</span> สถานะ: ${order.status || 'รอดำเนินการ'}`;
}

function backToAdmin() {
  document.getElementById('loginButtonContainer').classList.remove('hidden');
  
  if (isLoggedIn) {
    window.location.href = 'admin.html';
  } else {
    window.location.href = 'index.html';
  }
}

function openPrintableReceipt() {
  const receiptHTML = document.getElementById("receiptContent").outerHTML;

  const win = window.open('', '_blank');
  win.document.write(`
    <html>
    <head>
      <title>ใบเสร็จร้านแม่ดอนโอทอป</title>
      <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;600;800&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Kanit', sans-serif;
          margin: 0;
          padding: 0;
          background: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        #receiptContent {
          max-width: 700px;
          margin: auto;
          padding: 20px;
          background: white;
        }

        .receipt-watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-size: 5rem;
          color: rgba(0, 0, 0, 0.03);
          font-weight: 900;
          white-space: nowrap;
          pointer-events: none;
          user-select: none;
          z-index: 0;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        @page {
          size: A4;
          margin: 20mm;
        }

        @media print {
          .no-print {
            display: none !important;
          }

          .receipt-watermark {
            opacity: 0.04 !important;
          }
        }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      ${receiptHTML}
    </body>
    </html>
  `);

  win.document.close();
}

async function downloadReceiptAsImage() {
  if (!currentReceiptOrder) return;

  const receiptContent = document.getElementById('receiptContent');
  if (!receiptContent) {
    showStatus('ไม่พบเนื้อหาใบเสร็จ', 'error');
    return;
  }

  showStatus('กำลังสร้างรูปภาพ...', 'info');

  try {
    const canvas = await html2canvas(receiptContent, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true
    });

    const customerName = currentReceiptOrder.customer?.name?.trim() || 'ลูกค้า';
    const sanitizedName = customerName.replace(/[\\/:*?"<>|]/g, '');
    const dateStr = new Date().toISOString().split('T')[0];

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `ใบเสร็จ-${sanitizedName}-${dateStr}.png`;
    link.click();

    showStatus(`ดาวน์โหลดใบเสร็จของ ${sanitizedName} เรียบร้อยแล้ว ✅`, 'success');
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสร้างรูปภาพใบเสร็จ:', error);
    showStatus('เกิดข้อผิดพลาดในการดาวน์โหลดรูปภาพ', 'error');
  }
}

function getStatusColor(status) {
  switch(status) {
    case 'รอดำเนินการ': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'กำลังจัดส่ง': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'จัดส่งแล้ว': return 'bg-green-100 text-green-800 border-green-200';
    case 'ยกเลิก': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getStatusIcon(status) {
  switch(status) {
    case 'รอดำเนินการ': return '⏳';
    case 'กำลังจัดส่ง': return '🚚';
    case 'จัดส่งแล้ว': return '✅';
    case 'ยกเลิก': return '❌';
    default: return '📦';
  }
}
