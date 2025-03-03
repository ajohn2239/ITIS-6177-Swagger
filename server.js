const express = require('express');
const mariadb = require('mariadb');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const axios = require('axios');

BigInt.prototype.toJSON = function() {
    return this.toString();
};

const app = express();
app.use(express.json()); 
const port = 3000;

// AWS API Gateway
const LAMBDA_API_URL = 'https://l0gcat0mbb.execute-api.us-east-2.amazonaws.com/dev/say';

// Create a connection pool
const pool = mariadb.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sample',
    port: 3306,
    connectionLimit: 5
});

// API route for request to Lambda
app.get('/say', async (req, res) => {
    const keyword = req.query.keyword;
    
    if (!keyword) {
        return res.status(400).json({ message: "Missing 'keyword' query parameter" });
    }

    try {
        // Forward request to AWS Lambda API Gateway
        const lambdaResponse = await axios.get(`${LAMBDA_API_URL}?keyword=${keyword}`);
        res.json(lambdaResponse.data);
    } catch (error) {
        console.error('Error forwarding request to Lambda:', error);
        res.status(500).json({ message: 'Error processing request' });
    }
});

// Swagger setup
const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: 'Sample',
            version: '1.0.0',
            description: 'API Documentation for ITIS 6177 Project',
        },
        servers: [
            {
                url: 'http://104.248.123.37',
            },
        ],
    },
    apis: ['./server.js'], 
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// API routes to fetch data from the database
/**
 * @swagger
 * /companies:
 *   get:
 *     description: Get all companies
 *     responses:
 *       200:
 *         description: List of companies
 */
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

/**
 * @swagger
 * /agents:
 *   get:
 *     description: Get all agents
 *     responses:
 *       200:
 *         description: List of agents
 */
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

/**
 * @swagger
 * /customers:
 *   get:
 *     description: Get all customers
 *     responses:
 *       200:
 *         description: List of customers
 */
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
/**
 * @swagger
 * /agents:
 *   post:
 *     description: Add a new agent
 *     parameters:
 *       - in: body
 *         name: agent
 *         description: The agent to add
 *         schema:
 *           type: object
 *           required:
 *             - AGENT_CODE
 *             - AGENT_NAME
 *             - WORKING_AREA
 *             - COMMISSION
 *             - PHONE_NO
 *             - COUNTRY
 *           properties:
 *             AGENT_CODE:
 *               type: string
 *               example: 'A12345'
 *             AGENT_NAME:
 *               type: string
 *               example: 'John Doe'
 *             WORKING_AREA:
 *               type: string
 *               example: 'New York'
 *             COMMISSION:
 *               type: number
 *               format: float
 *               example: 10.5
 *             PHONE_NO:
 *               type: string
 *               example: '123-456-7890'
 *             COUNTRY:
 *               type: string
 *               example: 'USA'
 *     responses:
 *       201:
 *         description: Agent added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Agent added'
 *                 id:
 *                   type: integer
 *                   example: 1
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 'Internal Server Error'
 */
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
/**
 * @swagger
 * /companies/{id}:
 *   patch:
 *     description: Update a company by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The company ID
 *         required: true
 *         type: string
 *       - name: company
 *         in: body
 *         description: Company details to update
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             company_name:
 *               type: string
 *             company_city:
 *               type: string
 *     responses:
 *       200:
 *         description: Company updated
 */
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
/**
 * @swagger
 * /companies/{id}:
 *   put:
 *     description: Replace a company by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The company ID
 *         required: true
 *         type: string
 *       - name: company
 *         in: body
 *         description: Company details to update
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             company_name:
 *               type: string
 *             company_city:
 *               type: string
 *     responses:
 *       200:
 *         description: Company replaced
 */
app.put('/companies/:id', async (req, res) => {
    const { id } = req.params;
    const { company_name, company_city } = req.body;
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
/**
 * @swagger
 * /companies/{COMPANY_ID}:
 *   delete:
 *     description: Delete a company by ID
 *     parameters:
 *       - name: COMPANY_ID
 *         in: path
 *         description: The company ID
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Company deleted
 */
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
