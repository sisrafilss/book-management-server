const express = require("express");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0-shard-00-00.quv1r.mongodb.net:27017,cluster0-shard-00-01.quv1r.mongodb.net:27017,cluster0-shard-00-02.quv1r.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-teugro-shard-0&authSource=admin&retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();

    const database = client.db("book_management");
    const bookCollection = database.collection("bookList");

    // POST - Add a book to book list
    app.post("/add-book", async (req, res) => {
      const book = req.body;

      console.log(book);
      const result = await bookCollection.insertOne(book);
      res.json(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Book Management server is running...");
});

app.listen(port, () => {
  console.log("Server has started at port", port);
});
