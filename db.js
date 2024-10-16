const mongoose = require("mongoose")
mongoose
  .connect(process.env.mongoDBStr)
  .then(() => console.log("Database connected"))
  .catch((err) => console.log(`DB connection failed ${err}`));