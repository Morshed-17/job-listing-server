const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.port || 5001;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware
const corsOptions = {
  origin: "http://localhost:5173", // frontend URI (ReactJS)
};
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use(express.json());
app.use(cors(corsOptions));

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
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    const jobsCollection = client.db("jobDB").collection("jobs");
    const appliedCollection = client.db("jobDB").collection("appliedJobs");

    app.get('/applied', async(req, res) => {
      try{
        let query = {};
        if (req.query?.email) {
          query = { email: req.query.email };
        }
        const result = await appliedCollection.find(query).toArray();
        res.send(result);
      }
      catch(err){
        res.send(err)
      }
    })

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

    app.post('/applied', async(req, res) => {
      try {
        const applied = req.body;
        const result = await appliedCollection.insertOne(applied);

        res.send({ message: "applied job added" });
      } catch (err) {
        res.send(err);
      }
    })

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
    app.get("/my-jobs", async (req, res) => {
      try {
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
