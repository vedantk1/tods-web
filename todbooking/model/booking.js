var knex = require("../DB");
var crypto = require("crypto");
var JWT = require("jsonwebtoken");
const { CustomError } = require("../utils/index");
var fileUpload = require("../common/fileupload");
var { QueryBuilder } = require("../common/query");
const dotenv = require("dotenv").config();
var moment = require("moment");
const { uuid } = require("uuidv4");

class Booking {
  static async addBooking(req, res) {
    try {

    } catch (error) {
      console.log(error);
      throw new CustomError(error, 500, {});
    }
  }
}

module.exports = Booking;
