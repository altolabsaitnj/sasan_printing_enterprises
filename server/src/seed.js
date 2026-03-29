require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getPool, sql } = require('./config/db');

async function seed() {
  const pool = await getPool();

  // Users
  const adminHash = await bcrypt.hash('admin123', 10);
  const cashierHash = await bcrypt.hash('cashier123', 10);

  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM Users WHERE username='admin')
      INSERT INTO Users (username, password, role, name) VALUES ('admin', '${adminHash}', 'admin', 'Admin User');
    IF NOT EXISTS (SELECT 1 FROM Users WHERE username='cashier')
      INSERT INTO Users (username, password, role, name) VALUES ('cashier', '${cashierHash}', 'cashier', 'Cashier One');
  `);
  console.log('Users seeded');

  // Products
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM Products WHERE barcode='5000112637922')
    BEGIN
      INSERT INTO Products (name, barcode, category, price, cost_price, stock) VALUES
        ('Coca Cola 500ml',  '5000112637922', 'Beverages',   40,  28, 100),
        ('Pepsi 500ml',      '4890008100309', 'Beverages',   40,  28,  80),
        ('Mineral Water 1L', '8901058851015', 'Beverages',   20,  12, 200),
        ('Lays Classic 50g', '4890008100316', 'Snacks',      20,  14, 150),
        ('Oreo Biscuits',    '7622210449283', 'Snacks',      30,  22, 120),
        ('Milk 1L',          '8901030890014', 'Dairy',       60,  50,  50),
        ('Butter 100g',      '8901030890021', 'Dairy',       55,  42,  40),
        ('Bread Loaf',       '8901030890038', 'Bakery',      45,  32,  30),
        ('USB Cable',        '6901443078325', 'Electronics', 199,120,  25),
        ('Phone Charger',    '6901443078332', 'Electronics', 499,320,   8);
    END
  `);
  console.log('Products seeded');

  // Customers
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM Customers WHERE phone='9876543210')
      INSERT INTO Customers (name, phone, email) VALUES
        ('John Doe',  '9876543210', 'john@example.com'),
        ('Jane Smith','9123456780', 'jane@example.com');
  `);
  console.log('Customers seeded');

  // Settings
  const settings = [
    ['storeName',    'My POS Store'],
    ['storeAddress', '123 Main Street, City'],
    ['storePhone',   '+91 9876543210'],
    ['taxRate',      '18'],
    ['currency',     '₹'],
    ['receiptFooter','Thank you for shopping with us!'],
    ['theme',        'light'],
  ];
  for (const [key, value] of settings) {
    await pool.request()
      .input('k', sql.VarChar, key)
      .input('v', sql.VarChar, value)
      .query(`IF NOT EXISTS (SELECT 1 FROM Settings WHERE [key]=@k)
                INSERT INTO Settings ([key], value) VALUES (@k, @v)`);
  }
  console.log('Settings seeded');

  console.log('\nSeed complete!');
  console.log('Login: admin / admin123');
  console.log('Login: cashier / cashier123');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
