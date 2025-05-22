const axios = require("axios");
const xlsx = require("xlsx");
const { API_BASE_URL, JWT_TOKEN } = require("../config/config");
const { parseFullName, parseExcelDate } = require("./uploadHelper");

const DOMAIN_MAP = [
  "personal",
  "communication",
  "socialBehaviour",
  "functionalAcademics",
  "safetySkills",
  "domesticBehaviour",
  "mobilityAndHandFunctioning",
  "occupationalSkills",
  "summary",
  "specialInterestAndAptitudeObservedInTheTrainee",
];

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

function extractStepData(row, domain, stepIndex) {
  const result = {};
  Object.keys(row).forEach((key) => {
    if (key.startsWith(`genericSkills.${domain}.`)) {
      const field = key.replace(`genericSkills.${domain}.`, "");
      result[field] = row[key] || "";
    }
  });
  return { [stepIndex]: result };
}

async function uploadGenericSkills(row) {
  const studentId = row["STUDENT ID"];
  if (!studentId) {
    console.warn(`⚠️ Skipping row without student_id: ${row["Student Name"]}`);
    return;
  }

  const student = await fetchStudentDetails(studentId);
  if (!student) return;

  const { first_name, last_name } = parseFullName(row["Student Name"] || "");

  let formId;

  // Step 1 - Create entry with step 1 (personal)
  try {
    const stepData = extractStepData(row, DOMAIN_MAP[0], 0);
    const payload = {
      student_id: student._id,
            createdAt: parseExcelDate(row["createdAt"]) ||  "",
      ...stepData,
    };

    const res = await axios.post(
      `${API_BASE_URL}/students/genericSkills/autosave/${studentId}/1`,
      payload,
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );

    formId = res.data.data._id;
    console.log(`✅ Created generic skills entry for ${studentId} with ID ${formId}`);
  } catch (err) {
    console.error(`❌ Failed to create generic skills entry`, err.response?.data || err.message);
    return;
  }

  // Step 2–10 - Autosave
  for (let step = 2; step <= 10; step++) {
    const domain = DOMAIN_MAP[step - 1];
    const stepData = extractStepData(row, domain, step - 1);
    try {
      await axios.put(
        `${API_BASE_URL}/students/genericSkills/autosave/${studentId}/${step}`,
        stepData,
        {
          headers: { Authorization: `Bearer ${JWT_TOKEN}` },
        }
      );
      console.log(`✔️ Step ${step} (${domain}) autosaved for ${formId}`);
    } catch (err) {
      console.error(`❌ Step ${step} (${domain}) failed`, err.response?.data || err.message);
    }
  }

  // Final Submit
  try {
    const finalPayload = { genericSkills: {} };
    DOMAIN_MAP.forEach((domain) => {
      finalPayload.genericSkills[domain] = extractStepData(row, domain, 0)[0];
    });

    await axios.put(
      `${API_BASE_URL}/students/genericSkills/submit/${formId}`,
      finalPayload,
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    console.log(`🎉 Submitted generic skills form for ${formId}`);
  } catch (err) {
    console.error(`❌ Final submission failed`, err.response?.data || err.message);
  }
}

async function runGenericSkillsUpload(filePath = "./output/generic_tool_with_ids.csv") {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  for (const row of rows) {
    await uploadGenericSkills(row);
  }

  console.log("✅ All generic skills records processed");
}

module.exports = { runGenericSkillsUpload };
