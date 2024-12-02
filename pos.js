const orderItems = [];
let id = 1;
// Add item to the order
function addItem(item, price) {
    orderItems.push({ item, price });
    renderOrder();
}

// Render the order summary
function renderOrder() {
    const orderList = document.getElementById('orderItems');
    const totalPrice = document.getElementById('actualtotal');
    let total = 0;

    orderList.innerHTML = orderItems.map((order, index) => {
    total += order.price;
    return `
        <li>
        ${order.item} - $${order.price.toFixed(2)}
        <button onclick="removeItem(${index})">Remove</button>
        </li>
    `;
    }).join('');

    totalPrice.innerHTML = `${total.toFixed(2)}`;
}

// Remove item from the order
function removeItem(index) {
    orderItems.splice(index, 1);
    renderOrder();
}

// Place order
async function placeOrder() {
    const tableNumber = document.getElementById('tableNumber').value;
    const totalPrice = parseFloat(document.getElementById('actualtotal').textContent);
    if (!tableNumber || orderItems.length === 0) {
        alert('Please enter a table number and select at least one item.');
        return;
    }

    const items = {};
    for (const item of orderItems) {
        if (typeof items[item.item] === "undefined") {
            items[item.item] = 1;
        } else {
            items[item.item]++;
        }
    }

    console.log(items);
    const currDate = new Date();

    console.log(totalPrice);
    const res = await fetch('https://backend-production-99e2.up.railway.app/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, currDate, totalPrice, tableNumber, items })
    });

    if (res.ok) {
        alert('Order placed successfully!');
        document.getElementById('tableNumber').value = '';
        orderItems.length = 0;
        id++;
        renderOrder();
    } else {
        alert('Error placing order');
    }
}