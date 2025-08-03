// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, push, set, get, child } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // <--- กรุณาใส่ API KEY ของคุณที่นี่
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Global state variables
let items = [];
let currentReceiptOrder = null;

// --- DOM elements and event listeners ---
document.addEventListener('DOMContentLoaded', () => {
    updateCartDisplay();
    document.getElementById('productForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addItem();
    });
});

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

// --- Cart and Order Logic ---

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

    // Fill form with item data
    document.getElementById('productName').value = item.name;
    document.getElementById('productWeight').value = item.size === '-' ? '' : item.size;
    document.getElementById('productQty').value = item.qty;
    document.getElementById('productPrice').value = item.price === 0 ? '' : item.price;

    // Clear dropdowns
    document.getElementById('productNameSelect').value = '';
    document.getElementById('productWeightSelect').value = '';

    // Remove item from cart
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

    cartCount.textContent = items.length;

    if (items.length === 0) {
        cartItemsDiv.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <div class="text-6xl mb-4 animate-bounce-slow">🍌</div>
                <p class="text-xl font-semibold">ตะกร้าว่างเปล่า</p>
                <p class="text-sm mt-2">เพิ่มกล้วยและสินค้าอื่นๆ เพื่อเริ่มสั่งซื้อ</p>
            </div>
        `;
        cartSummary.classList.add('hidden');
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
    cartSummary.classList.remove('hidden');
}

function clearForm() {
    document.getElementById('productName').value = '';
    document.getElementById('productNameSelect').value = '';
    document.getElementById('productWeight').value = '';
    document.getElementById('productWeightSelect').value = '';
    document.getElementById('productQty').value = '1';
    document.getElementById('productPrice').value = '';
}

window.showStatus = function(message, type) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.className = type === 'success' ? 'status-success' : 'status-error';
    statusDiv.innerHTML = `<span class="text-xl">${type === 'success' ? '✅' : '❌'}</span><span>${message}</span>`;
    statusDiv.classList.remove('hidden');
    
    setTimeout(() => {
        statusDiv.classList.add('hidden');
    }, 3000);
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
        showStatus("บันทึกออร์เดอร์สำเร็จ", "success");
        
        // Show receipt view
        showReceiptView({ id: newOrderRef.key, ...orderData });

        // Reset form
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
          <td class="p-3 text-sm font-medium">${item.name}${item.size ? ` (${item.size})` : ''}</td>
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

window.getStatusColor = function(status) {
  switch(status) {
    case 'รอดำเนินการ': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'กำลังจัดส่ง': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'จัดส่งแล้ว': return 'bg-green-100 text-green-800 border-green-200';
    case 'ยกเลิก': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
