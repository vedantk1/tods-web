const Router = require("express-promise-router");
const app = require("express");
const asyncHandler = require("express-async-handler");
const passport = require("passport");
const passportConfig = require("../config/passport");
const controller = require("../controller/user");
const router = new Router();

const passportJWT = passport.authenticate("jwt", { session: false });
const passportJWTADMIN = passport.authenticate("jwtAdmin", { session: false });

router.post("/login", passportJWTADMIN, controller.Login);

module.exports = router;
