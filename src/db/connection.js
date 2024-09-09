import mongoose from "mongoose";

mongoose.connect("mongodb://localhost:27017/uptimekuma")
.then(() => console.log("Connected to Mongodb"))
.catch((error) => { console.log("Error connecting to Mongodb", error) })