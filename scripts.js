// scripts.js

import { db, collection, getDocs, query, where, orderBy, onSnapshot, updateDoc, doc, getDoc } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    // ... โค้ดเดิมในส่วนนี้ (ที่เกี่ยวกับ loginModal) ...

    if (document.getElementById('adminDashboard')) {
        if (localStorage.getItem('isLoggedIn') === 'true') {
            document.getElementById('loginModal').classList.add('hidden');
            document.getElementById('adminDashboard').classList.remove('hidden');
            loadOrders();
            setupRealtimeOrdersListener();
        } else {
            document.getElementById('loginModal').classList.remove('hidden');
            document.getElementById('adminDashboard').classList.add('hidden');
        }
    }
});

const ordersCollection = collection(db, "orders");
let allOrdersData = [];

async function setupRealtimeOrdersListener() {
    const q = query(ordersCollection, orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        allOrdersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderOrders(allOrdersData);
        updateDashboardStats(allOrdersData);
    });
}

function renderOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    const emptyState = document.getElementById('emptyOrdersState');
    const displayedCount = document.getElementById('displayedOrdersCount');
    
    ordersList.innerHTML = '';

    if (orders.length === 0) {
        emptyState.classList.remove('hidden');
        displayedCount.textContent = '0';
        return;
    }
    
    emptyState.classList.add('hidden');
    displayedCount.textContent = orders.length;

    orders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'premium-card p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 card-hover neon-glow';
        
        const statusColors = {
            'รอดำเนินการ': 'bg-red-500',
            'กำลังจัดส่ง': 'bg-yellow-500',
            'จัดส่งแล้ว': 'bg-green-500',
            'ยกเลิก': 'bg-gray-500',
        };
        
        const statusIcon = {
            'รอดำเนินการ': '⏳',
            'กำลังจัดส่ง': '🚚',
            'จัดส่งแล้ว': '✅',
            'ยกเลิก': '❌',
        };
        
        const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        orderElement.innerHTML = `
            <div class="flex-1 space-y-2">
                <div class="flex items-center gap-3">
                    <span class="status-badge ${statusColors[order.status]} text-white">
                        ${statusIcon[order.status]} ${order.status}
                    </span>
                    <p class="text-sm text-gray-500 font-medium">
                        #${order.id.substring(0, 8)}
                    </p>
                </div>
                <h3 class="text-xl font-bold text-gray-800">${order.customerName}</h3>
                <p class="text-gray-600 font-medium">${order.customerPhone}</p>
                <p class="text-gray-500 text-sm italic">${order.timestamp ? new Date(order.timestamp.toDate()).toLocaleString('th-TH') : '-'}</p>
            </div>
            
            <div class="flex-1 w-full md:w-auto space-y-2 text-left md:text-right">
                <p class="text-2xl font-black text-honey-600">${total.toLocaleString()} บาท</p>
                <div class="flex flex-col md:flex-row gap-2 mt-2">
                    <button onclick="viewReceipt('${order.id}')" class="btn-secondary w-full md:w-auto font-bold px-4 py-2 rounded-xl text-sm">
                        <span class="text-base mr-1">👁️</span> ดูรายละเอียด
                    </button>
                    <div class="relative group">
                        <button class="btn-primary w-full md:w-auto font-bold px-4 py-2 rounded-xl text-sm">
                            <span class="text-base mr-1">⚙️</span> จัดการ
                        </button>
                        <div class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg z-10 hidden group-hover:block">
                            <a href="#" onclick="updateOrderStatus('${order.id}', 'รอดำเนินการ')" class="block px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-t-xl">⏳ รอดำเนินการ</a>
                            <a href="#" onclick="updateOrderStatus('${order.id}', 'กำลังจัดส่ง')" class="block px-4 py-2 text-gray-800 hover:bg-gray-100">🚚 กำลังจัดส่ง</a>
                            <a href="#" onclick="updateOrderStatus('${order.id}', 'จัดส่งแล้ว')" class="block px-4 py-2 text-gray-800 hover:bg-gray-100">✅ จัดส่งแล้ว</a>
                            <a href="#" onclick="updateOrderStatus('${order.id}', 'ยกเลิก')" class="block px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-b-xl">❌ ยกเลิก</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        ordersList.appendChild(orderElement);
    });
}

function updateDashboardStats(orders) {
    const totalRevenue = orders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0), 0);
    const totalOrders = orders.length;
    
    const today = new Date();
    const todayOrders = orders.filter(order => {
        const orderDate = order.timestamp ? order.timestamp.toDate() : new Date();
        return orderDate.getDate() === today.getDate() &&
               orderDate.getMonth() === today.getMonth() &&
               orderDate.getFullYear() === today.getFullYear();
    }).length;
    
    const pendingOrders = orders.filter(order => order.status === 'รอดำเนินการ').length;

    document.getElementById('totalRevenue').textContent = `${totalRevenue.toLocaleString()} บาท`;
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('todayOrders').textContent = todayOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('th-TH');
}

async function searchAdminOrders() {
    const searchInput = document.getElementById('adminSearchInput').value.toLowerCase();
    const phoneInput = document.getElementById('adminPhoneInput').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filtered = allOrdersData;
    
    if (searchInput) {
        filtered = filtered.filter(order => order.customerName.toLowerCase().includes(searchInput));
    }
    
    if (phoneInput) {
        filtered = filtered.filter(order => order.customerPhone.includes(phoneInput));
    }
    
    if (statusFilter) {
        filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    renderOrders(filtered);
}

// Global functions for HTML
window.refreshOrders = searchAdminOrders;
window.searchAdminOrders = searchAdminOrders;
window.filterOrders = searchAdminOrders;
window.updateOrderStatus = async (id, status) => {
    try {
        const orderRef = doc(db, "orders", id);
        await updateDoc(orderRef, { status: status });
        alert(`อัปเดตสถานะออร์เดอร์ #${id.substring(0, 8)} เป็น "${status}" เรียบร้อย`);
        // The onSnapshot listener will automatically re-render the list
    } catch (e) {
        console.error("Error updating document: ", e);
        alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
};

window.viewReceipt = async (id) => {
    try {
        const orderRef = doc(db, "orders", id);
        const orderSnap = await getDoc(orderRef);
        
        if (orderSnap.exists()) {
            const order = orderSnap.data();
            document.getElementById('receiptCustomerName').textContent = order.customerName;
            document.getElementById('receiptCustomerPhone').textContent = order.customerPhone;
            document.getElementById('receiptCustomerAddress').textContent = order.customerAddress;
            document.getElementById('receiptDate').textContent = order.timestamp ? new Date(order.timestamp.toDate()).toLocaleDateString('th-TH', { dateStyle: 'long' }) : '-';
            
            const receiptItems = document.getElementById('receiptItems');
            receiptItems.innerHTML = '';
            let total = 0;
            order.items.forEach(item => {
                const itemRow = document.createElement('tr');
                itemRow.className = 'border-b last:border-b-0 border-gray-100 text-gray-700';
                const itemTotal = item.price * item.quantity;
                total += itemTotal;
                itemRow.innerHTML = `
                    <td class="p-3 text-sm font-medium">${item.name}</td>
                    <td class="p-3 text-sm text-center">${item.quantity}</td>
                    <td class="p-3 text-sm text-center">${item.price.toLocaleString()}</td>
                    <td class="p-3 text-sm font-semibold text-right">${itemTotal.toLocaleString()}</td>
                `;
                receiptItems.appendChild(itemRow);
            });
            
            document.getElementById('receiptTotal').textContent = total.toLocaleString();
            
            const statusBadge = document.getElementById('receiptStatus');
            statusBadge.innerHTML = `<span class="text-base mr-1">📦</span>สถานะ: ${order.status}`;
            
            const statusColors = {
                'รอดำเนินการ': 'from-blue-100 to-indigo-100 text-blue-800 border-blue-200',
                'กำลังจัดส่ง': 'from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200',
                'จัดส่งแล้ว': 'from-green-100 to-emerald-100 text-green-800 border-green-200',
                'ยกเลิก': 'from-gray-100 to-gray-200 text-gray-800 border-gray-300',
            };
            statusBadge.className = `status-badge bg-gradient-to-r border ${statusColors[order.status]}`;
            
            document.getElementById('adminDashboard').classList.add('hidden');
            document.getElementById('receiptView').classList.remove('hidden');
        } else {
            console.log("No such document!");
        }
    } catch (e) {
        console.error("Error fetching document: ", e);
    }
};

window.downloadReceiptAsImage = async () => {
    const receiptContent = document.getElementById('receiptContent');
    const options = {
        useCORS: true,
        scale: 2,
        scrollX: 0,
        scrollY: 0,
        windowWidth: receiptContent.scrollWidth,
        windowHeight: receiptContent.scrollHeight
    };
    const canvas = await html2canvas(receiptContent, options);
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'ใบเสร็จ-ร้านแม่ดอนโอทอป.png';
    link.click();
};

window.openPrintableReceipt = () => {
    const printContent = document.getElementById('receiptContent').innerHTML;
    const printWindow = window.open('', '', 'height=800,width=600');
    printWindow.document.write('<html><head><title>พิมพ์ใบเสร็จ</title>');
    printWindow.document.write('<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: "Kanit", sans-serif; background: #fff; }');
    printWindow.document.write('.no-print { display: none !important; }');
    printWindow.document.write('.receipt-content { max-width: 600px; margin: 0 auto; padding: 20px; box-shadow: none; }');
    printWindow.document.write('</style>');
    printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('<script>window.onload = function() { window.print(); window.close(); }</script>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
};

function handlePasswordKeyPress(event) {
    if (event.key === 'Enter') {
        login();
    }
}

function handleAdminSearchKeyPress(event) {
    if (event.key === 'Enter') {
        searchAdminOrders();
    }
}

window.login = login;
window.logout = logout;
window.handlePasswordKeyPress = handlePasswordKeyPress;
window.handleAdminSearchKeyPress = handleAdminSearchKeyPress;
