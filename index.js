const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;


//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0zdruwc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: " UnAuthorized Access" })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: " Forbidden Access" })
        }
        req.decoded = decoded;
        next()
    })
}

async function run() {

    try {
        const usersCollection = client.db('PlatinamSwapDB').collection('users');
        const categoryCollection = client.db('PlatinamSwapDB').collection('productCategories');
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' });
            res.send({ token })
        })

        app.get('/categories', async (req, res) => {
            const quarry = {}
            const cursor = categoryCollection.find(quarry);
            const categories = await cursor.toArray();
            res.send(categories);
        })

        // user api 
        app.get('/users', async (req, res) => {
            let quarry = {}
            if (req.query.userRole) {
                quarry = {
                    userRole: req.query.userRole
                }
            }
            const cursor = usersCollection.find(quarry);
            const users = await cursor.toArray();
            res.send(users);
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const quarry = { _id: ObjectId(id) };
            const users = await usersCollection.deleteOne(quarry);
            res.send(users);
        })

        // seller api
        app.get('/sellers', async (req, res) => {
            let quarry = {}
            if (req.query.userRole) {
                quarry = {
                    userRole: req.query.userRole
                }
            }
            const cursor = usersCollection.find(quarry);
            const sellers = await cursor.toArray();
            res.send(sellers);
        })
        app.delete('/sellers/:id', async (req, res) => {
            const id = req.params.id;
            const quarry = { _id: ObjectId(id) };
            const sellers = await usersCollection.deleteOne(quarry);
            res.send(sellers);
        })
        app.patch('/sellers/:id', async (req, res) => {
            const id = req.params.id;
            const userStatus = req.body;
            const quarry = { _id: ObjectId(id) };

            const updateDoc = {
                $set: {
                    userStatus: userStatus
                }
            }
            const result = await usersCollection.updateOne(quarry, updateDoc);
            res.send(result);
        })



    }
    finally {

    }
}

run().catch(error => console.error(error));


app.get('/', (req, res) => {
    res.send('platinam-swap server is running')
});

app.listen(port, () => {
    console.log(`platinam-swap server running on ${port}`);
});

