const axios = require("axios");
const xlsx = require("xlsx");
const FormData = require("form-data");
const fs = require("fs");

const { parseExcelDate } = require("./uploadHelper");
const { API_BASE_URL, JWT_TOKEN } = require("../config/config");

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

// Step 1: Therapy Goals Mapping
function mapStep1(row) {
  return {
    createdAt: parseExcelDate(row["createdAt"]) || "",
    psychology: {
      presentLevel: row["psychology.presentLevel"] || "",
      shortTermGoal: row["psychology.shortTermGoal"] || "",
      goalsAchieved: row["psychology.goalsAchieved"] || "",
      remarks: row["psychology.remarks"] || "",
      completed_at: parseExcelDate(row["psychology.completed_at"]) || "",
    },
    physiotherapy: {
      presentLevel: row["physiotherapy.presentLevel"] || "",
      shortTermGoal: row["physiotherapy.shortTermGoal"] || "",
      goalsAchieved: row["physiotherapy.goalsAchieved"] || "",
      remarks: row["physiotherapy.remarks"] || "",
      completed_at: parseExcelDate(row["physiotherapy.completed_at"]) || "",
    },
    speechtherapy: {
      presentLevel: row["speechtherapy.presentLevel"] || "",
      shortTermGoal: row["speechtherapy.shortTermGoal"] || "",
      goalsAchieved: row["speechtherapy.goalsAchieved"] || "",
      remarks: row["speechtherapy.remarks"] || "",
      completed_at: parseExcelDate(row["speechtherapy.completed_at"]) || "",
    },
    occupationaltherapy: {
      presentLevel: row["occupationaltherapy.presentLevel"] || "",
      shortTermGoal: row["occupationaltherapy.shortTermGoal"] || "",
      goalsAchieved: row["occupationaltherapy.goalsAchieved"] || "",
      remarks: row["occupationaltherapy.remarks"] || "",
      completed_at:
        parseExcelDate(row["occupationaltherapy.completed_at"]) || "",
    },
  };
}

async function uploadTechnicalTermReport(row) {
  const studentId = row["STUDENT ID"];
  const term = String(row["term"] || "").trim();

  if (!studentId || !term) {
    console.warn(`⚠️ Skipping row without student_id: ${row["Student Name"]}`);
    return;
  }

  const student = await fetchStudentDetails(studentId);
  if (!student) return;

  const step1 = mapStep1(row);

  let assessmentId;

  // Step 1: Create with therapies
  try {
    const res = await axios.post(
      `${API_BASE_URL}/students/technical-report/autosave/1/${term}`,
      { ...step1, student_id: student._id },
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    assessmentId = res.data.data._id;
    console.log(`✅ Step 1 created Technical Term Report ${assessmentId}`);
  } catch (err) {
    console.error(
      `❌ Step 1 creation failed`,
      err.response?.data || err.message
    );
    return;
  }

  // Step 2: Upload documents
  // const filePaths = getFilesForRow(row, "ADMISSION ID", "./files/technical_report");
  // if (filePaths.length > 0) {
  //   const form = new FormData();
  //   for (const filePath of filePaths) {
  //     form.append("files", fs.createReadStream(filePath));
  //   }
  //   try {
  //     await axios.put(
  //       `${API_BASE_URL}/students/technical-report/autosave/${assessmentId}/2`,
  //       form,
  //       {
  //         headers: HEADERS(form),
  //       }
  //     );
  //     console.log(`✅ Step 2 files uploaded for ${assessmentId}`);
  //   } catch (err) {
  //     console.error(`❌ Step 2 file upload failed`, err.response?.data || err.message);
  //   }
  // } else {
  //   console.log(`ℹ️ No files found for Step 2 for ${assessmentId}`);
  // }

  // Final submission
  try {
    await axios.put(
      `${API_BASE_URL}/students/technical-report/submit/${assessmentId}`,
      {},
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    console.log(`🎉 Technical Term Report submitted for ${assessmentId}`);
  } catch (err) {
    console.error(
      `❌ Final submission failed`,
      err.response?.data || err.message
    );
  }
}

async function runTechnicalTermReportUpload(
  filePath = "./output/technical_term_report_with_ids.csv"
) {
  const workbook = xlsx.readFile(filePath, {
    cellText: false,
    cellDates: true,
    codepage: 65001,
  });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  for (const row of rows) {
    await uploadTechnicalTermReport(row);
  }

  console.log("✅ All Technical Term Reports processed");
}

module.exports = { runTechnicalTermReportUpload };
