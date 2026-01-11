exports.CustomError = class extends Error {
  constructor(message, statusCode = 500, data = null) {
    // Need to pass `options` as the second parameter to install the "cause" property.
    super(message);

    this.name = "CustomError";
    // Custom debugging information
    this.statusCode = statusCode;
    this.data = data;
  }
};
