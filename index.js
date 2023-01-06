const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port  = process.env.PORT || 5000
require('dotenv').config()

app.use(express.json())
app.use(cors())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ampetqi.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try{
        const categoryCollections = client.db('secondDeal').collection('category')
        const bookingCollections = client.db('secondDeal').collection('booking')
        const productsCollections = client.db('secondDeal').collection('products')
        const sellerCollections = client.db('secondDeal').collection('seller')
        const buyersCollections = client.db('secondDeal').collection('buyer')

        app.get('/category',async (req,res) => {
            const query = {}
            const result = await categoryCollections.find(query).toArray()
            res.send(result)
        })

        app.get('/category/:id',async (req,res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await categoryCollections.findOne(filter)  
            res.send(result)
        })

        app.get('/booking',async(req,res) => {
            const query = {}
            const booking = await bookingCollections.find(query).toArray()
            res.send(booking)
        })

        app.post('/booking',async(req,res) => {
            const booking =  req.body
            const result = await bookingCollections.insertOne(booking)
            res.send(result)
        })

        app.get('/products',async(req,res) => {
            const query =  {}
            const result = await productsCollections.find(query).toArray()
            res.send(result)
        })

        app.post('/products',async(req,res) => {
            const product =  req.body
            const result = await productsCollections.insertOne(product)
            res.send(result)
        })

        app.post('/users',async(req,res) => {
            const query = req.body

            if (query.providerId=="seller") {
                const seller = await sellerCollections.insertOne(query)
                return res.send(seller)
            }

            const buyer = await buyersCollections.insertOne(query)
            res.send(buyer)
        })

        app.get('/buyers',async (req,res) => {
            const query = {}
            const buyers = await buyersCollections.find(query).toArray()
            res.send(buyers)
        })
    }
    finally{

    }
}
run().catch(console.dir)

app.get('/',async (req,res) => {
    res.send('Second deal is running')
})

app.listen(port,() => {
    console.log(`Second deal is running on port ${port}`)
})