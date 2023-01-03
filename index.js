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