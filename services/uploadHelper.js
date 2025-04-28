const fs = require("fs");
const path = require("path");

function parseExcelDate(value) {
  if (!value) return "";
  if (typeof value === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + value * 86400000).toISOString();
  }
  return new Date(value).toISOString();
}

function getFilesForRow(row, baseFolder = "staff_files") {
  const email = String(row.email || "").trim();
  const dirPath = path.resolve(__dirname, "..", baseFolder, email);
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .map((fileName) => path.join(dirPath, fileName));
}

function parseAddress(fullAddress = "") {
  const segments = fullAddress.split(",").map((s) => s.trim());
  const lastSegment = segments[segments.length - 1];
  const postal_code_match = lastSegment?.match(/\b\d{6}\b/);

  return {
    house_name: segments[0] || "",
    street: segments[1] || "",
    city: segments[2]?.replace(/\d{6}$/, "").trim() || "",
    state: "Kerala",
    country: "India",
    postal_code: postal_code_match ? postal_code_match[0] : "",
  };
}

function parseFullName(fullName = "") {
  const parts = fullName.trim().split(/\s+/);
  return {
    first_name: parts[0] || "",
    last_name: parts.slice(1).join(" ") || "",
  };
}

function parseToString(value = "") {
  return value.toString().replace(/\D/g, "");
}

function parseToNumber(value = "") {
  if (typeof value !== "string" && typeof value !== "number") {
    return 0; // Handle invalid types safely
  }

  const numericString = value.toString().replace(/\D/g, ""); // Remove non-digits
  return numericString ? parseInt(numericString, 10) : 0; // Parse or return 0
}

function removeSpaces(value = "") {
  return value.toString().replace(/\s+/g, "").trim();
}

function parsePhoneNumbers(raw) {
  const safe = (raw || "").toString();
  const parts = safe.trim().split(/\s+/);
  return {
    mobile: parts[0] || "",
    alternate: parts[1] || "",
  };
}

module.exports = {
  parseExcelDate,
  getFilesForRow,
  parseAddress,
  parseFullName,
  parseToString,
  removeSpaces,
  parsePhoneNumbers,
  parseToNumber
};
