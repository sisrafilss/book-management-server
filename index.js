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
    const userCollection = database.collection("userList");

    // POST - Add a book to book list
    app.post("/add-book", async (req, res) => {
      const book = req.body;
      const result = await bookCollection.insertOne(book);
      res.json(result);
    });

    // GET All Books
    app.get("/all-books", async (req, res) => {
      const email = req.params.email;

      // const cursor = taskList.find({ email: email });
      const cursor = bookCollection.find();
      const books = await cursor.toArray();
      res.json(books);
    });

    // Delete - Delete a book
    app.delete("/delete-book/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookCollection.deleteOne(query);
      res.json(result);
    });

    // POST - Add user data to Database
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      newUser.role = "user";
      const result = await userCollection.insertOne(newUser);
      res.json(result);
    });

    // PUT - Update user data to database for third party login system
    app.put("/users", async (req, res) => {
      const userData = req.body;

      const query = { email: userData.email };
      const userStatus = await userCollection.findOne(query);

      if (userStatus) {
        res.json(userStatus);
      } else {
        userData.role = "user";
        const filter = { email: userData.email };
        const options = { upsert: true };
        const updateDoc = { $set: userData };
        const result = await userCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        res.json(result);
      }
    });

    // GET a single user data
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      // console.log("Email", email);
      if (email) {
        const query = { email };
        const user = await userCollection.findOne(query);
        // console.log(user);
        res.json(user);
      }
    });

    // PUT - Set an user role as admin
    app.put("/make-admin/:email", async (req, res) => {
      const email = req.params.email;

      // check user status
      const query = { email };
      const user = await userCollection.findOne(query);
      if (user?.role === "admin") {
        const filter = req.body;
        // console.log("filter", filter);
        const updateDoc = {
          $set: {
            role: "admin",
          },
        };
        const result = await userCollection.updateOne(filter, updateDoc);

        // console.log(result);

        if (result.modifiedCount) {
          res.json({ status: 200, message: "User status changed to Admin" });
        } else if (result.matchedCount) {
          res.json({ status: 502, message: "User Already an Admin" });
        } else {
          res.json({ status: 502, message: "User not Found!" });
        }
      } else {
        res.json({
          status: 400,
          message: "You are not allowed to perform this operation",
        });
      }
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
