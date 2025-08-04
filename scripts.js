// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, push, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDAaW-OyL_13qkF7sCxXkMhpJyrOtntjg",
  authDomain: "orders-3d979.firebaseapp.com",
  databaseURL: "https://orders-3d979-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "orders-3d979",
  storageBucket: "orders-3d979.firebasestorage.app",
  messagingSenderId: "1048840913149",
  appId: "1:1048840913149:web:4f1b772b853b602cc93e94",
  measurementId: "G-P5JPR90CX8"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const ordersRef = ref(database, 'orders');

let allOrdersData = [];

// --- Functions for index.html (Order Form) ---
const statusMessage = document.getElementById('statusMessage');
const cartItemsContainer = document.getElementById('cartItems');
const cartSummary = document.getElementById('cartSummary');
const mainOrderForm = document.getElementById('mainOrderForm');
const receiptView = document.getElementById('receiptView');
const productNameSelect = document.getElementById('productNameSelect');
const productNameInput = document.getElementById('productName');
const productWeightSelect = document.getElementById('productWeightSelect');
const productWeightInput = document.getElementById('productWeight');
let cart = [];

window.selectProductName = () => {
    productNameInput.value = '';
};

window.clearProductSelect = () => {
    productNameSelect.value = '';
};

window.selectProductWeight = () => {
    productWeightInput.value = '';
};

window.clearWeightSelect = () => {
    productWeightSelect.value = '';
};

window.addItem = () => {
    const productName = productNameInput.value || productNameSelect.value;
    const productWeight = productWeightInput.value || productWeightSelect.value;
    const productQty = document.getElementById('productQty').value;
    const productPrice = document.getElementById('productPrice').value;

    if (!productName || !productQty || !productPrice || !productWeight) {
        showStatusMessage('กรุณากรอกข้อมูลสินค้าให้ครบ', 'error');
        return;
    }

    const item = {
        name: productName,
        weight: productWeight,
        quantity: parseInt(productQty),
        price: parseFloat(productPrice),
        total: parseFloat(productQty) * parseFloat(productPrice)
    };

    cart.push(item);
    renderCart();
    document.getElementById('productForm').reset();
    showStatusMessage('เพิ่มสินค้าลงในตะกร้าแล้ว', 'success');
};

function renderCart() {
    let totalAmount = 0;
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = '';
    const cartCount = document.getElementById('cartCount');

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <div class="text-6xl mb-4 animate-bounce-slow">🍌</div>
                <p class="text-xl font-semibold">ตะกร้าว่างเปล่า</p>
                <p class="text-sm mt-2">เพิ่มกล้วยและสินค้าอื่นๆ เพื่อเริ่มสั่งซื้อ</p>
            </div>
        `;
        if (cartSummary) cartSummary.classList.add('hidden');
        if (cartCount) cartCount.textContent = '0 รายการ';
        return;
    }

    if (cartSummary) cartSummary.classList.remove('hidden');
    if (cartCount) cartCount.textContent = `${cart.length} รายการ`;

    cart.forEach((item, index) => {
        totalAmount += item.total;
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <div class="flex-1">
                <p class="font-bold text-gray-800">${item.name}</p>
                <p class="text-sm text-gray-500">${item.weight} x ${item.quantity}</p>
            </div>
            <div class="text-right">
                <p class="font-semibold text-gray-700">${item.total.toFixed(2)} บาท</p>
                <button onclick="removeItem(${index})" class="text-red-500 text-xs hover:text-red-700 transition-colors">ลบ</button>
            </div>
        `;
        cartItemsContainer.appendChild(itemElement);
    });

    const totalAmountEl = document.getElementById('totalAmount');
    if (totalAmountEl) totalAmountEl.textContent = totalAmount.toFixed(2);
}

window.removeItem = (index) => {
    cart.splice(index, 1);
    renderCart();
};

window.submitOrder = () => {
    const customerName = document.getElementById('customerName')?.value;
    const customerPhone = document.getElementById('customerPhone')?.value;
    const customerAddress = document.getElementById('customerAddress')?.value;

    if (cart.length === 0) {
        showStatusMessage('กรุณาเพิ่มสินค้าในตะกร้าก่อน', 'error');
        return;
    }
    if (!customerName || !customerPhone || !customerAddress) {
        showStatusMessage('กรุณากรอกข้อมูลลูกค้าให้ครบ', 'error');
        return;
    }

    const orderData = {
        customerName: customerName,
        customerPhone: customerPhone,
        customerAddress: customerAddress,
        items: cart,
        total: cart.reduce((sum, item) => sum + item.total, 0),
        status: 'รอดำเนินการ',
        timestamp: new Date().toISOString()
    };

    push(ordersRef, orderData)
        .then(() => {
            showReceipt(orderData);
            cart = [];
            if (document.getElementById('productForm')) document.getElementById('productForm').reset();
            if (document.getElementById('customerName')) document.getElementById('customerName').value = '';
            if (document.getElementById('customerPhone')) document.getElementById('customerPhone').value = '';
            if (document.getElementById('customerAddress')) document.getElementById('customerAddress').value = '';
            showStatusMessage('บันทึกออร์เดอร์เรียบร้อยแล้ว', 'success');
        })
        .catch((error) => {
            console.error("Error adding document: ", error);
            showStatusMessage('เกิดข้อผิดพลาดในการบันทึกออร์เดอร์', 'error');
        });
};

function showStatusMessage(message, type) {
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.className = `p-3 rounded-xl font-semibold mb-4 text-center ${type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`;
    statusMessage.classList.remove('hidden');
}

function showReceipt(orderData) {
    if (!mainOrderForm || !receiptView) return;
    mainOrderForm.classList.add('hidden');
    receiptView.classList.remove('hidden');

    const receiptDate = document.getElementById('receiptDate');
    const receiptCustomerName = document.getElementById('receiptCustomerName');
    const receiptCustomerPhone = document.getElementById('receiptCustomerPhone');
    const receiptCustomerAddress = document.getElementById('receiptCustomerAddress');
    const receiptTotal = document.getElementById('receiptTotal');
    const receiptItemsContainer = document.getElementById('receiptItems');

    if (receiptDate) receiptDate.textContent = new Date().toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' });
    if (receiptCustomerName) receiptCustomerName.textContent = orderData.customerName;
    if (receiptCustomerPhone) receiptCustomerPhone.textContent = orderData.customerPhone;
    if (receiptCustomerAddress) receiptCustomerAddress.textContent = orderData.customerAddress;
    if (receiptTotal) receiptTotal.textContent = orderData.total.toFixed(2);

    if (receiptItemsContainer) {
        receiptItemsContainer.innerHTML = '';
        orderData.items.forEach(item => {
            const itemElement = document.createElement('tr');
            itemElement.innerHTML = `
                <td class="p-3 text-left">${item.name} (${item.weight})</td>
                <td class="p-3 text-center">${item.quantity}</td>
                <td class="p-3 text-center">${item.price.toFixed(2)}</td>
                <td class="p-3 text-right">${item.total.toFixed(2)}</td>
            `;
            receiptItemsContainer.appendChild(itemElement);
        });
    }

    updateReceiptStatus(orderData.status);
}

window.openPrintableReceipt = () => {
    const originalBody = document.body.innerHTML;
    const receiptContent = document.getElementById('receiptContent')?.innerHTML;
    if (!receiptContent) return;
    document.body.innerHTML = `<div class="print-container">${receiptContent}</div>`;
    window.print();
    document.body.innerHTML = originalBody;
    window.location.reload();
};

window.downloadReceiptAsImage = () => {
    const receiptContent = document.getElementById('receiptContent');
    if (!receiptContent) return;
    html2canvas(receiptContent, { scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `receipt_${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
};

// --- Functions for admin.html (Dashboard) ---
let currentOrderId = null;

window.listenForOrders = () => {
    onValue(ordersRef, (snapshot) => {
        const orders = snapshot.val();
        allOrdersData = orders ? Object.entries(orders).map(([key, value]) => ({ key, ...value })) : [];
        renderOrders();
        updateDashboard();
    }, {
        onlyOnce: false
    });
};

window.updateDashboard = () => {
    const totalRevenue = allOrdersData.filter(o => o.status !== 'ยกเลิก').reduce((sum, order) => sum + order.total, 0);
    const totalOrders = allOrdersData.length;
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = allOrdersData.filter(order => order.timestamp.slice(0, 10) === today).length;
    const pendingOrders = allOrdersData.filter(order => order.status === 'รอดำเนินการ').length;

    const totalRevenueEl = document.getElementById('totalRevenue');
    const totalOrdersEl = document.getElementById('totalOrders');
    const todayOrdersEl = document.getElementById('todayOrders');
    const pendingOrdersEl = document.getElementById('pendingOrders');
    const displayedOrdersCountEl = document.getElementById('displayedOrdersCount');
    const lastUpdateEl = document.getElementById('lastUpdate');

    if (totalRevenueEl) totalRevenueEl.textContent = `${totalRevenue.toLocaleString()} บาท`;
    if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
    if (todayOrdersEl) todayOrdersEl.textContent = todayOrders;
    if (pendingOrdersEl) pendingOrdersEl.textContent = pendingOrders;
    if (displayedOrdersCountEl) displayedOrdersCountEl.textContent = allOrdersData.length;
    if (lastUpdateEl) lastUpdateEl.textContent = new Date().toLocaleString('th-TH');
};

window.renderOrders = (filteredOrders = null) => {
    const ordersToRender = filteredOrders || allOrdersData;
    const orderListContainer = document.getElementById('orderList');
    const emptyOrdersState = document.getElementById('emptyOrdersState');

    if (!orderListContainer || !emptyOrdersState) return;

    orderListContainer.innerHTML = '';
    if (ordersToRender.length === 0) {
        emptyOrdersState.classList.remove('hidden');
        const displayedOrdersCountEl = document.getElementById('displayedOrdersCount');
        if (displayedOrdersCountEl) displayedOrdersCountEl.textContent = 0;
        return;
    } else {
        emptyOrdersState.classList.add('hidden');
    }

    const displayedOrdersCountEl = document.getElementById('displayedOrdersCount');
    if (displayedOrdersCountEl) displayedOrdersCountEl.textContent = ordersToRender.length;

    ordersToRender.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'premium-card p-6 md:p-8 rounded-3xl premium-shadow border-l-8 card-hover transition-transform duration-300 transform hover:scale-[1.01]';
        
        let statusColor = '';
        if (order.status === 'รอดำเนินการ') {
            statusColor = 'border-orange-500';
        } else if (order.status === 'กำลังจัดส่ง') {
            statusColor = 'border-blue-500';
        } else if (order.status === 'จัดส่งแล้ว') {
            statusColor = 'border-green-500';
        } else if (order.status === 'ยกเลิก') {
            statusColor = 'border-red-500';
        }
        orderElement.classList.add(statusColor);

        orderElement.innerHTML = `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div class="flex-1 min-w-0">
                    <p class="text-xs text-gray-500 mb-1">
                        รหัส: <span class="font-mono text-gray-600">${order.key.substring(0, 8)}</span>
                    </p>
                    <p class="text-xl font-bold text-gray-800 truncate">${order.customerName}</p>
                    <p class="text-sm text-gray-600 truncate">${order.customerPhone}</p>
                </div>
                <div class="text-right flex-shrink-0">
                    <p class="text-xs text-gray-500 mb-1">ยอดรวม</p>
                    <p class="text-2xl font-black text-green-600">${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท</p>
                </div>
            </div>
            <div class="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t border-gray-200 pt-4">
                <div class="flex items-center gap-2">
                    ${getStatusBadge(order.status)}
                    <span class="text-sm text-gray-500">สั่งเมื่อ: ${formatDate(order.timestamp)}</span>
                </div>
                <button onclick="openOrderDetail('${order.key}')" class="btn-secondary px-6 py-3 text-sm font-bold w-full sm:w-auto">
                    <span class="text-lg mr-2">🔍</span> ดูรายละเอียด
                </button>
            </div>
        `;
        orderListContainer.appendChild(orderElement);
    });
};

function getStatusBadge(status) {
    let colorClass = '';
    let icon = '';
    if (status === 'รอดำเนินการ') {
        colorClass = 'bg-orange-100 text-orange-700';
        icon = '⏳';
    } else if (status === 'กำลังจัดส่ง') {
        colorClass = 'bg-blue-100 text-blue-700';
        icon = '🚚';
    } else if (status === 'จัดส่งแล้ว') {
        colorClass = 'bg-green-100 text-green-700';
        icon = '✅';
    } else if (status === 'ยกเลิก') {
        colorClass = 'bg-red-100 text-red-700';
        icon = '❌';
    }
    return `
        <div class="status-badge ${colorClass}">
            <span class="text-base">${icon}</span>
            <span class="text-sm font-semibold">${status}</span>
        </div>
    `;
}

function formatDate(timestamp) {
    if (!timestamp) return 'ไม่มีข้อมูล';
    const date = new Date(timestamp);
    return date.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
}

window.filterOrders = () => {
    const searchTerm = document.getElementById('adminSearchInput')?.value.toLowerCase() || '';
    const phoneTerm = document.getElementById('adminPhoneInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';

    const filtered = allOrdersData.filter(order => {
        const nameMatch = order.customerName.toLowerCase().includes(searchTerm);
        const phoneMatch = order.customerPhone.includes(phoneTerm);
        const statusMatch = statusFilter ? order.status === statusFilter : true;
        return nameMatch && phoneMatch && statusMatch;
    });

    renderOrders(filtered);
};

window.openOrderDetail = (orderKey) => {
    const order = allOrdersData.find(o => o.key === orderKey);
    if (!order) return;

    currentOrderId = orderKey;
    
    document.getElementById('orderIdDisplay').textContent = orderKey.substring(0, 8);
    document.getElementById('modalCustomerName').textContent = order.customerName;
    document.getElementById('modalCustomerPhone').textContent = order.customerPhone;
    document.getElementById('modalCustomerAddress').textContent = order.customerAddress;
    document.getElementById('modalTotalAmount').textContent = order.total.toLocaleString(undefined, { minimumFractionDigits: 2 });
    document.getElementById('orderStatusSelect').value = order.status;

    const itemsContainer = document.getElementById('modalOrderItems');
    if (itemsContainer) {
        itemsContainer.innerHTML = '';
        order.items.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'border-t border-gray-100';
            row.innerHTML = `
                <td class="p-3">${item.name} (${item.weight})</td>
                <td class="p-3 text-center">${item.quantity}</td>
                <td class="p-3 text-right">${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            `;
            itemsContainer.appendChild(row);
        });
    }

    const orderDetailModal = document.getElementById('orderDetailModal');
    if (orderDetailModal) {
      orderDetailModal.classList.remove('hidden');
      orderDetailModal.classList.add('flex');
    }
};

window.closeModal = () => {
    document.getElementById('orderDetailModal')?.classList.add('hidden');
    document.getElementById('orderDetailModal')?.classList.remove('flex');
    currentOrderId = null;
};

window.updateOrderStatus = () => {
    if (!currentOrderId) return;

    const newStatus = document.getElementById('orderStatusSelect').value;
    const orderToUpdate = allOrdersData.find(o => o.key === currentOrderId);
    if (!orderToUpdate) return;

    const updates = {};
    updates['/orders/' + currentOrderId + '/status'] = newStatus;

    update(ref(database), updates)
        .then(() => {
            closeModal();
            console.log("Status updated successfully.");
        })
        .catch((error) => {
            console.error("Error updating status: ", error);
            alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
        });
};

window.refreshOrders = () => {
    filterOrders();
};

window.handlePasswordKeyPress = (event) => {
    if (event.key === 'Enter') {
        window.login();
    }
};

window.handleAdminSearchKeyPress = (event) => {
    if (event.key === 'Enter') {
        window.searchAdminOrders();
    }
};

window.searchAdminOrders = () => {
    window.filterOrders();
};

function updateReceiptStatus(status) {
    const statusDiv = document.getElementById('receiptStatus');
    if (!statusDiv) return;
    statusDiv.textContent = `สถานะ: ${status}`;
    if (status === 'รอดำเนินการ') {
        statusDiv.className = 'status-badge bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200';
    } else if (status === 'กำลังจัดส่ง') {
        statusDiv.className = 'status-badge bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 border border-amber-200';
    } else if (status === 'จัดส่งแล้ว') {
        statusDiv.className = 'status-badge bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200';
    } else if (status === 'ยกเลิก') {
        statusDiv.className = 'status-badge bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200';
    }
}
