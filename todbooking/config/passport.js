const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const { ExtractJwt } = require("passport-jwt");
const JWTStrategy = require("passport-jwt").Strategy;
var knex = require("../DB");
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
          `tod_users.id`,
          `tod_users.first_name`,
          `tod_users.last_name`,
          `tod_users.email`,
          `tod_users.mobile_number`,
        ];
        let query = knex("tod_users")
          .select([...userSelect])
          .where(`tod_users.id`, user_id)
          .first();

        let result = await query;
        req.user = result;
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
        console.log(email, password, "req, email, password");

        let query = knex(process.env.TOD_USERS)
          .where("email", email)
          .andWhere("password", common.encryptPWD(password))
          .andWhere("is_deleted", 0);
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
