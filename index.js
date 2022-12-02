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
        const categoriesCollection = client.db('PlatinamSwapDB').collection('productCategories');
        const productsCollection = client.db('PlatinamSwapDB').collection('products');
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10h' });
            res.send({ token })
        })


        // categories api
        app.get('/categories', async (req, res) => {
            const quarry = {}
            const cursor = categoriesCollection.find(quarry);
            const categories = await cursor.toArray();
            res.send(categories);
        })
        app.get('/categories/:id', async (req, res) => {
            const id = req.params.id;
            const quarry = { _id: ObjectId(id) };
            const category = await categoriesCollection.findOne(quarry);
            res.send(category);
        })

        // product api
        app.get('/products', async (req, res) => {
            let quarry = {}
            if (req.query.category) {
                quarry = {
                    category: req.query.category
                }
            }
            if (req.query.reportStatus) {
                quarry = {
                    reportStatus: req.query.reportStatus
                }
            }
            const cursor = productsCollection.find(quarry);
            const products = await cursor.toArray();
            res.send(products);
        })
        app.get('/products/seller', async (req, res) => {
            let quarry = {}
            if (req.query.email) {
                quarry = {
                    sellerEmail: req.query.email
                }
            }
            const cursor = productsCollection.find(quarry);
            const products = await cursor.toArray();
            res.send(products);
        })
        app.get('/products/advertised', async (req, res) => {

            const quarry = {
                advertisementStatus: true, productStatus: "available"
            }
            const cursor = productsCollection.find(quarry);
            const products = await cursor.toArray();
            res.send(products);
        })
        app.get('/products/buyer', async (req, res) => {
            let quarry = {}
            if (req.query.email) {
                quarry = {
                    buyerEmail: req.query.email
                }
            }
            const cursor = productsCollection.find(quarry);
            const products = await cursor.toArray();
            res.send(products);
        })
        app.post('/products', async (req, res) => {
            const product = req.body;
            const products = await productsCollection.insertOne(product);
            res.send(products);
        })

        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;

            const buyerName = req.body.buyerName
            const buyerEmail = req.body.buyerEmail
            const buyerPhoneNumber = req.body.buyerPhoneNumber
            const meetingLocation = req.body.meetingLocation
            const productStatus = req.body.productStatus

            const quarry = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    buyerName: buyerName,
                    buyerEmail: buyerEmail,
                    buyerPhoneNumber: buyerPhoneNumber,
                    meetingLocation: meetingLocation,
                    productStatus: productStatus
                }
            }
            const product = await productsCollection.updateOne(quarry, updateDoc, options);
            res.send(product);
        })

        app.put('/products/report/:id', async (req, res) => {
            const id = req.params.id;
            const reportedBy = req.body.reportedBy
            const reportStatus = req.body.reportStatus

            const quarry = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    reportedBy: reportedBy,
                    reportStatus: reportStatus
                }
            }
            const product = await productsCollection.updateOne(quarry, updateDoc, options);
            res.send(product);
        })
        app.put('/products/advertisement/:id', async (req, res) => {
            const id = req.params.id;
            const advertisementStatus = req.body.advertisementStatus
            const quarry = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    advertisementStatus: advertisementStatus
                }
            }
            const product = await productsCollection.updateOne(quarry, updateDoc, options);
            res.send(product);
        })

        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const quarry = { _id: ObjectId(id) };
            const products = await productsCollection.deleteOne(quarry);
            res.send(products);
        })
        app.delete('/products/report/:id', async (req, res) => {
            const id = req.params.id;
            const quarry = { _id: ObjectId(id) };
            const products = await productsCollection.deleteOne(quarry);
            res.send(products);
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
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const quarry = { email };
            const result = await usersCollection.findOne(quarry);
            res.send(result);
        })

        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isBuyer: user?.userRole === "buyer" });
        })
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.userRole === "seller" });
        })
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.userRole === "admin" });
        })
        app.get('/users/verify/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({
                isVerify: user?.userStatus === true
            });
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
            const userStatus = req.body.userStatus;
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

