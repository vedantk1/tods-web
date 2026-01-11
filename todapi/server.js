const express = require("express");
const cors = require("cors");
const multer = require("multer");
const bodyParser = require("body-parser");
const upload = multer().none();
require("dotenv").config();
const port = process.env.PORT;
const app = express();
const mainRoutes = require("./routes/main");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(upload);
app.use("/api", mainRoutes);
app.use("/", (req, res) => {
  res.send("Hello !");
  console.log(`server is running on port ${port}`);
});
app.listen(port, "0.0.0.0", () =>
  console.log(
    `Server running on port http://localhost:${port}`,
    new Date().getTime(),
    "new Date()"
  )
);
