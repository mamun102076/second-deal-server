const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port  = process.env.PORT || 5000
require('dotenv').config()

app.use(express.json())
app.use(cors())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ampetqi.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try{
        const categoryCollections = client.db('secondDeal').collection('productCategories')

        app.get('/categories',async(req,res) => {
            const query = {}
            const category = await categoryCollections.find(query).toArray()
            res.send(category)
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