const axios = require("axios");
const FormData = require("form-data");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const { API_BASE_URL, HEADERS } = require("../config/config");
const { parseExcelDate, getFilesForRow } = require("./uploadHelper");

async function uploadStaff(row) {
  const form = new FormData();

  form.append("firstName", String(row.first_name || ""));
  form.append("lastName", String(row.last_name || ""));
  form.append("email", String(row.email || ""));
  form.append("phoneNumber", String(row.phone || ""));
  form.append("aadhaarNumber", String(row.aadhaar || ""));
  form.append("gender", String(row.gender || ""));
  form.append("role", String(row.role || ""));
  form.append("qualification", String(row.qualification || ""));
  form.append("rci", String(row.RCI || ""));
  form.append("rciNumber", String(row.RCINumber || ""));
  form.append("designation", String(row.designation || ""));
  form.append("is_permanent", String(row.is_permanent === "TRUE"));
  form.append("staffAt", String(row.staff_at || ""));
  form.append("houseName", String(row.houseName || ""));
  form.append("streetName", String(row.streetName || ""));
  form.append("city", String(row.city || ""));
  form.append("district", String(row.district || ""));
  form.append("state", String(row.state || ""));
  form.append("pinCode", String(row.pinCode || ""));
  form.append("school_id", String(row.school_id || ""));
  form.append("isActive", String(row.isActive === "TRUE"));
  form.append("is_deleted", String(row.is_deleted === "TRUE"));
  form.append("is_disentroll", String(row.is_disentroll === "TRUE"));
  form.append("dateOfBirth", parseExcelDate(row.date_of_birth));
  form.append("validDate", parseExcelDate(row.valid_date));
  form.append("dateOfJoining", parseExcelDate(row.date_of_joining));
  form.append("createdAt", parseExcelDate(row.createdAt));
  form.append("updatedAt", parseExcelDate(row.updatedAt));

  // Files
  const filePaths = getFilesForRow(row, "email", "./files/staff_files");
  for (const filePath of filePaths) {
    form.append("files", fs.createReadStream(filePath));
  }

  try {
    const res = await axios.post(`${API_BASE_URL}/staff`, form, {
      headers: HEADERS(form),
    });
    console.log(`✅ Uploaded: ${row.email}`);
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
