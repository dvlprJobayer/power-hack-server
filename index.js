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

        // Get Api
        app.get('/billing-list', async (req, res) => {
            const result = await billingCollection.find().sort({ "_id": -1 }).toArray();
            res.send(result);
        });

        // Update Api
        app.patch('/update-billing/:id', async (req, res) => {
            const { id } = req.params;
            const bill = req.body;
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: bill
            };
            const result = await billingCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        // Delete Api
        app.delete('/delete-billing/:id', async (req, res) => {
            const { id } = req.params;
            const result = await billingCollection.deleteOne({ _id: ObjectId(id) });
            res.send(result);
        });

        // Get Page Count
        app.get('/page-count', async (req, res) => {
            const count = await billingCollection.estimatedDocumentCount();
            const result = Math.ceil(count / 10)
            res.json(result);
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