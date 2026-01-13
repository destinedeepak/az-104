import sql from 'mssql';
import { getConfig, isUsingKeyVault } from './keyvault.js';

let poolPromise = null;

async function initializeConnection() {
  const vaultConfig = await getConfig();
  
  const config = {
    user: vaultConfig.dbUser || 'sa',
    password: vaultConfig.dbPassword || 'YourPassword123',
    server: vaultConfig.dbServer || 'localhost',
    port: parseInt(vaultConfig.dbPort) || 1433,
    database: vaultConfig.dbName || 'ProductsDB',
    options: {
      encrypt: true,
      trustServerCertificate: true
    }
  };

  console.log(`Database configuration loaded from: ${isUsingKeyVault() ? 'Azure Key Vault' : 'local .env file'}`);

  return new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
      console.log('Connected to SQL Server');
      return pool;
    })
    .catch(err => {
      console.error('Database connection failed:', err);
      throw err;
    });
}

poolPromise = initializeConnection();

export const initializeDatabase = async () => {
  try {
    const pool = await poolPromise;
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='products' AND xtype='U')
      CREATE TABLE products (
        id INT PRIMARY KEY IDENTITY(1,1),
        name NVARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        quantity INT NOT NULL,
        description NVARCHAR(MAX)
      )
    `);
    console.log('Database initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
};

export const getAllProducts = async () => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM products');
    return result.recordset;
  } catch (err) {
    throw err;
  }
};

export const getProductById = async (id) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM products WHERE id = @id');
    return result.recordset[0];
  } catch (err) {
    throw err;
  }
};

export const createProduct = async (name, price, quantity, description) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('price', sql.Decimal(10, 2), price)
      .input('quantity', sql.Int, quantity)
      .input('description', sql.NVarChar, description)
      .query('INSERT INTO products (name, price, quantity, description) OUTPUT INSERTED.id VALUES (@name, @price, @quantity, @description)');
    return result.recordset[0].id;
  } catch (err) {
    throw err;
  }
};

export const updateProduct = async (id, name, price, quantity, description) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('price', sql.Decimal(10, 2), price)
      .input('quantity', sql.Int, quantity)
      .input('description', sql.NVarChar, description)
      .query('UPDATE products SET name = @name, price = @price, quantity = @quantity, description = @description WHERE id = @id');
    return result.rowsAffected[0];
  } catch (err) {
    throw err;
  }
};

export const deleteProduct = async (id) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM products WHERE id = @id');
    return result.rowsAffected[0];
  } catch (err) {
    throw err;
  }
};

export default poolPromise;
