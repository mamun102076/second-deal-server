const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const jwt = require('jsonwebtoken')
const port = process.env.PORT || 5000
require('dotenv').config()

app.use(express.json())
app.use(cors())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ampetqi.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJwt = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(404).send('unauthorized access')
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(404).send('unauthorized access')
        }
        req.decoded = decoded
        next()
    })
}

async function run() {
    try {
        const categoryCollections = client.db('secondDeal').collection('category')
        const bookingCollections = client.db('secondDeal').collection('booking')
        const productsCollections = client.db('secondDeal').collection('products')
        const sellerCollections = client.db('secondDeal').collection('seller')
        const buyersCollections = client.db('secondDeal').collection('buyer')

        const verifyAdmin = async (req,res,next) => {
            const decodedEmail = req.decoded.email
            const query = { email: decodedEmail}
            const buyerUser = await buyersCollections.findOne(query)
            const sellerUser = await sellerCollections.findOne(query)
            if (buyerUser.role!=="Admin" || sellerUser.role!=="Admin") {
                return res.status(404).send('unauthorized access')
            }
            next()
        }

        app.get('/category', async (req, res) => {
            const query = {}
            const result = await categoryCollections.find(query).toArray()
            res.send(result)
        })

        app.get('/category/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await categoryCollections.findOne(filter)
            res.send(result)
        })

        app.get('/booking', async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const booking = await bookingCollections.find(query).toArray()
            res.send(booking)
        })

        app.post('/booking', async (req, res) => {
            const booking = req.body
            const result = await bookingCollections.insertOne(booking)
            res.send(result)
        })

        app.get('/products', async (req, res) => {
            const query = {}
            const result = await productsCollections.find(query).toArray()
            res.send(result)
        })

        app.post('/products', async (req, res) => {
            const product = req.body
            const result = await productsCollections.insertOne(product)
            res.send(result)
        })

        app.delete('/products/:id',verifyJwt, async (req, res) => {
            const decodedEmail = req.decoded.email
            const query = { email: decodedEmail }
            const seller = await sellerCollections.findOne(query)
            console.log(seller)
            if (!seller) {
                return res.status(404).send('unathorized access')
            }

            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await productsCollections.deleteOne(filter)
            res.send(result)
        })

        app.get('/jwt', async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const buyer = await buyersCollections.findOne(query)
            const seller = await sellerCollections.findOne(query)

            if (buyer || seller) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token })
            }
            res.send({ accessToken: '' })
        })


        app.post('/users', async (req, res) => {
            const query = req.body

            if (query.providerId == "seller") {
                const seller = await sellerCollections.insertOne(query)
                return res.send(seller)
            }

            const buyer = await buyersCollections.insertOne(query)
            res.send(buyer)
        })

        app.get('/buyers', async (req, res) => {
            const query = {}
            const buyers = await buyersCollections.find(query).toArray()
            res.send(buyers)
        })

        app.delete('/buyers/:id',verifyJwt, verifyAdmin, async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const buyer = await buyersCollections.deleteOne(filter)
            res.send(buyer)
        })

        app.get('/seller', async (req, res) => {
            const query = {}
            const sellers = await sellerCollections.find(query).toArray()
            res.send(sellers)
        })

        app.delete('/seller/:id',verifyJwt,verifyAdmin, async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const seller = await sellerCollections.deleteOne(filter)
            res.send(seller)
        })

        app.put('/users/admin/:id', verifyJwt, verifyAdmin, async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const buyer = await buyersCollections.findOne(filter)
            const updatedDoc = {
                $set: {
                    role: 'Admin'
                }
            }
            const options = { upsert: true }
            if (buyer) {
                const buyerUpdate = await buyersCollections.updateOne(filter, updatedDoc, options)
                return res.send(buyerUpdate)
            }
            const sellerUpdate = await sellerCollections.updateOne(filter, updatedDoc, options)
            res.send(sellerUpdate)
        })        
    }
    finally {

    }
}
run().catch(console.dir)

app.get('/', async (req, res) => {
    res.send('Second deal is running')
})

app.listen(port, () => {
    console.log(`Second deal is running on port ${port}`)
})