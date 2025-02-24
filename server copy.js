const express = require('express');
const mariadb = require('mariadb');

BigInt.prototype.toJSON = function() {
    return this.toString();
};

const app = express();
app.use(express.json()); 
const port = 3000;

// Create a connection pool
const pool = mariadb.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sample',
    port: 3306,
    connectionLimit: 5
});

// API routes to fetch data from the database
app.get('/companies', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM company");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        if (conn) conn.release();
    }
});

app.get('/agents', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM agents");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        if (conn) conn.release();
    }
});

app.get('/customers', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM customer");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        if (conn) conn.release();
    }
});

// POST request to add a new agent
app.post('/agents', async (req, res) => {
    const { AGENT_CODE, AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query(
            "INSERT INTO agents (AGENT_CODE, AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY) VALUES (?, ?, ?, ?, ?, ?)",
            [AGENT_CODE, AGENT_NAME, WORKING_AREA, COMMISSION, PHONE_NO, COUNTRY]
        );
        res.status(201).json({ message: "Agent added", id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        if (conn) conn.release();
    }
});

// PATCH request to update part of a company's data
app.patch('/companies/:id', async (req, res) => {
    const { id } = req.params;
    const { company_name, company_city } = req.body; 
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query(
            "UPDATE company SET COMPANY_NAME = COALESCE(?, COMPANY_NAME), COMPANY_CITY = COALESCE(?, COMPANY_CITY) WHERE COMPANY_ID = ?", 
            [company_name, company_city, id]
        );
        res.json({ message: "Company updated", affectedRows: result.affectedRows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        if (conn) conn.release();
    }
});

// PUT request to replace a company's data
app.put('/companies/:id', async (req, res) => {
    const { id } = req.params;
    const { company_name, company_city } = req.body;  // Update with correct field names
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query(
            "UPDATE company SET COMPANY_NAME = ?, COMPANY_CITY = ? WHERE COMPANY_ID = ?", 
            [company_name, company_city, id]
        );
        res.json({ message: "Company replaced", affectedRows: result.affectedRows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        if (conn) conn.release();
    }
});

// DELETE request to remove a company
app.delete('/companies/:COMPANY_ID', async (req, res) => {
    const { COMPANY_ID } = req.params;
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query("DELETE FROM company WHERE COMPANY_ID = ?", [COMPANY_ID]);
        if (result.affectedRows > 0) {
            res.json({ message: "Company deleted", affectedRows: result.affectedRows });
        } else {
            res.status(404).json({ message: "Company was not found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        if (conn) conn.release();
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
