const jwt = require("jsonwebtoken");
exports.blockUnAuthorizeAccess_User = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.Jwt_Secret_User);
      req.userid = decoded.userid;
      next();
    }
  } catch (error) {
    console.log(error);
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};
