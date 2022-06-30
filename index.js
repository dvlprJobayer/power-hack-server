const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// Make App
const app = express();

// MiddleWare
app.use(cors());
app.use(express.json());

// Database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5bvzh.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const billingCollection = client.db("power-hack").collection("billing-info");

        // Post Api
        app.post('/add-billing', async (req, res) => {
            const bill = req.body;
            const result = await billingCollection.insertOne(bill);
            res.send(result);
        });
    }
    finally { }
}
run().catch(console.dir);

// Test Api
app.get('/', (req, res) => {
    res.send('Running Power Hack server');
});

// Listen App
app.listen(port, () => {
    console.log('Running server on', port);
});