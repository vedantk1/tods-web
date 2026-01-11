const Joi = require("joi");
const { body, param, query } = require("express-validator");

module.exports = {
  validateBody: (schema) => {
    return (req, res, next) => {
      const result = schema.validate(req.body);
      if (result.error) {
        return res.status(400).json(result.error.details);
      }
      next();
    };
  },

  validateParams: (schema) => {
    return (req, res, next) => {
      console.log(req.params, "req.params");
      const result = schema.validate(req.params);
      if (result.error) {
        return res.status(400).json(result.error.details);
      }
      next();
    };
  },

  validateQuery: (schema) => {
    return (req, res, next) => {
      console.log(req.query, "req.query");
      const result = schema.validate(req.query);
      if (result.error) {
        return res.status(400).json(result.error.details);
      }
      next();
    };
  },

  schemas: {
    addBookingSchema: Joi.object().keys({
      name: Joi.string().max(255).required(),
    }),
    editBookingSchema: Joi.object().keys({
      name: Joi.string().max(255).required(),
    }),
    deleteBookingSchema: Joi.object().keys({
      id: Joi.array().required(),
    }),
  },
};
