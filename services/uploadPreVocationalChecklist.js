const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const axios = require("axios");
const { API_BASE_URL, JWT_TOKEN } = require("../config/config");
const { parseExcelDate } = require("./uploadHelper");

const EXCEL_FILE = path.join(
  __dirname,
  "../output/pre_vocational_checklist_with_ids.csv"
);

// Fetch full student record from /enquiry/:id
async function fetchStudentDetails(studentId) {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/students/enquiry/${studentId}`,
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    return res.data;
  } catch (err) {
    console.error(
      `❌ Failed fetching student: ${studentId}`,
      err.response?.data || err.message
    );
    return null;
  }
}

// Extract all skills[0-11] into an array
function getSkillsArray(row) {
  const skills = [];
  for (let i = 0; i <= 11; i++) {
    const key = `prevocational_skills.skills[${i}]`;
    if (row[key]) skills.push(row[key]);
  }
  return skills;
}

// Extract all field entries under prevocational_skills.data.*
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
async function uploadInitial(studentId, student, payload) {
  let assessmentId;
  try {
    const res = await axios.post(
      `${API_BASE_URL}/students/pre-vocational-check-list/autosave/${studentId}/1`,
      payload,
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );
    console.log(`✅ Step 1 uploaded for  ${student.name.first_name}`);
    return (assessmentId = res.data.data._id);
  } catch (err) {
    console.error(`❌ Step 1 failed`, err.response?.data || err.message);
    return;
  }
}
async function uploadSubmit(assessmentId, student) {
  try {
    await axios.put(
      `${API_BASE_URL}/students/pre-vocational-check-list/submit/${assessmentId}`,
      {},
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );
    console.log(
      `🎉 Pre vocational Checklist submitted for  ${student.name.first_name}`
    );
  } catch (err) {
    console.error(
      `❌ Final Submission failed`,
      err.response?.data || err.message
    );
  }
}
// Upload a single step (1-8)
async function uploadStep(studentId, step, payload) {
  try {
    const res = await axios.put(
      `${API_BASE_URL}/students/pre-vocational-check-list/autosave/${studentId}/${step}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${JWT_TOKEN}`,
        },
      }
    );
    console.log(`✅ Step ${step} uploaded for ${studentId}`);
  } catch (err) {
    console.error(
      `❌ Failed at step ${step} for ${studentId}`,
      err.response?.data || err.message
    );
  }
}

// Main runner
async function runPreVocationalChecklistUpload() {
  const workbook = xlsx.readFile(EXCEL_FILE, {
    cellText: false,
    cellDates: true,
    codepage: 65001,
  });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  for (const row of rows) {
    const studentId = String(row["STUDENT ID"] || "").trim();
    if (!studentId) {
      console.warn(
        `⚠️ Skipping row without student_id: ${row["Student Name"]}`
      );
      continue;
    }

    const student = await fetchStudentDetails(studentId);
    if (!student) continue;

    const firstName = student?.name?.first_name || "";
    const lastName = student?.name?.last_name || "";
    const ageGroup = row["prevocational_skills.ageGroup"] || "";
    const skills = getSkillsArray(row);
    const dataFields = extractDataFields(row);
    const dateOfEvaluation = parseExcelDate(
      row["prevocational_skills.data.dateOfEvaluation"]
    );
    const createdAt =
      parseExcelDate(row["prevocational_skills.createdAt"]) || "";
    const basePayload = {
      student_id: studentId,
      firstName,
      lastName,
      ...dataFields,
      dateOfEvaluation,
      createdAt,
    };
    const assessmentId = await uploadInitial(studentId, student, basePayload);
    await uploadSubmit(assessmentId, student);
    // Step 1-7: data fields
    for (let step = 1; step <= 7; step++) {
      await uploadStep(studentId, step, basePayload);
    }

    // Step 8: skills + age group
    await uploadStep(studentId, 8, { age: ageGroup, skills });
  }

  console.log("🎉 Pre-vocational checklist upload complete.");
}

module.exports = { runPreVocationalChecklistUpload };
