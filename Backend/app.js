const express = require("express");
const app = express();
const mongoose = require("mongoose");
const { GridFSBucket, MongoGridFSError } = require("mongoose");
app.use(express.json());
const cors = require("cors");
app.use(cors());

// MongoDB connection


mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to database");
  })
  .catch((e) => console.log(e));

// GridFSBucket initialization
const conn = mongoose.connection;
let gfs;

conn.once("open", () => {
  // Initialize GridFS stream
  gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "pdfs", // Bucket name
  });
  console.log("GridFS initialized");
});

// Route to upload files to GridFS
app.post("/upload-files", async (req, res) => {
  const title = req.body.title;
  const fileBuffer = req.body.file.buffer; // Assuming file is sent as binary in the request body

  try {
    const uploadStream = gfs.openUploadStream(title);
    uploadStream.end(fileBuffer);

    uploadStream.on("finish", () => {
      res.status(200).json({ status: "ok" });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Failed to upload file" });
  }
});

// Route to retrieve files from GridFS
app.get("/get-files/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const downloadStream = gfs.openDownloadStreamByName(filename);

    downloadStream.on("error", (error) => {
      console.error(error);
      res.status(404).json({ status: "error", message: "File not found" });
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Failed to retrieve file" });
  }
});

// Basic route for testing
app.get("/", async (req, res) => {
  res.send("Success!!!!!!");
});

app.listen(5000, () => {
  console.log("Server Started");
});
