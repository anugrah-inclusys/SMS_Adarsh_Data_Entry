const axios = require("axios");
const xlsx = require("xlsx");
const { parseFullName, parseExcelDate } = require("./uploadHelper");
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

function mapSkills(row, tabsStructure) {
  const result = {};
  tabsStructure.forEach((domain) => {
    result[domain] = {};
    Object.keys(row).forEach((key) => {
      const match = key.match(
        new RegExp(
          `life_skills\\.${domain}\\.(.+?)\\.(term1|term2|descriptionTerm1|descriptionTerm2)`
        )
      );
      if (match) {
        const skill = match[1].trim();
        const field = match[2];
        if (!result[domain][skill]) {
          result[domain][skill] = {
            term1: "",
            term2: "",
            descriptionTerm1: "",
            descriptionTerm2: "",
          };
        }
        result[domain][skill][field] = row[key] || "";
      }
    });
  });
  return result;
}

async function uploadLifeSkillsChecklist(row, tabsStructure, term = "term1") {
  const studentId = row["STUDENT ID"];
  if (!studentId) {
    console.warn(`⚠️ Skipping row without student_id: ${row["Student Name"]}`);
    return;
  }

  const student = await fetchStudentDetails(studentId);
  if (!student) return;

  const { first_name, last_name } = parseFullName(row["Student Name"] || "");
  const ageGroup = row["ageGroup"] || "";
  const createdAt = parseExcelDate(row["createdAt"]);

  const basePayload = {
    student_id: student._id,
    firstName: first_name,
    lastName: last_name,
    createdAt,
    ageGroup,
  };

  const skillsData = mapSkills(row, tabsStructure);

  let checklistId;

  // Step 1 - Create
  try {
    const payload = {
      ...basePayload,
      ...skillsData,
    };

    const res = await axios.post(
      `${API_BASE_URL}/students/life-skills/autosave/${studentId}/1?term=${term}`,
      payload,
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    checklistId = res.data.data._id;
    console.log(
      `✅ Created life skills checklist for ${studentId} with ID ${checklistId}`
    );
  } catch (err) {
    console.error(
      `❌ Failed to create life skills checklist for ${studentId}`,
      err.response?.data || err.message
    );
    return;
  }

  // Submit Final
  try {
    await axios.put(
      `${API_BASE_URL}/students/life-skills/submit/${checklistId}`,
      { life_skills: skillsData },
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    console.log(`🎉 Life skills checklist submitted for ${row["Student Name"]}`);
  } catch (err) {
    console.error(
      `❌ Final submission failed for ${checklistId}`,
      err.response?.data || err.message
    );
  }
}

async function runLifeSkillsChecklistUpload(
  filePath = "./output/life_skills_checklist_with_ids.csv"
) {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  const tabsStructure = [
    "SELF CARE",
    "DAILY LIVING SKILLS",
    "DOMESTIC SKILLS",
    "TIME MANAGEMENT",
    "MONEY MANAGEMENT",
    "COMMUNITY ORIENTATION",
    "FUNCTIONAL READING",
    "FUNCTIONAL WRITING",
    "RECREATIONAL & LEISURE TIME ACTIVITIES",
    "PRE-VOCATIONAL SKILLS",
    "SHOPPING SKILLS",
  ];

  for (const row of rows) {
    await uploadLifeSkillsChecklist(row, tabsStructure, "term1");
  }

  console.log("✅ All life skills checklist records processed");
}

module.exports = { runLifeSkillsChecklistUpload };
