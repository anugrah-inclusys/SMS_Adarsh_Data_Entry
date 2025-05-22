const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const axios = require("axios");
const FormData = require("form-data");
const { API_BASE_URL, JWT_TOKEN } = require("../config/config");
const { excelDateToYMD } = require("./uploadHelper");

const LEST_DIR = path.join(__dirname, "../files/lest");
const STUDENT_IDS_FILE = path.join(__dirname, "../output/student_ids.xlsx");
const LEST_DATE_FILE = path.join(__dirname, "../output/lest_with_ids.csv");

function parseStudentMapping() {
  const workbook = xlsx.readFile(STUDENT_IDS_FILE);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  const studentMap = {};
  rows.forEach((row) => {
    if (row["ADMISSION ID"] && row["STUDENT ID"]) {
      const normalizedAdmissionId = row["ADMISSION ID"]
        .toString()
        .trim()
        .replace(/\//g, "-");
      studentMap[normalizedAdmissionId] = {
        studentId: row["STUDENT ID"],
        name: row["NAME"] || "",
      };
    }
  });

  // Add debug log to verify
  return studentMap;
}

function parseLestDates() {
  const workbook = xlsx.readFile(LEST_DATE_FILE);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  const dateMap = {};
  rows.forEach((row) => {
    if (row["ADMISSION ID"] && row["lest.date"]) {
      const normalizedAdmissionId = row["ADMISSION ID"]
        .toString()
        .trim()
        .replace(/\//g, "-");
      dateMap[normalizedAdmissionId] = excelDateToYMD(row["lest.date"]);
    }
  });
  return dateMap;
}

async function uploadLestFile(
  studentId,
  filePath,
  fileName = "Not Available",
  date
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
      `${API_BASE_URL}/students/lest/${studentId}`,
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

async function runLestFileUpload() {
  const studentMap = parseStudentMapping();
  const dateMap = parseLestDates();
  const files = fs.readdirSync(LEST_DIR);

  for (const file of files) {
    const matchedAdmissionId = Object.keys(studentMap).find((admissionId) =>
      file.includes(admissionId)
    );
    console.log(`🔍 Checking file: ${file}`);
    if (!matchedAdmissionId) {
      console.warn(`⚠️ No matching admission ID found in file name: ${file}`);
      fs.appendFileSync("skipped_lest_files.log", `${file}\n`);
      continue;
    }

    const studentData = studentMap[matchedAdmissionId];
    const lestDate = dateMap[matchedAdmissionId];
    const filePath = path.join(LEST_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`❗ File does not exist at path: ${filePath}`);
      continue;
    }

    await uploadLestFile(studentData.studentId, filePath, file, lestDate);
  }

  console.log("🎉 All LEST files processed and uploaded.");
}

module.exports = { runLestFileUpload };
