const fs = require("fs");
const dotenv = require("dotenv").config();

module.exports = {
  imageLoop: function (req) {
    var imageName;
    req.image.map((image) => {
      imageName = image.originalname;
    });
    console.log(imageName, "imageName");
    return imageName;
  },

  base64Conversion: function (image) {
    if (image) {
      let extension = image.split(".").pop();
      let encodedImage = fs.readFileSync(`uploads/${image}`, {
        encoding: "base64",
      });
      return `data:image/${extension};base64,${encodedImage}`;
      // console.log(encodedImage, "encodedImage");
    } else {
      return "";
    }
  },
  setImageUrl: (result) => ({
    ...result,
    image: result && result.image ? `${process.env.NODE_ENV = "development" ? process.env.ENVIRONMENT_URL : ''}/${result.image}` : ''
  })
};
