const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const axios = require("axios");
const FormData = require("form-data");
const { API_BASE_URL, JWT_TOKEN } = require("../config/config");
const { excelDateToYMD } = require("./uploadHelper");

const TDSC_DIR = path.join(__dirname, "../files/tdsc");
const STUDENT_IDS_FILE = path.join(__dirname, "../output/student_ids.xlsx");
const TDSC_DATE_FILE = path.join(__dirname, "../output/tdsc_with_ids.csv");
function parseStudentMapping() {
  const workbook = xlsx.readFile(STUDENT_IDS_FILE);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  const studentMap = {};
  rows.forEach((row) => {
    if (row["ADMISSION_ID"] && row["STUDENT_ID"]) {
      const normalizedAdmissionId = row["ADMISSION_ID"]
        .toString()
        .trim()
        .replace(/\//g, "-");
      studentMap[normalizedAdmissionId] = {
        studentId: row["STUDENT_ID"],
        name: row["NAME"] || "",
      };
    }
  });
  return studentMap;
}

function parseTdscDates() {
  const workbook = xlsx.readFile(TDSC_DATE_FILE);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  const dateMap = {};
  rows.forEach((row) => {
    if (row["ADMISSION ID"] && row["tdsc.date"]) {
      const normalizedAdmissionId = row["ADMISSION ID"]
        .toString()
        .trim()
        .replace(/\//g, "-");
      dateMap[normalizedAdmissionId] = excelDateToYMD(row["tdsc.date"]);
    }
  });
  return dateMap;
}

async function uploadTdscFile(
  studentId,
  filePath,
  fileName = "Not Available",
  date = ""
) {
  if (!fs.existsSync(filePath)) {
    console.error(`🚫 File not found: ${filePath}`);
    return;
  }
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));
  form.append("description", fileName);
  form.append("date", date);

  try {
    const res = await axios.post(
      `${API_BASE_URL}/students/tdsc/${studentId}`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${JWT_TOKEN}`,
        },
      }
    );
    console.log(`✅ Uploaded: ${fileName} → student ${studentId}`);
  } catch (err) {
    console.error(
      `❌ Failed to upload ${fileName} for ${studentId}`,
      err.response?.data || err.message
    );
  }
}

async function runTdscFileUpload() {
  const studentMap = parseStudentMapping();
  const dateMap = parseTdscDates();
  const files = fs.readdirSync(TDSC_DIR);
  for (const file of files) {
    const matchedAdmissionId = Object.keys(studentMap).find((admissionId) =>
      file.includes(admissionId)
    );

    if (!matchedAdmissionId) {
      console.warn(`⚠️ No matching admission ID found in file name: ${file}`);
      fs.appendFileSync("skipped_tdsc_files.log", `${file}\n`);
      continue;
    }

    const studentData = studentMap[matchedAdmissionId];
    if (!studentData) {
      console.warn(
        `⚠️ No student data for Admission ID: ${matchedAdmissionId}`
      );
      continue;
    }

    const filePath = path.join(TDSC_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      continue;
    }

    const tdscDate = dateMap[matchedAdmissionId];

    try {
      await uploadTdscFile(studentData.studentId, filePath, file, tdscDate);
    } catch (err) {
      console.error(`🚨 Upload failed for ${file}:`, err.message);
    }
  }

  console.log("🎉 All TDSC files processed and uploaded.");
}

module.exports = { runTdscFileUpload };
