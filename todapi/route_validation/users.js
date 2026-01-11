const Joi = require("joi");
const { verify } = require("../common/helpers");

module.exports = {
  validateBody: (schema) => {
    return (req, res, next) => {
      console.log(req, "req");
      console.log("Joi.object()", Joi.object(), "Joi.object()");
      const result = schema.validate(req.body);
      if (result.error) {
        verify(result.error);
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
      // if (!req.value) { req.value = {}; }
      // req.value['body'] = result.value;
      next();
    };
  },

  schemas: {
    AdminSchema: Joi.object({
      name: Joi.string().trim().max(255).required(),
      surname: Joi.string().trim().max(255).required(),
      email: Joi.string().email().required(),
      password: Joi.string().trim().max(255).required(),
      // image: Joi.string().trim().max(255).required()
      // Joi.string()
      // .pattern(new RegExp('/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/')).required(),
      // group_type: Joi.number().min(1).max(3).required(),
    }),

    AdminIdSchema: Joi.object().keys({
      id: Joi.string().guid().required(),
    }),
  },
};
