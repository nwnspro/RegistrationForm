// Test PostgreSQL database connection
// Run with: tsx scripts/test-db-connection.ts or npm run db:test

import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'registration_db',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

async function testConnection(): Promise<void> {
  let client;

  try {
    console.log('Attempting to connect to PostgreSQL...');
    console.log(`Host: ${pool.options.host}:${pool.options.port}`);
    console.log(`Database: ${pool.options.database}`);
    console.log(`User: ${pool.options.user}`);
    console.log('');

    client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL!');
    console.log('');

    // Test query
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('Database Info:');
    console.log(`  Time: ${result.rows[0].current_time}`);
    console.log(`  Version: ${result.rows[0].pg_version.split(' ').slice(0, 2).join(' ')}`);
    console.log('');

    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      ) as table_exists;
    `);

    if (tableCheck.rows[0].table_exists) {
      console.log('✅ Users table exists');

      // Get table info
      const tableInfo = await client.query<TableColumn>(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `);

      console.log('\nTable Structure:');
      tableInfo.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });

      // Count users
      const countResult = await client.query('SELECT COUNT(*) as count FROM users');
      console.log(`\nTotal users in database: ${countResult.rows[0].count}`);

    } else {
      console.log('❌ Users table does not exist');
      console.log('   Run: psql -U postgres -d registration_db -f db/schema.sql');
    }

    console.log('\n✅ Database connection test completed successfully!');

  } catch (error) {
    console.error('❌ Database connection test failed:');
    console.error('');

    if (error instanceof Error) {
      const pgError = error as Error & { code?: string };

      if (pgError.code === 'ECONNREFUSED') {
        console.error('  Error: Connection refused');
        console.error('  Solution: Make sure PostgreSQL is running');
        console.error('    - Mac: brew services start postgresql@16');
        console.error('    - Linux: sudo service postgresql start');
        console.error('    - Check status: pg_isready');
      } else if (pgError.code === '3D000') {
        console.error('  Error: Database does not exist');
        console.error('  Solution: Create the database');
        console.error('    - Run: createdb registration_db');
        console.error('    - Or: psql -U postgres -c "CREATE DATABASE registration_db;"');
      } else if (pgError.code === '28P01') {
        console.error('  Error: Authentication failed');
        console.error('  Solution: Check your password in .env.local');
        console.error(`    - Current user: ${pool.options.user}`);
        console.error(`    - Current password: ${pool.options.password ? '***' : '(not set)'}`);
      } else {
        console.error('  Error:', error.message);
        console.error('  Code:', pgError.code);
      }
    }

    process.exit(1);

  } finally {
    if (client) client.release();
    await pool.end();
  }
}

testConnection();
