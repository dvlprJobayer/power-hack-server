const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// Make App
const app = express();

// MiddleWare
app.use(cors());
app.use(express.json());

// Verify JWT
const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
    })
    next();
}

// Database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5bvzh.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const billingCollection = client.db("power-hack").collection("billing-info");
        const userCollection = client.db("power-hack").collection("users");

        // Post Api
        app.post('/add-billing', async (req, res) => {
            const bill = req.body;
            const result = await billingCollection.insertOne(bill);
            res.send(result);
        });

        // Get Api
        app.get('/billing-list', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size)
            const cursor = billingCollection.find().sort({ "_id": -1 });
            let result;
            if (page || size) {
                result = await cursor.skip(page * size).limit(size).toArray();
            } else {
                result = await cursor.toArray();
            }
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

        // Login Api
        app.post('/login', async (req, res) => {
            const email = req.body;
            const user = await userCollection.findOne(email);
            if (!user) {
                return res.status(404).send({ message: 'The user account does not exist!!!' })
            }
            const accessToken = jwt.sign(email, process.env.TOKEN_SECRET, {
                expiresIn: 300
            })
            res.json(accessToken);
        });

        // Registration Api
        app.put('/registration', async (req, res) => {
            const user = req.body;
            console.log(user);
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user
            };
            await userCollection.updateOne(filter, updateDoc, options);
            const accessToken = jwt.sign({ email: user.email }, process.env.TOKEN_SECRET, {
                expiresIn: 300
            })
            res.json(accessToken);
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