const routes = require("express-promise-router")();
const app = require("express");
const asyncHandler = require("express-async-handler");
const passport = require("passport");
const passportConfig = require("../config/passport");
const controller = require("../controller/user");
const helpers = require("../common/helpers");
const bookingroutes = require("./booking");
const passportJWT = passport.authenticate("jwt", { session: false });
const passportJWTADMIN = passport.authenticate("jwtAdmin", { session: false });

routes.post("/login", passportJWTADMIN, controller.Login);

routes.get("/getprofile", helpers.authenticateAdminJwt, controller.getProfile);


module.exports = routes;
