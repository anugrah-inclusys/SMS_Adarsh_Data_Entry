const axios = require("axios");
const xlsx = require("xlsx");
const FormData = require("form-data");
const {
  parseExcelDate,
  parseFullName,
  getFilesForRow,
} = require("./uploadHelper"); // your helpers
const { API_BASE_URL, JWT_TOKEN, HEADERS } = require("../config/config");
const fs = require("fs");
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

// Step 1 payload (POST creation)
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
    dateOfIEP: parseExcelDate(row["dateOfIEP"]) || null,
    provisionalDiagnosis:
      row["provisionalDiagnosis"] ||
      student?.assessment?.preliminary_diagnosis?.name ||
      "",
    associatedProblems: row["associatedProblems"] || "",
    medication: row["medication"] || "",
    createdAt: parseExcelDate(row["createdAt"]) || "",
  };
}

// Step 2–7 payloads (PUT updates)
function mapStep2(row) {
  return {
    classroomactivitiesacademics: {
      presentLevel: row["classroomactivitiesacademics.presentLevel"] || "",
      longTermGoal: row["classroomactivitiesacademics.longTermGoal"] || "",
      shortTermGoal: row["classroomactivitiesacademics.shortTermGoal"] || "",
    },
  };
}

function mapStep3(row) {
  return {
    adl: {
      presentLevel: row["adl.presentLevel"] || "",
      longTermGoal: row["adl.longTermGoal"] || "",
      shortTermGoal: row["adl.shortTermGoal"] || "",
    },
  };
}

function mapStep4(row) {
  return {
    sensory: {
      presentLevel: row["sensory.presentLevel"] || "",
      longTermGoal: row["sensory.longTermGoal"] || "",
      shortTermGoal: row["sensory.shortTermGoal"] || "",
    },
  };
}

function mapStep5(row) {
  return {
    socialization: {
      presentLevel: row["socialization.presentLevel"] || "",
      longTermGoal: row["socialization.longTermGoal"] || "",
      shortTermGoal: row["socialization.shortTermGoal"] || "",
    },
  };
}

function mapStep6(row) {
  return {
    lifeskills: {
      presentLevel: row["lifeSkills.presentLevel"] || "",
      longTermGoal: row["lifeSkills.longTermGoal"] || "",
      shortTermGoal: row["lifeSkills.shortTermGoal"] || "",
    },
  };
}

function mapStep7(row) {
  return {
    prevocation: {
      presentLevel: row["preVocation.presentLevel"] || "",
      longTermGoal: row["preVocation.longTermGoal"] || "",
      shortTermGoal: row["preVocation.shortTermGoal"] || "",
    },
  };
}

async function uploadSpecialEducationTerm(row) {
  const studentId = row["STUDENT ID"];
  const term = String(row["term"] || "").trim();

  if (!studentId || !term) {
    console.warn(`⚠️ Skipping row: Missing student_id or term`);
    return;
  }

  const student = await fetchStudentDetails(studentId);
  if (!student) return;

  const steps = [
    mapStep1(row, student),
    mapStep2(row),
    mapStep3(row),
    mapStep4(row),
    mapStep5(row),
    mapStep6(row),
    mapStep7(row),
  ];

  let assessmentId;

  try {
    // Step 1: Create Special Education Term (POST)
    const res = await axios.post(
      `${API_BASE_URL}/students/special-education-term/autosave/1/${term}`,
      steps[0],
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    assessmentId = res.data.data._id;
    console.log(
      `✅ Step 1 created Special Education Assessment ${assessmentId}`
    );
  } catch (err) {
    console.error(
      `❌ Failed creating special education assessment`,
      err.response?.data || err.message
    );
    return;
  }

  // Step 2–7 Updates (PUT)
  for (let i = 1; i < steps.length; i++) {
    try {
      await axios.put(
        `${API_BASE_URL}/students/special-education-term/autosave/${assessmentId}/${
          i + 1
        }`,
        steps[i],
        {
          headers: { Authorization: `Bearer ${JWT_TOKEN}` },
        }
      );
      console.log(`✅ Step ${i + 1} updated for ${assessmentId}`);
    } catch (err) {
      console.error(
        `❌ Step ${i + 1} failed for ${assessmentId}`,
        err.response?.data || err.message
      );
    }
  }
  // Step 8: Upload files if available
  const filePaths = getFilesForRow(
    row,
    "ADMISSION ID",
    "./files/special_education_term"
  ); // customize logic if needed
  if (filePaths.length > 0) {
    const form = new FormData();
    for (const filePath of filePaths) {
      form.append("files", fs.createReadStream(filePath));
    }
    try {
      await axios.put(
        `${API_BASE_URL}/students/special-education-term/autosave/${assessmentId}/8`,
        form,
        {
          headers: HEADERS(form),
        }
      );
      console.log(`✅ Step 8 files uploaded for ${assessmentId}`);
    } catch (err) {
      console.error(
        `❌ Step 8 file upload failed for ${assessmentId}`,
        err.response?.data || err.message
      );
    }
  } else {
    console.log(`ℹ️ No files found for Step 8 upload for ${assessmentId}`);
  }

  // Final Submission
  try {
    await axios.put(
      `${API_BASE_URL}/students/special-education-term/submit/${assessmentId}`,
      {},
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    console.log(`🎉 Special Education Term submitted for ${assessmentId}`);
  } catch (err) {
    console.error(
      `❌ Final submission failed for ${assessmentId}`,
      err.response?.data || err.message
    );
  }
}

async function runSpecialEducationTermUpload(
  filePath = "./output/special_education_term_with_ids.csv"
) {
  const workbook = xlsx.readFile(filePath, {
    cellText: false,
    cellDates: true,
    codepage: 65001,
  });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  for (const row of rows) {
    await uploadSpecialEducationTerm(row);
  }

  console.log("✅ All Special Education Term assessments processed");
}

module.exports = { runSpecialEducationTermUpload };
