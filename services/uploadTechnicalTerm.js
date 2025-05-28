const axios = require("axios");
const xlsx = require("xlsx");
const FormData = require("form-data");
const fs = require("fs");

const {
  parseExcelDate,
  parseFullName,
  getFilesForRow,
} = require("./uploadHelper");
const { API_BASE_URL, JWT_TOKEN, HEADERS } = require("../config/config");

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

// Step 1 mapping
function mapStep1(row, student) {
  const { first_name, last_name } = parseFullName(row["Student Name"] || "");
  return {
    student_id: row["student_id"] || student?._id || "",
    name:
      `${student?.name?.first_name} ${student?.name?.last_name}` ||
      `${first_name} ${last_name}` ||
      "",
    age: row["age"] || student?.age || "",
    dob: parseExcelDate(row["dob"]) || student?.date_of_birth || null,
  };
}

// Step 2 mapping
function mapStep2(row, student) {
  return {
    student_id: row["student_id"] || student?._id || "",
    createdAt: parseExcelDate(row["createdAt"]) || "",
    psychology: {
      presentLevel: row["psychology.presentLevel"] || "",
      longTermGoal: row["psychology.longTermGoal"] || "",
      shortTermGoal: row["psychology.shortTermGoal"] || "",
      completed_at: parseExcelDate(row["psychology.completed_at"]) || "",
    },
    physiotherapy: {
      presentLevel: row["physiotherapy.presentLevel"] || "",
      longTermGoal: row["physiotherapy.longTermGoal"] || "",
      shortTermGoal: row["physiotherapy.shortTermGoal"] || "",
       completed_at: parseExcelDate(row["physiotherapy.completed_at"]) || "",
    },
    speechtherapy: {
      presentLevel: row["speechtherapy.presentLevel"] || "",
      longTermGoal: row["speechtherapy.longTermGoal"] || "",
      shortTermGoal: row["speechtherapy.shortTermGoal"] || "",
       completed_at: parseExcelDate(row["speechtherapy.completed_at"]) || "",
    },
    occupationaltherapy: {
      presentLevel: row["occupationaltherapy.presentLevel"] || "",
      longTermGoal: row["occupationaltherapy.longTermGoal"] || "",
      shortTermGoal: row["occupationaltherapy.shortTermGoal"] || "",
       completed_at: parseExcelDate(row["occupationaltherapy.completed_at"]) || "",
    },
  };
}

async function uploadTechnicalTerm(row) {
  const studentId = row["STUDENT ID"];
  const term = String(row["term"] || "").trim();

  if (!studentId || !term) {
    console.warn(`⚠️ Skipping row without student_id: ${row["Student Name"]}`);
    return;
  }

  const student = await fetchStudentDetails(studentId);
  if (!student) return;

  const steps = [mapStep1(row, student), mapStep2(row, student)];

  let assessmentId;

  // Step 1: Create
  try {
    const res = await axios.post(
      `${API_BASE_URL}/students/technical-term/autosave/1/${term}`,
      steps[1],
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    assessmentId = res.data.data._id;
    console.log(`✅ Step 1 created Technical Term Assessment ${assessmentId}`);
  } catch (err) {
    console.error(
      `❌ Step 1 creation failed`,
      err.response?.data || err.message
    );
    return;
  }

  // Step 2: File Upload
  const filePaths = getFilesForRow(
    row,
    "ADMISSION ID",
    "./files/technical_term"
  );
  if (filePaths.length > 0) {
    const form = new FormData();
    for (const filePath of filePaths) {
      form.append("files", fs.createReadStream(filePath));
    }
    try {
      await axios.put(
        `${API_BASE_URL}/students/technical-term/autosave/${assessmentId}/2`,
        form,
        {
          headers: HEADERS(form),
        }
      );
      console.log(`✅ Step 3 files uploaded for ${assessmentId}`);
    } catch (err) {
      console.error(
        `❌ Step 3 file upload failed`,
        err.response?.data || err.message
      );
    }
  } else {
    console.log(`ℹ️ No files found for Step 3 for ${assessmentId}`);
  }

  // Final submission
  try {
    await axios.put(
      `${API_BASE_URL}/students/technical-term/submit/${assessmentId}`,
      {},
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    console.log(`🎉 Technical Term Assessment submitted for ${assessmentId}`);
  } catch (err) {
    console.error(
      `❌ Final submission failed`,
      err.response?.data || err.message
    );
  }
}

async function runTechnicalTermUpload(
  filePath = "./output/technical_term_assessment_with_ids.csv"
) {
  const workbook = xlsx.readFile(filePath, {
    cellText: false,
    cellDates: true,
    codepage: 65001,
  });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  for (const row of rows) {
    await uploadTechnicalTerm(row);
  }

  console.log("✅ All Technical Term Assessments processed");
}

module.exports = { runTechnicalTermUpload };
