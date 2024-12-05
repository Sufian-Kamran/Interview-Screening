import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs/promises";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config();

const url = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

const app = express();
app.use(express.json());
app.use(cors());

let db;
MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((client) => {
    db = client.db(dbName);
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

// Upload Endpoint
app.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const videoPath = `/uploads/${req.file.filename}`;

  db.collection("videos")
    .insertOne({ path: videoPath })
    .then(() => {
      res
        .status(200)
        .json({ message: "Video uploaded successfully", videoPath });
    })
    .catch((err) => {
      console.error("Error saving video path to MongoDB:", err);
      res.status(500).send("Error uploading video.");
    });
});

// Delete Endpoint

app.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Validate the provided ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Convert the string ID to a MongoDB ObjectId
    const objectId = new ObjectId(id);

    // Find the video document in the database
    const video = await db.collection("videos").findOne({ _id: objectId });

    if (!video) {
      return res.status(404).json({ message: "Video not found in database" });
    }

    // Delete the video file from the server
    await fs.unlink(`.${video.path}`);

    // Delete the document from the database
    const result = await db.collection("videos").deleteOne({ _id: objectId });

    if (result.deletedCount > 0) {
      res.status(200).json({ message: "Video and path deleted successfully" });
    } else {
      res.status(404).json({ message: "Failed to delete video document" });
    }
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ message: "Error deleting video" });
  }
});

const port = 5000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
