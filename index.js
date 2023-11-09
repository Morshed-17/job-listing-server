const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const port = process.env.port || 5001;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware

app.use(
  cors({
    origin: ["http://localhost:5173",
              "http://localhost:5173",
              "https://job-listing-9d84c.web.app/",
              "https://job-listing-9d84c.firebaseapp.com/"
  
  ], //এখানে ক্লায়েন্ট সাইডের জন্যে ব্যবহার করা সকল লিংক বসাতে হবে।
    // credentials: true, // it won't sent cookie to others origin if we don't set it.
  })
);
app.use(cookieParser());


app.use(cookieParser());
app.use(express.json());


// mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.b2w59kw.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middlewares

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // no token available
  if (!token) {
    return res.status(401).send({ message: "Unautorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    const jobsCollection = client.db("jobDB").collection("jobs");
    const appliedCollection = client.db("jobDB").collection("appliedJobs");

    // auth related api
    app.post("/jwt", async (req, res) => {
      try {
        const user = req.body;
        // console.log("user for token", user);
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "10h",
        });
        res
          .cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
          })
          .send({ success: true });
      } catch (err) {
        res.send(err);
      }
    });

    app.get("/applied", verifyToken, async (req, res) => {
      try {
        if (req.user?.email !== req.query?.email) {
          return res.status(403).send({ message: "forbidden access" });
        }
        let query = {};
        if (req.query?.email) {
          query = { email: req.query.email };
        }
        const result = await appliedCollection.find(query).toArray();
        res.send(result);
      } catch (err) {
        res.send(err);
      }
    });

    app.put("/apply/:id", async (req, res) => {
      try {
        const body = req.body;
        const id = req.params.id;

        const filter = { _id: new ObjectId(id) };
        const option = { upsert: true };
        const update = { $inc: { applicants_number: 1 } };
        const result = await jobsCollection.updateOne(filter, update, option);
        res.send(result);
      } catch (err) {
        res.send(err);
      }
    });

    app.post("/applied/:id", async (req, res) => {
      try {
        const jobId = req.params.id    
        const applied = req.body;

        const result = await appliedCollection.findOne({
          'email': applied.email,
          'job._id': jobId
        })
        if(result){
          console.log({message: 'Already applied'});
          res.send({message: 'Already applied'})
         
        }else{
          
          const result = await appliedCollection.insertOne(applied);
          res.send({ message: "Applied job " });
          console.log('applied');
        }
        
      } catch (err) {
        res.send(err);
      }
    });

    app.get("/jobs", async (req, res) => {
      const cursor = jobsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/jobs", async (req, res) => {
      try {
        const job = req.body;
        const result = await jobsCollection.insertOne(job);

        res.send({ message: "job added" });
      } catch (err) {
        res.send(err);
      }
    });

    app.put("/jobs/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const option = { upsert: true };
        const updatedJob = req.body;
        const job = {
          $set: {
            job_banner: updatedJob.job_banner,
            job_title: updatedJob.job_title,
            author_name: updatedJob.author_name,
            job_category: updatedJob.job_category,
            salary_range: updatedJob.salary_range,
            job_description: updatedJob.job_description,
            post_date: updatedJob.post_date,
            deadline: updatedJob.deadline,
            applicants_number: updatedJob.applicants_number,
            email: updatedJob.email,
          },
        };
        const result = await jobsCollection.updateOne(filter, job, option);
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });
    app.get("/jobs/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await jobsCollection.findOne(query);
        res.send(result);
      } catch (err) {
        res.send(err);
      }
    });
    //find job from view details
    app.get("/job/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await jobsCollection.findOne(query);
        res.send(result);
      } catch (err) {
        res.send(err);
      }
    });
    app.delete("/jobs/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await jobsCollection.deleteOne(query);
        res.send(result);
      } catch (err) {
        res.send(err);
      }
    });
    // get my jobs
    app.get("/my-jobs", verifyToken, async (req, res) => {
      try {
        if (req.user?.email !== req.query?.email) {
          return res.status(403).send({ message: "forbidden access" });
        }
        let query = {};
        if (req.query?.email) {
          query = { email: req.query.email };
        }
        const result = await jobsCollection.find(query).toArray();
        res.send(result);
      } catch (err) {
        res.send(err);
      }
    });
    app.delete("/my-jobs/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = {
          "job._id": new ObjectId(id),
        };
        const result = await appliedCollection.deleteMany(query);
        console.log(result);
        console.log(req.params.id);
      } catch (err) {
        console.log(err);
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// route
app.get("/", (req, res) => {
  res.status(201).json({ message: "Congress bro. backend is working" });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
