require("dotenv").config();
const signale = require("signale");
const { CustomError } = require("../utils/index");
const _ = require("lodash");
const passport = require("passport");

exports.verify = (error) => {
  console.log(error, "verify");
  if (error) {
    const message = `${error.details[0].message}`;
    console.log("Message", message);
    throw new CustomError(message, 422, error);
  }
};

exports.errorHandler = function (error, req, res, next) {
  if (process.env.isDev) {
    signale.fatal(error);
  }

  if (error instanceof CustomError) {
    return res
      .status(error.statusCode || 500)
      .json({ success: 0, message: error.message, error: error.data });
  }
  return res.status(500).json({ message: "An error occurred.", error: error });
};

exports.isHavePermission = (menuName, permissionType) => {
  return async (req, res, next) => {
    try {
      console.log(
        "isHavePermission",
        req.user,
        "req.user",
        menuName,
        "menuName",
        permissionType,
        "permissionType"
      );
      if (req.user) {
        if (req.user.menus && req.user.menus.length) {
          let RequestedMenu = _.find(req.user.menus, (o) => {
            console.log(o, "isHavePermission");
            return o.menu_title == menuName;
          });
          console.log("RequestedMenu", RequestedMenu);
          if (
            RequestedMenu &&
            RequestedMenu.permissions &&
            RequestedMenu.permissions.length
          ) {
            let RequestedPermission = _.find(
              RequestedMenu.permissions,
              (permission) => {
                return (
                  permission.permission_type == permissionType &&
                  permission.is_permission_allowed == 1
                );
              }
            );
            if (RequestedPermission && RequestedPermission.permission_id) {
              console.log(RequestedPermission, "RequestedPermission");
              console.log("You Passed");
              next();
            } else {
              console.log(
                `You dont have ${permissionType} permission for ${menuName} menu`
              );
              throw new CustomError(
                "You dont have permission for this menu",
                401,
                null
              );
            }
          } else {
            console.log(`You dont have permission for ${menuName} menu`);
            throw new CustomError(
              "You dont have permission for this menu",
              401,
              null
            );
          }
        } else {
          console.log("You dont have any permission");
          throw new CustomError("You dont have any permission", 401, null);
        }
      } else {
        throw new CustomError("Unauthorized", 401, null);
      }
    } catch (error) {
      throw new CustomError(error.message, 500, null);
    }
  };
};

exports.GetAllList = (body, results, rowcount, page, limit, offsets, link) => {
  console.log("IN", results.length);
  try {
    URL = process.env.NODE_ENV = "development"
      ? process.env.ENVIRONMENT_URL
      : "";
    let data = {
      data: results,
      current_page: page,
      path: `${URL}/${link}`,
      from: page == 1 && !results.length ? 0 : (page - 1) * limit + 1,
      to: (page - 1) * limit + results.length,
      last_page:
        results.length > 0
          ? parseInt(Math.ceil(parseFloat(rowcount / limit)))
          : null,
      first_page_url: `${URL}/${link}?page=1`,
      last_page_url:
        results.length > 0
          ? `${URL}/${link}?page=${parseInt(
              Math.ceil(parseFloat(rowcount / limit))
            )}`
          : null,
      next_page_url:
        results.length > 0
          ? offsets + limit < rowcount
            ? `${URL}/${link}?page=${page + 1}`
            : null
          : null,
      prev_page_url: page - 1 > 0 ? `${URL}/${link}?page=${page - 1}` : null,
      per_page: limit,
      total: results.length > 0 ? parseInt(rowcount) : 0,
    };
    console.log("data", data);
    data = { ...data, message: "success" };
    return data;
  } catch (err) {
    console.log("error", err);
    throw new CustomError(err.message, 500, null);
  }
};
// exports.authenticateAdminJwt = (token) => {
//   console.log(token, "token");
//   if (token) token = token.replace("Bearer", "").trim();
//   return token;
// };

exports.authenticateAdminJwt = (req, res, next) => {
  if (req.headers.authorization)
    req.headers.authorization = req.headers.authorization
      .replace("Bearer", "")
      .trim();
  passport.authenticate("jwt", function (err, payload, info) {
    if (err) {
      throw new CustomError("authentication Error", 500, err);
    } //console.log(" err", err);s
    else if (!payload) {
      throw new CustomError("authentication failed", 401, null);
      // return res
      //   .status(200)
      //   .send({ status: 0, message: "authentication failed", result: [] });
    } else {
      console.log("authenticateAdminJwt payload", payload);
      next();
    }
  })(req, res, next);
};
