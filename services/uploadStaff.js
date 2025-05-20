const axios = require("axios");
const FormData = require("form-data");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const { API_BASE_URL, HEADERS } = require("../config/config");
const {
  parseDate,
  getFilesForRow,
  parseFullName,
  removeSpaces,
  parseToNumber,
  parseAddress,
} = require("./uploadHelper");

function mapStaffAt(value) {
  if (!value) return "";
  if (
    value.trim().toUpperCase() === "ADMIN" ||
    value.trim().toUpperCase() === "REHAB"
  )
    return "ACT";
  return value.trim().toUpperCase();
}

function determineRCI(rciValue) {
  return rciValue?.trim() ? "yes" : "no";
}

function isPermanent(perProValue) {
  return perProValue?.trim().toUpperCase() === "PERMANENT";
}

async function uploadStaff(row) {
  const form = new FormData();
  const { first_name, last_name } = parseFullName(row["NAME"]);
  const address = parseAddress(row["ADDRESS"]);
  form.append("firstName", String(first_name || ""));
  form.append("lastName", String(last_name || ""));
  form.append("email", String(row.EMAIL || ""));
  form.append("dateOfBirth", parseDate(row.DOB));
  form.append("role", String(row.ROLE || ""));
  form.append(
    "gender",
    String(row.Sex || "")
      .trim()
      .toLowerCase()
  );
  form.append(
    "aadhaarNumber",
    removeSpaces(String(row["AADHAR CARD NUMBER"] || ""))
  );
  form.append("phoneNumber", parseToNumber(row["PHONE NUMBER"] || ""));
  form.append("rci", determineRCI(row.RCI));
  form.append("rciNumber", String(row.RCI || ""));
  form.append("validDate", parseDate(row["VALID DATE"]));
  form.append("designation", String(row.DESIGNATION || ""));
  form.append("qualification", String(row.QUALIFICATION || ""));
  form.append("is_permanent", String(isPermanent(row["PER/PRO"])));
  form.append("staffAt", mapStaffAt(row["STAFF AT"] || ""));
  form.append("houseName", String(address.house_name || ""));
  form.append("streetName", String(address.street || ""));
  form.append("city", String(address.city || ""));
  form.append("district", String(address.district || ""));
  form.append("state", String(address.state || ""));
  form.append("pinCode", String(address.postal_code || ""));
  form.append("dateOfJoining", parseDate(row.DOJ));

  // Files
  const filePaths = getFilesForRow(row, "email", "./files/staff_files");
  for (const filePath of filePaths) {
    form.append("files", fs.createReadStream(filePath));
  }

  try {
    const res = await axios.post(`${API_BASE_URL}/staff`, form, {
      headers: HEADERS(form),
    });
    console.log(`✅ Uploaded: ${first_name}`);
  } catch (err) {
    console.error(
      `❌ Failed for: ${row.email}`,
      err.response?.data || err.message
    );
  }
}

function runStaffUpload(filePath = "./data/staffs.csv") {
  const workbook = xlsx.readFile(filePath, {
    cellText: false,
    cellDates: true,
    codepage: 65001,
  });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  return Promise.all(rows.map(uploadStaff));
}

module.exports = { runStaffUpload };
