'use strict';

const path = require('path');
const oracledb = require('oracledb');


oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
function initOracleThickClient() {
    const envDir = process.env.ORACLE_CLIENT_DIR;
    const libDir = envDir && envDir.trim().length > 0
        ? envDir
        : path.resolve(__dirname, 'instantclient_23_9');
    try {
        oracledb.initOracleClient({ libDir });
        console.log(`[DB] Oracle Client initialized (Thick mode) from: ${libDir}`);
    } catch (err) {
        console.error('[DB] initOracleClient failed:', err.message);
        throw err;
    }
}

// Try to init thick client, but don't crash the server if unavailable
try {
    initOracleThickClient();
} catch (e) {
    console.warn('[DB] Thick client not available, proceeding without Oracle Instant Client. Some DB features may not work.');
}

let poolPromise;

function getConnectString() {
    const host = process.env.ORACLE_HOST;
    const port = process.env.ORACLE_PORT || '1521';
    const service = process.env.ORACLE_SERVICE;
    if (!host || !service) {
        throw new Error('Missing ORACLE_HOST or ORACLE_SERVICE in environment');
    }
    return `${host}:${port}/${service}`;
}

async function initPool() {
    if (!poolPromise) {
        poolPromise = oracledb.createPool({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: getConnectString(),
            poolMin: 0,
            poolMax: 4,
            poolIncrement: 1,
            queueTimeout: 60000,
        }).then((pool) => {
            console.log('[DB] Connection pool created');
            return pool;
        }).catch((err) => {
            console.error('[DB] Failed to create connection pool:', err.message);
            // Defer DB availability errors so the server can still run for non-DB endpoints
            // Re-throw to callers when they actually execute queries
            throw err;
        });
    }
    return poolPromise;
}

async function getConnection() {
    try {
        const pool = await initPool();
        return pool.getConnection();
    } catch (e) {
        // Provide a clearer error when DB is not available
        const err = new Error('Database is not available: ' + e.message);
        err.cause = e;
        throw err;
    }
}

async function execute(sql, binds = [], options = {}) {
    let conn;
    try {
        conn = await getConnection();
        const result = await conn.execute(sql, binds, options);
        await conn.commit();
        return result;
    } finally {
        try { if (conn) await conn.close(); } catch { }
    }
}

async function closePool() {
    if (poolPromise) {
        try {
            const pool = await poolPromise;
            await pool.close(10);
            console.log('[DB] Connection pool closed');
        } catch (e) {
            console.error('[DB] Error closing pool:', e.message);
        } finally {
            poolPromise = undefined;
        }
    }
}

module.exports = {
    initPool,
    execute,
    closePool,
};
