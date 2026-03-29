-- POS_DB SQL Server Schema
-- Run in SSMS or sqlcmd before starting the server

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'POS_DB')
    CREATE DATABASE POS_DB;
GO
USE POS_DB;
GO

-- USERS
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
CREATE TABLE Users (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(20)  NOT NULL DEFAULT 'cashier' CHECK (role IN ('admin','cashier')),
    name       VARCHAR(100),
    isActive   BIT          NOT NULL DEFAULT 1,
    created_at DATETIME     DEFAULT GETDATE()
);
GO

-- CATEGORIES
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Categories' AND xtype='U')
CREATE TABLE Categories (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  DATETIME DEFAULT GETDATE()
);
GO

-- PRODUCTS
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Products' AND xtype='U')
CREATE TABLE Products (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    barcode       VARCHAR(100)  UNIQUE,
    category      VARCHAR(50),
    price         DECIMAL(10,2) NOT NULL,
    cost_price    DECIMAL(10,2) DEFAULT 0,
    stock         INT           NOT NULL DEFAULT 0,
    low_stock_alert INT         DEFAULT 10,
    image         VARCHAR(500),
    is_active     BIT           DEFAULT 1,
    created_at    DATETIME      DEFAULT GETDATE()
);
GO

-- CUSTOMERS
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Customers' AND xtype='U')
CREATE TABLE Customers (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    phone      VARCHAR(20),
    email      VARCHAR(100),
    address    VARCHAR(500),
    total_purchases DECIMAL(10,2) DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- ORDERS
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Orders' AND xtype='U')
CREATE TABLE Orders (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    order_number   VARCHAR(50) UNIQUE,
    customer_id    INT REFERENCES Customers(id),
    user_id        INT REFERENCES Users(id),
    subtotal       DECIMAL(10,2) DEFAULT 0,
    discount       DECIMAL(10,2) DEFAULT 0,
    tax            DECIMAL(10,2) DEFAULT 0,
    total          DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20)   DEFAULT 'cash' CHECK (payment_method IN ('cash','card','upi')),
    status         VARCHAR(20)   DEFAULT 'completed' CHECK (status IN ('completed','refunded','pending')),
    notes          VARCHAR(MAX),
    created_at     DATETIME      DEFAULT GETDATE()
);
GO

-- ORDER ITEMS
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Order_Items' AND xtype='U')
CREATE TABLE Order_Items (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    order_id     INT NOT NULL REFERENCES Orders(id) ON DELETE CASCADE,
    product_id   INT NOT NULL REFERENCES Products(id),
    product_name VARCHAR(100),
    quantity     INT           NOT NULL,
    price        DECIMAL(10,2) NOT NULL,
    total        DECIMAL(10,2) NOT NULL
);
GO

-- PAYMENTS
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Payments' AND xtype='U')
CREATE TABLE Payments (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    order_id    INT NOT NULL REFERENCES Orders(id),
    amount_paid DECIMAL(10,2) NOT NULL,
    balance     DECIMAL(10,2) DEFAULT 0,
    method      VARCHAR(20)   DEFAULT 'cash',
    created_at  DATETIME      DEFAULT GETDATE()
);
GO

-- SETTINGS
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Settings' AND xtype='U')
CREATE TABLE Settings (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    [key]      VARCHAR(100) NOT NULL UNIQUE,
    value      VARCHAR(MAX),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

PRINT 'Schema created. Now run: npm run seed';
GO
