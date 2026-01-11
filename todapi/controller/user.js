"use strict";
require("dotenv").config();
const common = require("../common/common");
module.exports = {
  Login: async (req, res, next) => {
    console.log("Login inside Controller");
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
};
