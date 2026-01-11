const crypto = require("crypto");
const dotenv = require("dotenv").config();

module.exports = {
  encryptPWD: (data) => {
    const algorithm = "aes-256-cbc";
    const key = "laksieurjdhbnshzjhsdcbjshdffffff";
    const iv = "qasedftghyujkion";
    var key1 =
      process.env.TEXT.substring(0, 8) + data + process.env.TEXT.substring(8);
    console.log(key1, "key1");
    console.log(key.length, iv.length, "key.length, iv.length");
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(key1, "utf8", "hex");
    encrypted += cipher.final("hex");
    console.log(encrypted, "encrypted");
    return encrypted;
  },

  decryptPWD: (data) => {
    console.log("decryptPWD", data);
    const algorithm = "aes-256-cbc";
    const key = "laksieurjdhbnshzjhsdcbjshdffffff";
    const iv = "qasedftghyujkion";
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    var decrypted = decipher.update(data, "hex", "utf8");
    decrypted += decipher.final("utf8");
    console.log(decrypted, "decrypted");
    decrypted = decrypted.substring(8, decrypted.length - 13);
    console.log(decrypted, "decrypted");
    return decrypted;
  },
  encrypt: (data) => {
    console.log(data, "data");
    const algorithm = "aes-256-cbc";
    const key = "laksieurjdhbnshzjhsdcbjshdffffff";
    const iv = "qasedftghyujkion";
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");
    console.log(encrypted, "encrypted");
    return encrypted;
  },
  decrypt: (data) => {
    const algorithm = "aes-256-cbc";
    const key = "laksieurjdhbnshzjhsdcbjshdffffff";
    const iv = "qasedftghyujkion";
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    var decrypted = decipher.update(data, "hex", "utf8");
    decrypted += decipher.final("utf8");
    console.log(decrypted, "decrypted");
    return decrypted;
  },
};
