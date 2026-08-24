const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'intranet-db.cspiueqwiu56.us-east-1.rds.amazonaws.com', 
    user: 'admin',                               
    password: 'senhaextremamentefortedodb',               
    database: 'intranet_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = db;