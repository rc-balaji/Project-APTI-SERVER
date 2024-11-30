const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const { title } = require("process");

const app = express();
const port = 4000;

// const ca

app.use(require("cors")());

// Middleware
// app.use(express.json());
app.use(bodyParser.json());

// Server start
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
