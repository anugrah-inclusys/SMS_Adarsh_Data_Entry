const dotenv = require("dotenv");
dotenv.config();
module.exports = {
  JWT_TOKEN: process.env.JWT_TOKEN || "",
  API_BASE_URL: "http://localhost:5000/v1",
  HEADERS: (form) => ({
    Authorization: `Bearer ${module.exports.JWT_TOKEN}`,
    ...form.getHeaders(),
  }),
};
