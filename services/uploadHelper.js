const fs = require("fs");
const path = require("path");

//YYYY-MM-DD
function parseExcelDate(value) {
  if (!value) return "";

  if (typeof value === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return isNaN(date) ? "" : date.toISOString();
  }

  const dateStr = String(value).trim();
  const date = new Date(dateStr);
  return isNaN(date) ? "" : date.toISOString();
}

//DD.MM.YYYY
function parseExcelDate(value) {
  if (!value) return "";

  if (typeof value === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + value * 86400000).toISOString();
  }

  if (typeof value === "string" && /^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
    const [day, month, year] = value.split(".");
    return new Date(`${year}-${month}-${day}T00:00:00Z`).toISOString();
  }

  const parsedDate = new Date(value);
  return isNaN(parsedDate.getTime()) ? "" : parsedDate.toISOString();
}

function getFilesForRow(row, field, baseFolder = "staff_files") {
  let rawId = String(row[field] || "").trim();
  if (!rawId) return [];

  const normalizedId = rawId.replace(/\//g, "-");
  const dirPath = path.resolve(__dirname, "..", baseFolder);

  if (!fs.existsSync(dirPath)) return [];

  return fs
    .readdirSync(dirPath)
    .filter((fileName) => fileName.startsWith(normalizedId + "."))
    .map((fileName) => path.join(dirPath, fileName));
}

function getAdmissionFilesForRow(row, field, baseFolder = "files/admission") {
  let admissionId = String(row[field] || "").trim();
  if (!admissionId) return {};

  const admissionIdFormatted = admissionId.replace(/\//g, "-"); // ACT/12/23 => ACT-12-23

  const expectedFields = [
    "aadhaar",
    "disability_certificate",
    "birth_certificate",
    "admission_form",
    "photo",
  ];

  const files = {};

  for (const field of expectedFields) {
    const subdirPath = path.resolve(__dirname, "..", baseFolder, field);

    if (!fs.existsSync(subdirPath) || !fs.statSync(subdirPath).isDirectory())
      continue;

    const matchedFile = fs
      .readdirSync(subdirPath)
      .find((file) => file.startsWith(admissionIdFormatted));

    if (matchedFile) {
      const fullFilePath = path.join(subdirPath, matchedFile);
      if (fs.statSync(fullFilePath).isFile()) {
        files[field] = fullFilePath;
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
    district: segments[3]?.replace(/\d{6}$/, "").trim() || "",
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

// function parsePhoneNumbers(raw) {
//   const safe = (raw || "").toString();
//   const parts = safe.trim().split(/\s+/);
//   return {
//     mobile: parts[0] || "",
//     alternate: parts[1] || "",
//   };
// }
function parsePhoneNumbers(input) {
  // Initialize default result
  const result = {
    mobile: "",
    phone_residence: "",
    alternate: "",
  };

  // Handle non-string inputs (undefined, null, numbers, objects, etc.)
  if (input === undefined || input === null) {
    return result;
  }

  // Convert input to string if it's not already
  const inputStr = typeof input === "string" ? input : String(input);

  // Handle empty string or 'undefined' string
  if (inputStr.trim() === "" || inputStr.toLowerCase() === "undefined") {
    return result;
  }

  // Clean and split the input
  const cleanedInput = inputStr.replace(/\s+/g, " ").trim();
  let numbers = cleanedInput.split(/[,\s]+/).filter((item) => item !== "");

  // If no valid numbers found
  if (numbers.length === 0) {
    return result;
  }

  // Process numbers based on patterns
  const mobilePattern = /^[6789]\d{9}$/; // Indian mobile numbers start with 6-9
  const landlinePattern = /^\d{3,5}-\s*\d{6,7}$/; // Landline with area code

  // Find all mobile and landline numbers
  const mobiles = numbers.filter((num) =>
    mobilePattern.test(num.replace(/\D/g, ""))
  );
  const landlines = numbers.filter((num) => landlinePattern.test(num));

  // Assign numbers based on priority
  if (mobiles.length > 0) {
    result.mobile = mobiles[0];

    // If there's a second mobile, it's alternate
    if (mobiles.length > 1) {
      result.alternate = mobiles[1];
    }
    // If there's a landline and no second mobile, landline is phone_residence
    else if (landlines.length > 0) {
      result.phone_residence = landlines[0];
    }
  }

  // If no mobile but landline exists, treat first landline as phone_residence
  else if (landlines.length > 0) {
    result.phone_residence = landlines[0];

    // If there's a second landline, it's alternate
    if (landlines.length > 1) {
      result.alternate = landlines[1];
    }
  }

  // Handle case where numbers don't match expected patterns
  if (
    result.mobile === "" &&
    result.phone_residence === "" &&
    numbers.length > 0
  ) {
    // Just assign first number as mobile if nothing else matched
    result.mobile = numbers[0];
    if (numbers.length > 1) {
      result.alternate = numbers[1];
    }
  }

  return result;
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
  parseDate,
};
