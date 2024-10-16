const multer = require("multer");
const uuid = require("uuid");
var storage = multer.diskStorage({
  //1.file destination function
  destination: function (req, file, cb) {
    var directory = "public/images/";
    cb(null, directory);
  },
  //2.file name function
  filename: function (req, file, cb) {
    cb(null, uuid.v4() + file.originalname);
  },
});
module.exports = multer({
  storage: storage,
});
//so from here it will only save the images to our server folder using disk space only
