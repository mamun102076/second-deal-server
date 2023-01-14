const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const jwt = require('jsonwebtoken')
const port = process.env.PORT || 5000
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SK)

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
        const paymentCollections = client.db('secondDeal').collection('payment')
        const advertiseCollections = client.db('secondDeal').collection('advertise')

        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email
            const query = { email: decodedEmail }
            const buyerUser = await buyersCollections.findOne(query)
            const sellerUser = await sellerCollections.findOne(query)

            if (buyerUser?.role === 'Admin' || sellerUser?.role === 'Admin') {
                return next()
            }
            res.status(401).send('unauthorized access')
        }

        app.get('/category', async (req, res) => {
            const query = {}
            const result = await categoryCollections.find(query).toArray()
            res.send(result)
        })

        app.get('/booking', async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const booking = await bookingCollections.find(query).toArray()
            res.send(booking)
        })

        app.post('/booking',verifyJwt, async (req, res) => {
            const decodedEmail = req.decoded.email
            const query = { email: decodedEmail }
            const buyer = await buyersCollections.findOne(query)
            if (!buyer) {
                return res.status(404).send('buyer not found')
            }

            const booking = req.body
            const bookingQuery = {
                productName: booking.productName,
                email: booking.email
            }
            const alreadyBooked = await bookingCollections.find(bookingQuery).toArray()
            if (alreadyBooked.length) {
                const message = 'you have already booked this product'
                return res.send({message})
            }

            const result = await bookingCollections.insertOne(booking)
            res.send(result)
        })

        app.delete('/booking/:id', verifyJwt, async (req, res) => {
            const decodedEmail = req.decoded.email
            const query = { email: decodedEmail }
            const result = await buyersCollections.findOne(query)
            if (!result) {
                return res.status(404).send('unathorized access')
            }

            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const booking = await bookingCollections.deleteOne(filter)
            res.send(booking)
        })

        app.get('/products', async (req, res) => {
            const query = {}
            const result = await productsCollections.find(query).toArray()
            res.send(result)
        })

        app.get('/products/category/:name', async (req, res) => {
            const name = req.params.name
            const query = {categoryName: name}
            const result = await productsCollections.find(query).toArray()
            res.send(result)
        })

        app.post('/products', async (req, res) => {
            const product = req.body
            const result = await productsCollections.insertOne(product)
            res.send(result)
        })

        app.delete('/products/:id', verifyJwt, async (req, res) => {
            const decodedEmail = req.decoded.email
            const query = { email: decodedEmail }
            const seller = await sellerCollections.findOne(query)
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
            return res.send({ accessToken: '' })
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

        app.get('/user/buyer/:email', async (req, res) => {
            const email = req.params.email
            const query = { email }
            const buyer = await buyersCollections.findOne(query)
            if (buyer) {
                return res.send({ isBuyer: buyer.providerId == 'user' })
            } else {
                return res.send({ isBuyer: false })
            }
        })

        app.get('/buyers', async (req, res) => {
            const query = {providerId: 'user'}
            const buyers = await buyersCollections.find(query).toArray()
            res.send(buyers)
        })

        app.delete('/buyers/:id', verifyJwt, verifyAdmin, async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const buyer = await buyersCollections.deleteOne(filter)
            res.send(buyer)
        })

        app.get('/seller', async (req, res) => {
            const query = {providerId: 'seller'}
            const sellers = await sellerCollections.find(query).toArray()
            res.send(sellers)
        })

        app.put('/seller/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    verification: 'verified'
                }
            }
            const options = { upsert: true }
            const seller = await sellerCollections.updateOne(filter, updatedDoc, options)
            res.send(seller)
        })

        app.delete('/seller/:id', verifyJwt, verifyAdmin, async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const seller = await sellerCollections.deleteOne(filter)
            res.send(seller)
        })

        app.get('/user/seller/:email', async (req, res) => {
            const email = req.params.email
            const query = { email }
            const seller = await sellerCollections.findOne(query)
            if (seller) {
                return res.send({ isSeller: seller.providerId == 'seller' })
            } else {
                return res.send({ isSeller: false })
            }
        })

        app.get('/user/admin/:email', async (req, res) => {
            const email = req.params.email
            const query = { email }
            const buyer = await buyersCollections.findOne(query)
            const seller = await sellerCollections.findOne(query)
            if (buyer) {
                return res.send({ isAdmin: buyer.role == 'Admin' })
            } else if (seller) {
                return res.send({ isAdmin: seller.role == 'Admin' })
            } else {
                return res.send({ isAdmin: false })
            }
        })

        app.put('/users/admin/:id', verifyJwt, verifyAdmin, async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const buyer = await buyersCollections.findOne(filter)
            const updatedDoc = {
                $set: {
                    role: 'Admin',
                    providerId: ''
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

        app.get('/payment/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await bookingCollections.findOne(filter)
            res.send(result)
        })

        app.post("/create-payment-intent", async (req, res) => {
            const booking = req.body;
            const price = booking.price
            const amount = price * 100

            const paymentIntent = await stripe.paymentIntents.create({
                currency: "usd",
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post('/payment',async(req,res) => {
            const payment = req.body
            const result = await paymentCollections.insertOne(payment)

            const id = payment.bookingId
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const booking = await bookingCollections.updateOne(filter,updatedDoc,options)
            res.send(result)
        })

        app.get('/advertise',async (req,res) => {
            const query = {}
            const advertise = await advertiseCollections.find(query).toArray()
            res.send(advertise)
        })

        app.post('/advertise',verifyJwt,async (req,res) => {
            const decodedEmail = req.decoded.email
            const query = { email: decodedEmail }
            const buyer = await buyersCollections.findOne(query)
            if (!buyer) {
                return res.status(404).send('buyer not found')
            }

            const advertise = req.body
            const result = await advertiseCollections.insertOne(advertise)
            res.send(result)
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