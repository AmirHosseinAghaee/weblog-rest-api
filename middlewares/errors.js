const { handleResponse } = require("../utils/response");

exports.errorHandle = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message;
  const data = err.data;
  handleResponse(res, status, data, message);
};
