const jwt = require("jsonwebtoken");

exports.authenticated = (req, res, next) => {
  try {
    const authHeader = req.get("Authorization");
    if (!authHeader) {
      const error = new Error("شما احراز هویت نشده اید!");
      error.statusCode = 401;
      throw error;
    }

    const token = authHeader.split(" ")[1];
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    if (!tokenDecode) {
      const error = new Error("شما احراز هویت نشده اید!");
      error.statusCode = 401;
      throw error;
    }

    req.userId = tokenDecode.user.id;
    next();
  } catch (error) {
    next(error);
  }
};
