const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { uuid } = require("uuidv4");
const bodyParser = require("body-parser");
const upload = multer().none();
const common = require("./common/common");
require("dotenv").config();
const port = process.env.PORT;
const app = express();
const mainRoutes = require("./routes/main");
const { errorHandler } = require("./common/helpers");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(upload);

//Routes
app.use("/api", mainRoutes);

//Error Handler
app.use(errorHandler);

app.listen(port, "0.0.0.0", () =>
  console.log(
    `Server running on port http://localhost:${port}`,
    new Date().getTime(),
    uuid(),
    "new Date()",
    common.encryptPWD("Qwer@123")
  )
);
