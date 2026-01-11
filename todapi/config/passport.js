const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const { ExtractJwt } = require("passport-jwt");
const JWTStrategy = require("passport-jwt").Strategy;
var knex = require("../knex");
const common = require("../common/common");
const helpers = require("../common/helpers");
const dotenv = require("dotenv").config();

passport.use(
  "jwt",
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJwt.fromHeader("authorization"),
      secretOrKey: process.env.JWT_SECRET,
      passReqToCallback: true,
    },
    async (req, payload, done) => {
      console.log("JWTStrategypayload", payload);
      try {
        console.log(payload.sub, "payload.sub");
        let user_id = common.decrypt(payload.sub);
        console.log(user_id.toString(), "user_id.toString()");
        let userSelect = [
          `users.id`,
          `users.org_id`,
          `users.name`,
          `users.surname`,
          `users.user_type`,
          `users.labour_type`,
          `users.email`,
          `users.image`,
        ];
        let query = knex("users")
          .select([...userSelect])
          .where(`users.id`, user_id)
          .first();

        console.log("query", query.toSQL());
        let result = await query;
        console.log("result", result);
        req.user = result;
        console.log("req.user", req.user);
        return done(null, result);
      } catch (error) {
        console.log("JWT_SECRET");
        return done(
          {
            success: 0,
            message: error.message,
            data: {},
          },
          false
        );
      }
    }
  )
);

passport.use(
  "jwtAdmin",
  new LocalStrategy(
    {
      usernameField: "email",
      passReqToCallback: true,
    },
    async (req, email, password, done) => {
      try {
        console.log(req, email, password, "req, email, password");
        let query = knex(process.env.USERS)
          .where("email", email)
          .andWhere("password", common.encryptPWD(password))
          .andWhere("isdeleted", 1);
        console.log(query, "query");
        let result = await query;
        console.log(result, "result");
        if (result.length) {
          done(null, result);
        } else {
          done("Invalid Credentials", false);
        }
      } catch (e) {
        return done(e, false);
      }
    }
  )
);
