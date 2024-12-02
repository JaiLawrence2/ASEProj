// express sets up the server, mssql is SQL Server's driver code, and cors gets around any cross-origin issues
const express = require("express");
const sql = require("mssql");
const cors = require("cors");

// http and io set up the real-time communication capabilities
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
      origin: "*", // Allow all origins (use specific origins for production)
      methods: ["GET", "POST"], // Allowed HTTP methods
  },
});

app.use(express.json());
app.use(cors());

const config = {
  user: 'admin',
  password: 'eILiLsF6i9ykSzXHw2rr',
  server: 'cs521db.cnb3t0p73zso.us-east-1.rds.amazonaws.com',
  database: 'CS521',
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

sql.connect(config).then(conn => {
  conn.request().query('DELETE FROM ORDERS DELETE FROM ORDER_DETAILS');
});

app.get("/orders", async (req, res) => { // get orders
  try {
    const conn = await sql.connect(config);
    const result = await conn.request().query('SELECT * FROM ORDERS');
    res.json(result);
    await conn.close();
  } catch (error) {
    console.error(error);
    res.status(500).send("Error connecting to database");
  }
});

app.get("/orders/:id", async (req, res) => { // get order details
  try {
    const orderId = req.params.id;
    const conn = await sql.connect(config);
    const result = await conn.request()
      .input('param1', sql.Int, orderId)
      .query('SELECT * FROM ORDER_DETAILS WHERE ORDER_ID = @param1');
    res.json(result);
    await conn.close();
  } catch (error) {
    console.error(error);
    res.status(500).send("Error connecting to database");
  }
});

app.get("/item/:id", async (req, res) => {
  try {
    const itemId = req.params.id;
    const conn = await sql.connect(config);
    const result = await conn.request()
      .input('param1', sql.Int, itemId)
      .query('SELECT * FROM PRODUCTS WHERE PROD_ID = @param1')
    res.json(result);
    await conn.close();
  } catch (error) {
    console.error(error);
    res.status(500).send("Error connecting to database");
  }
});

app.post("/orders", async (req, res) => {
  const conn = await sql.connect(config);
  try {
    const orderNumber = req.body.id;
    const datetime = req.body.currDate;
    const price = req.body.totalPrice;
    const tableNumber = req.body.tableNumber;
    const items = req.body.items;
    
    const itemKeys = Object.keys(items); // Get keys of the items object because that's what has the item names

    // validate items
    for (const item of itemKeys) {
      const test = await conn.request()
        .input('param1', sql.VarChar, item)
        .query('SELECT * FROM PRODUCTS WHERE PROD_DESCR = @param1');

      if (test.rowsAffected[0] === 0) {
        // Invalid item detected
        res.status(400).send(`Invalid item: ${item}`);
        await conn.close(); 
        return;
      }
    }

    // insert into ORDERS first to maintain integrity and provide what's being inserted to frontend
    const orderResult = {"ORDER_ID": orderNumber, "ORDER_DATE_TIME": datetime, "TOTAL_PRICE": price, "TABLE_ID": tableNumber};
    await conn.request()
      .input('param1', sql.Int, orderNumber)
      .input('param2', sql.DateTime, datetime)
      .input('param3', sql.Money, price)
      .input('param4', sql.Int, tableNumber)
      .input('param5', sql.VarChar, 'Submitted')
      .query('INSERT INTO ORDERS (ORDER_ID, ORDER_DATE_TIME, TOTAL_PRICE, TABLE_ID, ORDER_STATUS) VALUES (@param1, @param2, @param3, @param4, @param5)');

    // insert each of the order details
    let itemDetails = {};
    for (const item of itemKeys) {
      const test = await conn.request()
        .input('param1', sql.VarChar, item)
        .query('SELECT * FROM PRODUCTS WHERE PROD_DESCR = @param1');

      const detail_id = (orderNumber * 100) + Object.keys(itemDetails).length;
      const prod_id = test.recordset[0].PROD_ID;
      const qty = items[item];
      const price = test.recordset[0].PRICE;

      await conn.request()
        .input('param1', sql.Int, detail_id)
        .input('param2', sql.Int, prod_id)
        .input('param3', sql.Int, orderNumber)
        .input('param4', sql.Int, qty)
        .input('param5', sql.Money, price)
        .query('INSERT INTO ORDER_DETAILS (ORDER_DETAIL_ID, PROD_ID, ORDER_ID, QTY, SELLING_PRICE) VALUES (@param1, @param2, @param3, @param4, @param5)');
      itemDetails[item] = {"detail_id": detail_id, "prod_id": prod_id, "orderNumber": orderNumber, "qty": qty, "price": price};
    }
    io.emit('new-order', orderResult);
    res.status(201).json({orderResult, itemDetails});
  } catch (error) {
    console.error(error);
    res.status(500).send("Error connecting to database");
  } finally {
    await conn.close();
  }
});

app.put('/orders/:id', async (req, res) => { // edit order
  const orderId = req.params.id;
  const { status } = req.body;
  const conn = await sql.connect(config);

  const currentOrder = await conn.request()
    .input('param1', sql.Int, orderId)
    .query('SELECT * FROM ORDERS WHERE ORDER_ID = @param1');
  if (!currentOrder) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const updatedOrder = await conn.request()
    .input('param1', sql.Int, orderId)
    .input('param2', sql.VarChar, status)
    .query('UPDATE ORDERS SET ORDER_STATUS = @param2 WHERE ORDER_ID = @param1');

  io.emit('update-order', { id: orderId, status: status }); // Notify KDS of the status update
  res.json(updatedOrder);
});

io.on('connection', (socket) => {
  console.log('A client connected to the KDS.');
  socket.on('disconnect', () => {
    console.log('A client disconnected.');
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});