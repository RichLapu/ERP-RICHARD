const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: process.env.DB_HOST || 'intranet-db.cspiueqwiu56.us-east-1.rds.amazonaws.com', 
    user: process.env.DB_USER || 'admin',                               
    password: process.env.DB_PASSWORD || 'senhaextremamentefortedodb',               
    database: process.env.DB_NAME || 'intranet_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = db;