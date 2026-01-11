var knex = require("../DB");
var crypto = require("crypto");
var JWT = require("jsonwebtoken");
var fileUpload = require("../common/fileupload");
var common = require("../common/common");
const dotenv = require("dotenv").config();
const { uuid } = require("uuidv4");
signToken = (user) => {
  var JWTEXP =
    user.expToken == 1
      ? new Date().getTime() + 365 * 24 * 60 * 60 * 1000
      : (new Date().getTime() + 604800 * 1000) / 1000;
  return JWT.sign(
    {
      iss: process.env.JWT_ISS,
      sub: user.id,
      iat: (new Date().getTime() + 60 * 60 * 1000) / 1000, //new Date().getTime(), // current time
      exp: JWTEXP,
    },
    process.env.JWT_SECRET
  );
};
