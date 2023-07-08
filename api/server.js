const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const admin = require("firebase-admin");

// Initialize Firebase admin SDK
admin.initializeApp({
  apiKey: "AIzaSyCvwF7FtrurDwgENq8C6EEpehixqPKzx7M",
  authDomain: "faizanattarproduction.firebaseapp.com",
  projectId: "faizanattarproduction",
  storageBucket: "faizanattarproduction.appspot.com",
  messagingSenderId: "647627023449",
  appId: "1:647627023449:web:6cfe3c0e9ec0e880753d48",
  measurementId: "G-TCQ7KR6E9Q",
});

// Initialize Express server
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Middleware to authenticate the user using Firebase ID token
const authenticateUser = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const idToken = authorization.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    return next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

// Socket.IO event handlers
io.on("connection", (socket) => {
  // Handle user authentication
  socket.on("authenticate", async (idToken) => {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const { uid, displayName, photoURL } = decodedToken;
      socket.userId = uid;
      // Store the user details in the database or session as needed
      // Emit an event to notify other clients about the new user
      io.emit("userConnected", { userId: uid, displayName, photoURL });
    } catch (error) {
      console.log(error);
    }
  });

  // Handle gift sending
  socket.on("sendGift", (giftData) => {
    // Process the gift data and store it in the database
    // Emit an event to notify other clients about the new gift
    io.emit("newGift", giftData);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    // Remove the user details from the database or session
    // Emit an event to notify other clients about the user's disconnection
    io.emit("userDisconnected", socket.userId);
  });
});

// Express routes
app.use(express.json());

app.post("/api/authenticate", async (req, res) => {
  const { idToken } = req.body;
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, displayName, photoURL } = decodedToken;
    // Store the user details in the database or session as needed
    res.json({ userId: uid, displayName, photoURL });
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: "Unauthorized" });
  }
});

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
