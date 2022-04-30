const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { decode } = require('jsonwebtoken');

//middlewire
app.use(cors());
//for get body
app.use(express.json());

//for token verification

function verifyJWT(req,res, next) {
    const authHeaders = req.headers.authorization;
    if (!authHeaders) {
        return res.status(401).send({message: 'unauthorized access'})
    }
    const token = authHeaders.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({message: 'Forbidden Access'})
        }
        req.decoded = decoded;
        next();
    })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tsihn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const serviceCollection = client.db('geniusCar').collection('service');

        // after order save information to the database
        const orderCollection = client.db('geniusCar').collection('order');
            

        // auth for token 
        app.post('/login',async(req, res)=>{
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN, {
                expiresIn: '1d'
            });
            res.send({accessToken});
        })

        
        //get all services
        app.get('/service', async(req, res) =>{
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

            // get single service
        app.get('/service/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });

        //POST | Add data
        app.post('/service', async(req, res)=>{
            const newService = req.body;
            const result = await serviceCollection.insertOne(newService);
            res.send(result);
        });
        

  
        //update 
        /* app.put('/service/:id', async(req, res)=> {
            const id = req.params.id;
            const updateService = req.body;
            const filter = {_id: ObjectId(id)};
            const options = {upsert: true};
            const updateDoc = {
                $set:{
                    name: updateService.name,
                    description: updateService.description,
                    price: updateService.price,
                    img: updateService.img,
                }
            };
            const result = await serviceCollection.updateOne(filter, updateDoc, options);
            res.send(result);

        }); */

        //delete service
        app.delete('/service/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await serviceCollection.deleteOne(query);
            res.send(result);
        });

        //get all place-order data to the order page
        app.get('/order',verifyJWT, async(req, res) =>{
            const decodedEmail = req.decoded.email;
            const email = req.query.email;

        if (email === decodedEmail) {
            //for specic user email to place order
            const email = req.query.email;
            const query = {email: email};

            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray() ;
            res.send(orders);
           }
           else{
            return res.status(401).send({message: 'Forbidden Access'})
           }
        })


        //get order collection API
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })
    }
    finally{

    }

}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Genius Server');
})

app.listen(port, ()=>{
    console.log('Genius Car - listen is important', port); 
});
