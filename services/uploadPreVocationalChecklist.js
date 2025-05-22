const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const axios = require("axios");
const { API_BASE_URL, JWT_TOKEN } = require("../config/config");
const { parseExcelDate } = require("./uploadHelper");


const STUDENT_IDS_FILE = path.join(__dirname, "./output/student_ids.xlsx");
const EXCEL_FILE = path.join(
  __dirname,
  "./data/pre_vocational_checklist_with_ids.xlsx"
);

function parseStudentMapping() {
  const workbook = xlsx.readFile(STUDENT_IDS_FILE);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  const studentMap = {};
  rows.forEach((row) => {
    const admissionId = String(row["ADMISSION ID"] || "")
      .trim()
      .replace(/\//g, "-");
    if (admissionId && row["STUDENT ID"]) {
      studentMap[admissionId] = {
        studentId: row["STUDENT ID"],
        firstName: (row["NAME"] || "").split(" ")[0],
        lastName: (row["NAME"] || "").split(" ").slice(1).join(" "),
      };
    }
  });
  return studentMap;
}

function getSkillsArray(row) {
  const skills = [];
  for (let i = 0; i <= 11; i++) {
    const key = `prevocational_skills.skills[${i}]`;
    if (row[key]) skills.push(row[key]);
  }
  return skills;
}

function extractDataFields(row) {
  const data = {};
  Object.keys(row).forEach((key) => {
    if (key.startsWith("prevocational_skills.data.")) {
      const fieldName = key.replace("prevocational_skills.data.", "");
      data[fieldName] = row[key];
    }
  });
  return data;
}

async function uploadStep(studentId, step, payload, method = "put") {
  try {
    const res = await axios({
      method,
      url: `${API_BASE_URL}/students/pre-vocational-check-list/autosave/${studentId}/${step}`,
      headers: {
        Authorization: `Bearer ${JWT_TOKEN}`,
      },
      data: payload,
    });
    console.log(`✅ Step ${step} uploaded for student ${studentId}`);
 
  } catch (err) {
    console.error(
      `❌ Failed at step ${step} for ${studentId}`,
      err.response?.data || err.message
    );
  }
}

async function runPreVocationalChecklistUpload() {
  const studentMap = parseStudentMapping();
  const workbook = xlsx.readFile(EXCEL_FILE, {
    cellText: false,
    cellDates: true,
    codepage: 65001,
  });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  for (const row of rows) {
    const rawId = String(row["STUDENT ID"] || "")
      .trim()
      .replace(/\//g, "-");
    const studentData = studentMap[rawId];
    if (!studentData) {
      console.warn(`⚠️ No mapping found for ${rawId}`);
      continue;
    }

    const { studentId, firstName, lastName } = studentData;
    const dateOfEvaluation = parseExcelDate(
      row["prevocational_skills.data.dateOfEvaluation"]
    );
    const ageGroup = row["prevocational_skills.ageGroup"] || "";
    const skills = getSkillsArray(row);
    const dataFields = extractDataFields(row);

    const basePayload = {
      student_id: studentId,
      firstName,
      lastName,
      ...dataFields,
    };

    // Steps 1-7 use data fields
    for (let step = 1; step <= 7; step++) {
      await uploadStep(studentId, step, basePayload);
    }

    // Step 8 for ageGroup and skills
    await uploadStep(studentId, 8, { age: ageGroup, skills });
  }

  console.log("🎉 Pre-vocational checklist upload complete.");
}

module.exports = { runPreVocationalChecklistUpload };
