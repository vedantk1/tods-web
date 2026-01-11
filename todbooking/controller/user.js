"use strict";
require("dotenv").config();
const common = require("../common/common");
const Users = require("../model/user");

module.exports = {
  Login: async (req, res, next) => {
    console.log("req.user", req.user, req.user[0].id, "req.user[0].id");
    if (!req.user) {
      return res
        .status(401)
        .send({ status: 0, message: "invalid email/password", result: {} });
    }
    let encryptedId = common.encrypt(req.user[0].id);
    let token = { id: encryptedId, expToken: 1 };
    let refreshtoken = { id: encryptedId, expToken: 0 };
    res.setHeader("Access-Control-Expose-Headers", "access_token");
    res.setHeader("access_token", signToken(token));
    res.setHeader("refresh_token", signToken(refreshtoken));
    res
      .status(200)
      .send({ status: 0, message: "Logged In Successfully", result: {} });
  },
  getProfile: async (req, res, next) => {
    console.log("AdminList inside Controller", req.body);
    if (req.user) {
      res.status(200).send({
        status: 1,
        message: "Profile Listed successfully",
        result: req.user,
      });
      console.log(req.user, "req.user");
    } else {
      res.status(400).send({
        status: 0,
        message: results.message,
        result: {},
      });
    }
  },
};
