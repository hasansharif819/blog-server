const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kmhwdam.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//Json Web Token
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}

async function run() {
    try {
        await client.connect();
        const blogCollection = client.db('blog_db').collection('blogs');
        const userCollection = client.db('blog_db').collection('users');
        const commentCollection = client.db('blog_db').collection('comments');

        //Service Added API / update service
        app.post('/blog', async (req, res) => {
            const blog = req.body;
            const query = { user_id: blog.user_id, img: blog.img, title: blog.title, slug: blog.slug, blog1: blog.blog1, blog2: blog.blog2, blog3: blog.blog3 };
            const exists = await blogCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, order: exists })
            }
            else {
                const result = await blogCollection.insertOne(blog);
                return res.send({ success: true, result });
            }
        });

        //login user data collect
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
            res.send({ result, token });
        });

        //get all users
        app.get('/user', async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        });

        app.get('/blog', async (req, res) => {
            const blog = await blogCollection.find().toArray();
            res.send(blog);
        });

        //query by email
        app.get('/blog/:email', async (req, res) => {
            const user_id = req.query.user_id;
            const query = { user_id: user_id };
            const bloging = await blogCollection.find(query).toArray();
            res.send(bloging);
        });

        //Delete my blog
        app.delete('/blog/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await blogCollection.deleteOne(query);
            res.send(result);
        })

        //comment
        app.post('/comment', async (req, res) => {
            const comment = req.body;
            const query = { comment: comment.comment, client: comment.client, clientName: comment.clientName, blogId: comment.blogId };
            const result = await commentCollection.insertOne(comment);
            return res.send({ success: true, result });
        });

        //get comment
        app.get('/comment/:blogId', async (req, res) => {
            const blogId = req.params.blogId;
            const query = { blogId: blogId };
            const comment = await commentCollection.find(query).toArray();
            res.send(comment);
        })

    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Blog');
});

app.listen(port, () => {
    console.log(`Blog ${port}`);
})