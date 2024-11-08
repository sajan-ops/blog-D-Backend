const rateLimit = require("express-rate-limit");

exports.likePostLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 second 
  max: 5, // Limit each IP to 5 likes per minute
  message: {
    status: 429,
    error:
      "Please wait sometime before liking more posts.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Example: skip for internal IPs
    // return req.ip === '127.0.0.1';
    return false;
  },
  handler: (req, res) => {
    // Send a more detailed response
    res.status(429).json({
      status: "error",
      code: "RATE_LIMIT_EXCEEDED",
      message: "Please wait 1 minute before liking more posts",
      details: "Maximum 5 likes per minute allowed",
      remainingTime: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000), // seconds until reset
      totalLikes: 5,
      remainingLikes: req.rateLimit.remaining,
    });
  },
});
