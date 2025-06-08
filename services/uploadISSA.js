const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const axios = require("axios");
const { parseExcelDate, parseFullName } = require("./uploadHelper");
const { API_BASE_URL, JWT_TOKEN } = require("../config/config");

// Excel paths
const EXCEL_FILE = path.join(
  __dirname,
  "../output/issa_checklist_with_ids.csv"
);

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
function mapStep1(row, student) {
  const { first_name, last_name } = parseFullName(row["Student Name"] || "");
  return {
    student_id: row["_id"] || student?._id || "",
    firstName: first_name || student?.name?.first_name || "",
    lastName: last_name || student?.name?.last_name || "",
    dob:
      parseExcelDate(row["demographicData.dob"]) ||
      student?.date_of_birth ||
      "",
    age: row["demographicData.age"] || student?.age || "",
    examiner: row["issa.demographicData.Examiner"] || "",
  };
}
// Step mapping for sections
const sectionToStep = {
  demographicData: 1,
  socialRelationshipAndReciprocity: 2,
  emotionalResponsiveness: 3,
  speechLanguageAndCommunication: 4,
  behaviorPatterns: 5,
  sensoryAspects: 6,
  cognitiveComponent: 7,
  additionalDetails: 8,
};

// Extract sectioned ISSA data by step
function mapISSAFields(row) {
  const sectionData = {
    0: {},
    1: {},
    2: {},
    3: {},
    4: {},
    5: {},
    6: {},
    7: {},
  };

  Object.entries(row).forEach(([key, value]) => {
    const match = key.match(/^issa\.(\w+)\.(.+)$/);
    if (match) {
      const [, section, field] = match;
      const step = sectionToStep[section];
      if (step !== undefined) {
        sectionData[step - 1][field] = value || "";
      }
    }
  });

  return sectionData;
}

// Upload each step
async function uploadStep(studentId, step, data) {
  let assessmentId;
  try {
    const res = await axios.put(
      `${API_BASE_URL}/students/issa/autosave/${studentId}/${step}`,
      { [step - 1]: data },
      {
        headers: {
          Authorization: `Bearer ${JWT_TOKEN}`,
        },
      }
    );
    console.log(`✅ Step ${step} uploaded for ${studentId}`);
    return (assessmentId = res.data.data._id);
  } catch (err) {
    console.error(
      `❌ Failed to upload step ${step} for ${studentId}`,
      err.response?.data || err.message
    );
  }
}

// Final submission
async function submitISSA(finalPayload, assessmentId, row) {
  try {
    await axios.put(
      `${API_BASE_URL}/students/issa/submit/${assessmentId}`,
      finalPayload,
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    console.log(`🎉 Submitted ISSA for ${row["Student Name"]}`);
  } catch (err) {
    console.error(
      `❌ Failed to submit ISSA for ${assessmentId}`,
      err.response?.data || err.message
    );
  }
}

// Main runner
async function runISSAUpload() {
  const workbook = xlsx.readFile(EXCEL_FILE);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  for (const row of rows) {
    const studentId = (row["STUDENT ID"] || "").trim();
    if (!studentId) {
      console.warn(
        `⚠️ Skipping row without student_id: ${row["Student Name"]}`
      );
      continue;
    }

    const student = await fetchStudentDetails(studentId);
    const sections = mapISSAFields(row);
    // Inject demographicData into Step 1 payload
    const demographicData = mapStep1(row, student);
    sections[0] = {
      ...sections[0],
      ...demographicData,
    };
    let assessmentId;
    for (let step = 1; step <= 8; step++) {
      assessmentId = await uploadStep(studentId, step, sections[step - 1]);
    }

    const finalPayload = {
      issa: {
        demographicData: mapStep1(row, student),
        additionalDetails: sections[7],
      },
    };

    if (row["createdAt"]) {
      finalPayload.issa.createdAt = parseExcelDate(row["createdAt"]);
    }

    await submitISSA(finalPayload, assessmentId, row);
  }

  console.log("✅ All ISSA records processed");
}

module.exports = { runISSAUpload };
