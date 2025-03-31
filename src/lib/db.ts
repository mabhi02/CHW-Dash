import { Pool } from 'pg';

// Create a new database pool with the connection string
const pool = new Pool({
  connectionString: process.env.DB_URL || "postgresql://neondb_owner:npg_RvG4KaDUcOp9@ep-broad-frost-a5ovvl94-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
});

// Test the connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

export default pool;