const routes = require("express-promise-router")();
const app = require("express");
const asyncHandler = require("express-async-handler");
const passport = require("passport");
const passportConfig = require("../config/passport");
const {
  schemas,
  validateBody,
  validateParams,
} = require("../routevalidations/booking");
const Controller = require("../controller/booking");

routes
  .route("/")
  .get(Controller.addBooking);

module.exports = routes;
