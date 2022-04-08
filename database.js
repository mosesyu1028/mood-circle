const mysql = require('mysql');
require('dotenv').config();

const dbSocketAddr = process.env.DB_HOST.split(':');

var con = mysql.createConnection({
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
    // socketPath: `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`,
    host: dbSocketAddr[0],
    port: dbSocketAddr[1]
});

con.connect((err) => {
    if (err) throw err;
    console.log(`Connected to database ${process.env.DB_DATABASE}`);
});

module.exports = con;