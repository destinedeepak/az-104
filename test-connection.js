import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

console.log('Attempting to connect to:', config.server);
console.log('Database:', config.database);
console.log('User:', config.user);

try {
  const pool = await sql.connect(config);
  console.log('✅ Successfully connected to Azure SQL Database!');
  
  const result = await pool.request().query('SELECT @@VERSION AS version');
  console.log('Database version:', result.recordset[0].version);
  
  await pool.close();
  process.exit(0);
} catch (err) {
  console.error('❌ Connection failed:', err.message);
  process.exit(1);
}
