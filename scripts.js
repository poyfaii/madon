// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, update } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-analytics.js";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const analytics = getAnalytics(app);

// Global state variables
let items = [];
let currentReceiptOrder = null;
let currentOrderToUpdate = null;

// --- DOM elements and event listeners ---
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('productForm')) {
        // This is the index page
        updateCartDisplay();
        document.getElementById('productForm').addEventListener('submit', function(e) {
            e.preventDefault();
            addItem();
        });
    }

    if (document.getElementById('orderList')) {
        // This is the admin page
        listenForOrders();
        document.getElementById('orderDetailModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
        document.getElementById('updateStatusBtn').addEventListener('click', updateOrderStatus);
    }
});

// --- General Functions ---
window.selectProductName = function() {
    const select = document.getElementById('productNameSelect');
    const input = document.getElementById('productName');
    if (select.value) {
        input.value = select.value;
    }
}

window.clearProductSelect = function() {
    document.getElementById('productNameSelect').value = '';
}

window.selectProductWeight = function() {
    const select = document.getElementById('productWeightSelect');
    const input = document.getElementById('productWeight');
    if (select.value) {
        input.value = select.value;
    }
}

window.clearWeightSelect = function() {
    document.getElementById('productWeightSelect').value = '';
}

window.showStatus = function(message, type) {
    const statusDiv = document.getElementById('statusMessage');
    if (!statusDiv) return;
    statusDiv.className = type === 'success' ? 'status-success' : type === 'error' ? 'status-error' : 'status-info';
    statusDiv.innerHTML = `<span class="text-xl">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span><span>${message}</span>`;
    statusDiv.classList.remove('hidden');
    
    setTimeout(() => {
        statusDiv.classList.add('hidden');
    }, 3000);
}

window.getStatusColor = function(status) {
    switch(status) {
      case 'รอดำเนินการ': return 'รอดำเนินการ';
      case 'กำลังจัดส่ง': return 'กำลังจัดส่ง';
      case 'จัดส่งแล้ว': return 'จัดส่งแล้ว';
      case 'ยกเลิก': return 'ยกเลิก';
      default: return '';
    }
}

window.getStatusIcon = function(status) {
    switch(status) {
      case 'รอดำเนินการ': return '⏳';
      case 'กำลังจัดส่ง': return '🚚';
      case 'จัดส่งแล้ว': return '✅';
      case 'ยกเลิก': return '❌';
      default: return '📦';
    }
}

window.closeModal = function() {
    const modal = document.getElementById('orderDetailModal') || document.getElementById('successModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}


// --- Index Page Logic ---
window.addItem = function() {
    const name = document.getElementById('productName').value.trim();
    const weight = document.getElementById('productWeight').value.trim();
    const qty = parseInt(document.getElementById('productQty').value);
    const priceInput = document.getElementById('productPrice').value;
    const price = priceInput === '' ? 0 : parseFloat(priceInput);

    if (!name || qty <= 0) {
        showStatus('กรุณากรอกชื่อสินค้าและจำนวนให้ถูกต้อง', 'error');
        return;
    }
    if (price < 0) {
        showStatus('ราคาต้องไม่ติดลบ', 'error');
        return;
    }

    const item = {
        id: Date.now(),
        name: name,
        size: weight || '-',
        qty: qty,
        price: price,
        total: qty * price
    };

    items.push(item);
    updateCartDisplay();
    clearForm();
    showStatus('เพิ่มสินค้าลงตะกร้าเรียบร้อยแล้ว!', 'success');
}

window.removeItem = function(id) {
    items = items.filter(item => item.id !== id);
    updateCartDisplay();
    showStatus('ลบสินค้าออกจากตะกร้าแล้ว', 'success');
}

window.editItem = function(id) {
    const item = items.find(item => item.id === id);
    if (!item) return;

    document.getElementById('productName').value = item.name;
    document.getElementById('productNameSelect').value = '';

    document.getElementById('productWeight').value = item.size === '-' ? '' : item.size;
    document.getElementById('productWeightSelect').value = '';

    document.getElementById('productQty').value = item.qty;
    document.getElementById('productPrice').value = item.price === 0 ? '' : item.price;

    items = items.filter(i => i.id !== id);
    updateCartDisplay();
    
    showStatus('ข้อมูลสินค้าถูกโหลดในฟอร์มแล้ว กรุณาแก้ไขและเพิ่มใหม่', 'success');
    document.getElementById('productForm').scrollIntoView({ behavior: 'smooth' });
}

window.updateCartDisplay = function() {
    const cartItemsDiv = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartSummary = document.getElementById('cartSummary');
    const totalAmount = document.getElementById('totalAmount');

    if (!cartItemsDiv || !cartCount) return;

    cartCount.textContent = items.length;

    if (items.length === 0) {
        cartItemsDiv.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <div class="text-6xl mb-4 animate-bounce-slow">🍌</div>
                <p class="text-xl font-semibold">ตะกร้าว่างเปล่า</p>
                <p class="text-sm mt-2">เพิ่มกล้วยและสินค้าอื่นๆ เพื่อเริ่มสั่งซื้อ</p>
            </div>
        `;
        if (cartSummary) cartSummary.classList.add('hidden');
        return;
    }

    let cartHTML = '';
    let total = 0;

    items.forEach(item => {
        total += item.total;
        cartHTML += `
            <div class="cart-item">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <h4 class="font-bold text-lg text-gray-800">${item.name}</h4>
                        <p class="text-gray-600">${item.size}</p>
                    </div>
                    <div class="flex gap-2 ml-4">
                        <button onclick="editItem(${item.id})" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105" title="แก้ไขสินค้า">
                            ✏️
                        </button>
                        <button onclick="removeItem(${item.id})" class="btn-danger" title="ลบสินค้า">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="flex justify-between items-center">
                    <div class="text-sm text-gray-600">
                        จำนวน: <span class="font-semibold">${item.qty}</span> × 
                        <span class="font-semibold">${item.price.toFixed(2)}</span> บาท
                    </div>
                    <div class="text-lg font-bold text-yellow-600">
                        ${item.total.toFixed(2)} บาท
                    </div>
                </div>
            </div>
        `;
    });

    cartItemsDiv.innerHTML = cartHTML;
    totalAmount.textContent = total.toFixed(2) + ' บาท';
    if (cartSummary) cartSummary.classList.remove('hidden');
}

function clearForm() {
    document.getElementById('productName').value = '';
    document.getElementById('productNameSelect').value = '';
    document.getElementById('productWeight').value = '';
    document.getElementById('productWeightSelect').value = '';
    document.getElementById('productQty').value = '1';
    document.getElementById('productPrice').value = '';
}

window.submitOrder = async function() {
    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const customerAddress = document.getElementById('customerAddress').value.trim();

    if (!customerName || !customerPhone || !customerAddress) {
        showStatus('กรุณากรอกข้อมูลลูกค้าให้ครบถ้วน', 'error');
        return;
    }

    if (items.length === 0) {
        showStatus('กรุณาเพิ่มสินค้าลงตะกร้าก่อนสั่งซื้อ', 'error');
        return;
    }

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
    const orderData = {
        customer: {
            name: customerName,
            phone: customerPhone,
            address: customerAddress
        },
        items: items,
        totalAmount: totalAmount,
        orderDate: new Date().toISOString(),
        status: 'รอดำเนินการ'
    };

    showStatus('กำลังบันทึกออร์เดอร์...', 'info');
    
    try {
        const ordersRef = ref(database, 'orders');
        const newOrderRef = push(ordersRef);
        await set(newOrderRef, orderData);
        showStatus("บันทึกออร์เดอร์สำเร็จ ✅", "success");
        
        showReceiptView({ id: newOrderRef.key, ...orderData });

        items = [];
        updateCartDisplay();
        document.getElementById('customerName').value = '';
        document.getElementById('customerPhone').value = '';
        document.getElementById('customerAddress').value = '';
    } catch (error) {
        console.error("Error saving order:", error);
        showStatus("เกิดข้อผิดพลาดในการบันทึกออร์เดอร์", "error");
    }
}

// --- Receipt functions ---
window.showReceiptView = function(order) {
    currentReceiptOrder = order;
    document.getElementById('mainOrderForm').classList.add('hidden');
    const receiptView = document.getElementById('receiptView');
    receiptView.classList.remove('hidden');

    document.getElementById('receiptDate').textContent = new Date(order.orderDate).toLocaleString('th-TH');
    document.getElementById('receiptCustomerName').textContent = order.customer?.name || 'ไม่ระบุชื่อ';
    document.getElementById('receiptCustomerPhone').textContent = order.customer?.phone || 'ไม่ระบุเบอร์';
    document.getElementById('receiptCustomerAddress').textContent = order.customer?.address || 'ไม่ระบุที่อยู่';

    const receiptItems = document.getElementById('receiptItems');
    receiptItems.innerHTML = order.items?.map(item => `
        <tr class="border-b border-gray-200">
          <td class="p-3 text-sm font-medium">${item.name}${item.size && item.size !== '-' ? ` (${item.size})` : ''}</td>
          <td class="p-3 text-sm text-center">${item.qty}</td>
          <td class="p-3 text-sm text-center">${item.price?.toFixed(2) || '0.00'}</td>
          <td class="p-3 text-sm text-right font-semibold text-green-600">${item.total?.toFixed(2) || '0.00'}</td>
        </tr>
    `).join('') || '<tr><td colspan="4" class="p-6 text-center text-gray-500">ไม่มีรายการสินค้า</td></tr>';

    document.getElementById('receiptTotal').textContent = order.totalAmount?.toFixed(2) || '0.00';

    const statusColor = getStatusColor(order.status || 'รอดำเนินการ');
    const statusIcon = getStatusIcon(order.status || 'รอดำเนินการ');
    const receiptStatus = document.getElementById('receiptStatus');
    receiptStatus.className = `status-badge ${statusColor}`;
    receiptStatus.innerHTML = `<span class="text-base">${statusIcon}</span> สถานะ: ${order.status || 'รอดำเนินการ'}`;
}

window.openPrintableReceipt = function() {
    const receiptContent = document.getElementById("receiptContent");
    if (!receiptContent) return;

    const win = window.open('', '_blank');
    win.document.write(`
    <html>
    <head>
      <title>ใบเสร็จร้านแม่ดอนโอทอป</title>
      <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;600;800&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="styles.css">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: 'Kanit', sans-serif; }
        #receiptContent { max-width: 700px; margin: auto; padding: 20px; background: white; }
        @page { size: A4; margin: 20mm; }
        @media print { .no-print { display: none !important; } .receipt-watermark { opacity: 0.04 !important; } }
      </style>
    </head>
    <body onload="window.print();">
      ${receiptContent.outerHTML}
    </body>
    </html>
    `);
    win.document.close();
}

window.downloadReceiptAsImage = async function() {
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

// --- Admin Page Logic ---
window.listenForOrders = function() {
    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        const orders = snapshot.val();
        renderOrders(orders);
    });
}

window.renderOrders = function(orders) {
    const orderListDiv = document.getElementById('orderList');
    if (!orderListDiv) return;

    if (!orders) {
        orderListDiv.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <div class="text-6xl mb-4 animate-bounce-slow">📦</div>
                <p class="text-xl font-semibold">ไม่มีออร์เดอร์ในระบบ</p>
                <p class="text-sm mt-2">ออร์เดอร์ที่ลูกค้าสั่งจะแสดงที่นี่</p>
            </div>
        `;
        return;
    }

    let orderHTML = '';
    const sortedOrders = Object.entries(orders).sort(([, a], [, b]) => new Date(b.orderDate) - new Date(a.orderDate));

    sortedOrders.forEach(([orderId, order]) => {
        const statusColor = getStatusColor(order.status);
        const statusIcon = getStatusIcon(order.status);
        const orderDate = new Date(order.orderDate).toLocaleString('th-TH');
        
        orderHTML += `
            <div class="order-card flex flex-col md:flex-row justify-between items-start md:items-center">
                <div class="flex-1 mb-4 md:mb-0">
                    <div class="flex items-center gap-3 mb-1">
                        <span class="text-xl font-bold text-yellow-600">#${orderId.substring(0, 8)}...</span>
                        <div class="status-badge ${statusColor}">
                            <span class="text-sm">${statusIcon}</span>
                            <span>${order.status}</span>
                        </div>
                    </div>
                    <p class="text-lg font-medium text-gray-800">ผู้สั่ง: ${order.customer?.name || 'ไม่ระบุ'}</p>
                    <p class="text-sm text-gray-500 mt-1">สั่งเมื่อ: ${orderDate}</p>
                </div>
                <div class="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <button onclick="showOrderDetail('${orderId}')" class="btn-secondary w-full md:w-auto">
                        <span class="text-lg">👁️</span> ดูรายละเอียด
                    </button>
                    <button onclick="copyOrderDetails('${orderId}')" class="btn-primary w-full md:w-auto">
                        <span class="text-lg">📋</span> คัดลอก
                    </button>
                </div>
            </div>
        `;
    });

    orderListDiv.innerHTML = orderHTML;
}

window.showOrderDetail = function(orderId) {
    const ordersRef = ref(database, `orders/${orderId}`);
    onValue(ordersRef, (snapshot) => {
        const order = snapshot.val();
        if (order) {
            currentOrderToUpdate = { id: orderId, ...order };
            document.getElementById('orderIdDisplay').textContent = `#${orderId.substring(0, 8)}`;
            document.getElementById('modalCustomerName').textContent = order.customer?.name || 'ไม่ระบุชื่อ';
            document.getElementById('modalCustomerPhone').textContent = order.customer?.phone || 'ไม่ระบุเบอร์';
            document.getElementById('modalCustomerAddress').textContent = order.customer?.address || 'ไม่ระบุที่อยู่';
            document.getElementById('modalTotalAmount').textContent = order.totalAmount?.toFixed(2) || '0.00';

            const modalOrderItems = document.getElementById('modalOrderItems');
            modalOrderItems.innerHTML = order.items?.map(item => `
                <tr class="border-b border-gray-200">
                    <td class="p-3 text-sm">${item.name} (${item.size || '-'})</td>
                    <td class="p-3 text-sm text-center">${item.qty}</td>
                    <td class="p-3 text-sm text-right">${(item.qty * item.price).toFixed(2)}</td>
                </tr>
            `).join('') || '<tr><td colspan="3" class="p-4 text-center text-gray-500">ไม่มีรายการสินค้า</td></tr>';
            
            document.getElementById('orderStatusSelect').value = order.status;

            document.getElementById('orderDetailModal').classList.remove('hidden');
            document.getElementById('orderDetailModal').classList.add('flex');
        }
    }, { onlyOnce: true });
}

window.updateOrderStatus = async function() {
    if (!currentOrderToUpdate) return;
    const newStatus = document.getElementById('orderStatusSelect').value;
    const orderId = currentOrderToUpdate.id;

    const updates = {};
    updates[`/orders/${orderId}/status`] = newStatus;

    try {
        await update(ref(database), updates);
        showStatus('อัปเดตสถานะสำเร็จ!', 'success');
        closeModal();
    } catch (error) {
        console.error("Error updating order status:", error);
        showStatus('เกิดข้อผิดพลาดในการอัปเดตสถานะ', 'error');
    }
}

window.copyOrderDetails = function(orderId) {
    const ordersRef = ref(database, `orders/${orderId}`);
    onValue(ordersRef, (snapshot) => {
        const order = snapshot.val();
        if (order) {
            let textToCopy = `📋 รายละเอียดออร์เดอร์ #${orderId.substring(0, 8)}\n`;
            textToCopy += `-------------------------------\n`;
            textToCopy += `👤 ชื่อลูกค้า: ${order.customer?.name || '-'}\n`;
            textToCopy += `📞 เบอร์โทร: ${order.customer?.phone || '-'}\n`;
            textToCopy += `🏠 ที่อยู่: ${order.customer?.address || '-'}\n\n`;
            textToCopy += `รายการสินค้า:\n`;
            order.items.forEach(item => {
                textToCopy += ` - ${item.name} (${item.size || '-'}): ${item.qty} ชิ้น x ${item.price.toFixed(2)} บาท = ${(item.qty * item.price).toFixed(2)} บาท\n`;
            });
            textToCopy += `\n💰 ยอดรวม: ${order.totalAmount.toFixed(2)} บาท\n`;
            textToCopy += `🗓️ สถานะ: ${order.status}\n`;

            navigator.clipboard.writeText(textToCopy).then(() => {
                showStatus('คัดลอกรายละเอียดออร์เดอร์แล้ว!', 'success');
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                showStatus('ไม่สามารถคัดลอกได้', 'error');
            });
        }
    }, { onlyOnce: true });
}
