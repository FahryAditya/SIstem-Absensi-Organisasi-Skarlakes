const { Pool } = require('pg');
require('dotenv').config();

// Ignore self-signed certificates for migration
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Check environment variables
const sourceConnectionString = process.env.POSTGRES_PRISMA_URL;
const targetConnectionString = process.env.NEON_DATABASE_URL;

if (!sourceConnectionString || !targetConnectionString) {
  console.error('Missing required environment variables:');
  console.error('POSTGRES_PRISMA_URL (source/Supabase):', !!sourceConnectionString);
  console.error('NEON_DATABASE_URL (target/Neon):', !!targetConnectionString);
  process.exit(1);
}

// Create database pools
const sourcePool = new Pool({ connectionString: sourceConnectionString });
const targetPool = new Pool({ connectionString: targetConnectionString });

async function getTables(client) {
  const { rows } = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  return rows.map(row => row.table_name);
}

async function getForeignKeys(client) {
  const { rows } = await client.query(`
    SELECT
      tc.table_name AS child_table,
      ccu.table_name AS parent_table
    FROM
      information_schema.table_constraints AS tc
      JOIN information_schema.constraint_column_usage AS ccu
        ON tc.constraint_name = ccu.constraint_name
    WHERE
      tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
  `);
  return rows;
}

function topologicalSort(tables, edges) {
  const graph = {};
  const indegree = {};
  
  // Initialize
  tables.forEach(table => {
    graph[table] = [];
    indegree[table] = 0;
  });
  
  // Add edges
  edges.forEach(edge => {
    const { child_table, parent_table } = edge;
    graph[parent_table].push(child_table);
    indegree[child_table] = (indegree[child_table] || 0) + 1;
  });
  
  // Kahn's algorithm
  const queue = tables.filter(table => indegree[table] === 0);
  const sorted = [];
  
  while (queue.length) {
    const table = queue.shift();
    sorted.push(table);
    
    for (const neighbor of graph[table]) {
      indegree[neighbor]--;
      if (indegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }
  
  if (sorted.length !== tables.length) {
    throw new Error('Graph has a cycle - cannot sort tables topologically');
  }
  
  return sorted;
}

async function migrateTable(tableName, sourceClient, targetClient) {
  // Truncate target table
  await targetClient.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`);
  
  // Fetch all data from source
  const { rows } = await sourceClient.query(`SELECT * FROM "${tableName}"`);
  
  if (rows.length === 0) {
    console.log(`  ${tableName}: No data to migrate`);
    return;
  }
  
  // Get column names from first row
  const columns = Object.keys(rows[0]);
  const columnList = columns.map(col => `"${col}"`).join(', ');
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  
  // Insert data row by row
  for (const row of rows) {
    const values = columns.map(col => row[col]);
    await targetClient.query(
      `INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders})`,
      values
    );
  }
  
  console.log(`  ${tableName}: Migrated ${rows.length} rows`);
}

async function main() {
  let sourceClient = null;
  let targetClient = null;
  
  try {
    // Connect to source and target
    sourceClient = await sourcePool.connect();
    targetClient = await targetPool.connect();
    
    // Get list of tables
    const tables = await getTables(sourceClient);
    console.log(`Found ${tables.length} tables to migrate:`);
    tables.forEach(name => console.log(`  - ${name}`));
    
    // Get foreign key relationships
    const foreignKeys = await getForeignKeys(sourceClient);
    
    // Topological sort
    const sortedTables = topologicalSort(tables, foreignKeys);
    console.log('\nMigration order (topological sort):');
    sortedTables.forEach((name, index) => console.log(`  ${index + 1}. ${name}`));
    
    // Migrate each table in sorted order
    for (const tableName of sortedTables) {
      console.log(`\nMigrating table: ${tableName}`);
      await migrateTable(tableName, sourceClient, targetClient);
    }
    
    console.log('\nMigration completed successfully!');
    
    // Verification: Compare row counts
    console.log('\nVerifying row counts...');
    for (const tableName of tables) {
      const sourceCount = await sourceClient.query(`SELECT COUNT(*) FROM "${tableName}"`);
      const targetCount = await targetClient.query(`SELECT COUNT(*) FROM "${tableName}"`);
      
      const sourceRows = parseInt(sourceCount.rows[0].count);
      const targetRows = parseInt(targetCount.rows[0].count);
      
      if (sourceRows === targetRows) {
        console.log(`  ${tableName}: OK (${sourceRows} rows)`);
      } else {
        console.error(`  ${tableName}: MISMATCH (source: ${sourceRows}, target: ${targetRows})`);
      }
    }
    
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (sourceClient) sourceClient.release();
    if (targetClient) targetClient.release();
    await sourcePool.end();
    await targetPool.end();
  }
}

main();