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

function getFilesForRow(row, field, baseFolder = "staff_files") {
  const entity = String(row[field] || "").trim();
  const dirPath = path.resolve(__dirname, "..", baseFolder, entity);
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .map((fileName) => path.join(dirPath, fileName));
}

function getAdmissionFilesForRow(row, field, baseFolder = "files/admission") {
  const studentId = String(row[field] || "").trim();
  const dirPath = path.resolve(__dirname, "..", baseFolder, studentId);
  if (!fs.existsSync(dirPath)) return {};

  const expectedFields = [
    "aadhaar",
    "disability_certificate",
    "birth_certificate",
    "admission_form",
    "photo",
  ];

  const files = {};
  for (const field of expectedFields) {
    const subdirPath = path.join(dirPath, field);

    if (fs.existsSync(subdirPath) && fs.statSync(subdirPath).isDirectory()) {
      const insideFiles = fs.readdirSync(subdirPath);
      if (insideFiles.length > 0) {
        const firstFile = insideFiles[0];
        const fullFilePath = path.join(subdirPath, firstFile);
        if (fs.statSync(fullFilePath).isFile()) {
          files[field] = fullFilePath;
        }
      }
    }
  }

  return files;
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
    return 0;
  }

  const strValue = value.toString();
  const match = strValue.match(/-?\d+(\.\d+)?/); // Match integer or float (with optional minus)

  return match ? parseFloat(match[0]) : 0;
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

// if createdAt is a number and convert it into proper 'yyyy-mm-dd'
function excelDateToYMD(serial) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  const year = date_info.getFullYear();
  const month = String(date_info.getMonth() + 1).padStart(2, "0");
  const day = String(date_info.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

//createdAt
function getTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

//preserve the range format (e.g., '1-10') and remove unwanted quotes only,
function cleanRangeString(value = "") {
  return value
    .toString()
    .replace(/^["']+|["']+$/g, "")
    .trim(); // removes surrounding quotes
}

//convert unit name and class name into unit_id and class_id respectively
async function getUnitClassLookup() {
  const res = await axios.get(`${API_BASE_URL}/units/view-units`, {
    headers: { Authorization: `Bearer ${JWT_TOKEN}` },
  });

  const units = res.data?.data || [];
  const unitMap = {};
  const classMap = {};

  for (const unit of units) {
    const unitName = unit.unit_name.trim().toLowerCase();
    unitMap[unitName] = unit._id;

    for (const classItem of unit.classes || []) {
      const classKey = `${unitName}|${classItem.class_name
        .trim()
        .toLowerCase()}`;
      classMap[classKey] = classItem._id;
    }
  }

  return { unitMap, classMap };
}

module.exports = {
  parseExcelDate,
  getFilesForRow,
  getAdmissionFilesForRow,
  parseAddress,
  parseFullName,
  parseToString,
  removeSpaces,
  parsePhoneNumbers,
  parseToNumber,
  excelDateToYMD,
  getTodayDate,
  cleanRangeString,
  getUnitClassLookup,
};
