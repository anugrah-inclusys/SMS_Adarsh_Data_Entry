const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const axios = require("axios");
const FormData = require("form-data");
const { API_BASE_URL, JWT_TOKEN } = require("../config/config");

const MEDICAL_FILES_DIR = path.join(__dirname, "../files/medical_files");
const STUDENT_IDS_FILE = path.join(__dirname, "../output/student_ids.xlsx");

function parseStudentMapping() {
  const workbook = xlsx.readFile(STUDENT_IDS_FILE);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  const studentMap = {};
  rows.forEach((row) => {
    const admissionIdRaw = row["ADMISSION_ID"] || row["ADMISSION ID"];
    const studentId = row["STUDENT_ID"] || row["STUDENT ID"];
    const name = row["NAME"] || row["Student Name"] || "";

    if (admissionIdRaw && studentId) {
      const normalizedAdmissionId = admissionIdRaw
        .toString()
        .trim()
        .replace(/\//g, "-");
      studentMap[normalizedAdmissionId] = {
        studentId,
        name,
      };
    }
  });
  return studentMap;
}

async function uploadMedicalFile(studentId, filePath, fileName) {
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));
  form.append("description", fileName);
  form.append("date", new Date().toISOString());

  try {
    const res = await axios.post(
      `${API_BASE_URL}/students/medical-file/${studentId}`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${JWT_TOKEN}`,
        },
      }
    );
    console.log(`✅ Uploaded file for student ${studentId}: ${fileName}`);
  } catch (err) {
    console.error(
      `❌ Failed to upload ${fileName} for ${studentId}`,
      err.response?.data || err.message
    );
  }
}

async function runMedicalFilesUpload() {
  const studentMap = parseStudentMapping();
  const folders = fs.readdirSync(MEDICAL_FILES_DIR);

  for (const folderName of folders) {
    const folderPath = path.join(MEDICAL_FILES_DIR, folderName);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const studentData = studentMap[folderName];
    console.log(
      `📁 Found folder: ${folderName} → student: ${
        studentData?.name || "❌ Not found"
      }`
    );
    if (!studentData) {
      console.warn(
        `⚠️ No student mapping found for admission ID: ${folderName}`
      );
      continue;
    }

    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      await uploadMedicalFile(studentData.studentId, filePath, file);
    }
  }

  console.log("🎉 All medical files processed and uploaded.");
}

module.exports = { runMedicalFilesUpload };
