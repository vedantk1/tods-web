"use strict";
require("dotenv").config();
const Model = require("../model/booking.js");
const { GetAllList } = require("../common/helpers.js");
module.exports = {
  addBooking: async (req, res) => {
    let results = await Model.addBooking(req);
    console.log(results, "results");
    if (results.success) {
      res.status(200).send({
        status: 1,
        message: results.message,
        result: results.data,
      });
    } else {
      res.status(422).send({
        status: 0,
        message: results.message,
        result: {},
      });
    }
  },
};
