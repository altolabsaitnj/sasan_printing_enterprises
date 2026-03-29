# POS System — SQL Server Edition

Full-stack Point of Sale web application.

**Stack:** React 18 + TypeScript + Bootstrap 5 | Node.js + Express | Microsoft SQL Server

## Quick Start

### 1. Database
Run `database/schema.sql` in SSMS, then update `server/.env` with your credentials.

### 2. Backend
```bash
cd server
npm install
npm run seed     # creates tables + sample data
npm run dev      # starts on http://localhost:5001
```

### 3. Frontend
```bash
cd client
npm install
npm run dev      # starts on http://localhost:3001
```

## Login
| Role    | Username  | Password    |
|---------|-----------|-------------|
| Admin   | admin     | admin123    |
| Cashier | cashier   | cashier123  |

## Features
- POS billing screen with barcode scan, cart, GST, discount, Cash/Card/UPI
- Products, Categories, Orders, Customers, Reports, Users, Settings
- Printable thermal receipt
- Dark / Light mode
- Keyboard shortcuts: F2 (barcode), F10 (checkout), Esc (clear cart)
