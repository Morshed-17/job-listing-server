const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.port || 5001


// middleware
const corsOptions = {
    origin: "http://localhost:3000" // frontend URI (ReactJS)
}
app.use(express.json());
app.use(cors(corsOptions));



// route
app.get("/", (req, res) => {
    res.status(201).json({message: "Congress bro. backend is working"});
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})