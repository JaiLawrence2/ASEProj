const socket = io('https://backend-production-99e2.up.railway.app');
let ticketsContainer;
document.addEventListener('DOMContentLoaded', () => {
  ticketsContainer = document.getElementById('tickets');
  fetchOrders();
});

// Fetch and render orders
async function fetchOrders() {
  const res = await fetch('https://backend-production-99e2.up.railway.app/orders');
  const orders = await res.json();
  renderOrders(orders.recordset);
}

// Render orders
function renderOrders(orders) {
  ticketsContainer.innerHTML = '';
  orders.forEach(order => createOrderTicket(order));
}

// Create order ticket
async function createOrderTicket(order) {
  const ticket = document.createElement('div');
  const orderNumber = order.ORDER_ID;
  ticket.setAttribute("id", orderNumber);
  const res = await fetch(`https://backend-production-99e2.up.railway.app/orders/${orderNumber}`);
  const items = await res.json();
  let itemsMarkup = ``;
  
  for (const item of items.recordset) {
    const res = await fetch(`https://backend-production-99e2.up.railway.app/item/${item.PROD_ID}`)
    const itemInfo = await res.json();
    itemsMarkup += `<li>${itemInfo.recordset[0].PROD_DESCR} x ${item.QTY}</li>`;
  }

  ticket.classList.add('ticket');
  ticket.innerHTML = `
    <h2>Table ${order.TABLE_ID}</h2>
    <p><strong>Order ID:</strong> ${orderNumber}</p>
    <ul>${itemsMarkup}</ul>
    <p><strong>Time:</strong> ${new Date(order.ORDER_DATE_TIME).toLocaleTimeString()}</p>
    <button onclick="updateOrderStatus('${orderNumber}', 'In-Progress')">Mark as In-Progress</button>
    <button onclick="updateOrderStatus('${orderNumber}', 'Ready')">Order Ready</button>
  `;
  ticketsContainer.appendChild(ticket);
}

// Update order status
async function updateOrderStatus(orderId, status) {
  await fetch(`https://backend-production-99e2.up.railway.app/orders/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

// Listen for new orders
socket.on('new-order', (order) => {
  createOrderTicket(order);
});

// Listen for updates
socket.on('update-order', (order) => {
  console.log("Order updated");
  if (order.status === "Ready") {
    document.getElementById(`${order.id}`).remove();
  }
});
