const axios = require("axios");
const xlsx = require("xlsx");
const { parseFullName, parseExcelDate } = require("./uploadHelper");
const { API_BASE_URL, JWT_TOKEN } = require("../config/config");

const ageGroupContent = {
  "0-3 years": [
    "Social smile",
    "Eye contact",
    "Wishing (good morning, thank you) etc...",
    "Gestures to convey information",
    "Response",
    "Listening skill",
    "Self- introduction",
    "Sharing",
    "Peer group interaction",
  ],
  "3-6 years": [
    "Self-awareness",
    "Turn taking or waiting patiently",
    "Perform the activity requested from teacher/parent",
    "Names body parts pointed to",
    "Hobbies (music/dance)",
    "Self Introduction",
    "Understanding anger",
    "Tone of voice",
  ],
  "6-9 years": [
    "Takes care of his own belongings in school (school bag, lunch box, water bottle) etc...",
    "Convey the messages properly",
    "Following instructions",
    "Planning what to say",
    "Using manners (food waste, classroom door, windows) etc...",
    "Plays a game successfully",
    "Identify likes and dislikes",
    "Identifies emotions in self",
    "Identifies emotions of others",
    "Keeping calm",
    "Talking to others when upset",
    "Maintaining a conversation",
    "Offering help",
    "Appropriate touch",
    "Dealing with rumours",
  ],
  "9-13 years": [
    "Respect others",
    "To help others",
    "Body shaming",
    "Social services",
    "Well dressing",
    "Body touch",
    "Self confidence",
    "Social distance/personal space",
    "Actively manages illness",
    "To know danger and hazards in situation",
    "Identifying and describing problems",
    "Generalizing solutions",
    "Traffic rules",
    "To know about first aid",
    "Asking for help what you need",
    "Initiate conversation when it is appropriate to do so",
    "Seeks help from peers",
    "Accepting no for an answer",
    "Accepting criticism",
    "Asserting yourself",
  ],
  "13-19 years": [
    'Saving budget',
    'Money management',
    'Paying bill',
    'Dealing with family problem',
    'Dealing with making a mistake',
    'Trying when work is hard',
    'Trying something new',
    'Shifting topics'
  ],
};

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

function mapStep1(row, student, studentId) {
  const { first_name, last_name } = parseFullName(row["Student Name"] || "");
  return {
    student_id: row["STUDENT ID"] || student?._id || studentId,
    firstName: first_name || student?.name?.first_name || "",
    lastName: last_name || student?.name?.last_name || "",
    ageGroup: "",
    createdAt: parseExcelDate(row["social_skills.createdAt"]) || "",
  };
}

function mapStep2(row, studentId) {
  const allSkills = {};
  for (const [group, skills] of Object.entries(ageGroupContent)) {
    for (const skill of skills) {
      const key = `social_skills.${skill}`;
      if (row.hasOwnProperty(key)) {
        allSkills[skill] = row[key] || "";
      }
    }
  }
  return {
    student_id: studentId,
    social_skills: allSkills,
  };
}

async function uploadSocialSkillsChecklist(row) {
  const studentId = row["STUDENT ID"];
  if (!studentId) {
    console.warn(`⚠️ Skipping row without student_id: ${row["Student Name"]}`);
    return;
  }
  const student = await fetchStudentDetails(studentId);
  if (!student) return;
  const step1 = mapStep1(row, student, studentId);
  const step2 = mapStep2(row, studentId);
  let assessmentId;
  try {
    const res = await axios.post(
      `${API_BASE_URL}/students/social-skills-check-list/autosave/${studentId}/1`,
      step1,
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );
    assessmentId = res.data.data._id;
    console.log(`✅ Step 1 uploaded for  ${student.name.first_name}`);
  } catch (err) {
    console.error(`❌ Step 1 failed`, err.response?.data || err.message);
    return;
  }

  try {
    await axios.put(
      `${API_BASE_URL}/students/social-skills-check-list/autosave/${studentId}/2`,
      step2,
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );
    console.log(`✅ Step 2 uploaded for  ${student.name.first_name}`);
  } catch (err) {
    console.error(`❌ Step 2 failed`, err.response?.data || err.message);
    return;
  }

  try {
    await axios.put(
      `${API_BASE_URL}/students/social-skills-check-list/submit/${assessmentId}`,
      {},
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );
    console.log(
      `🎉 Social Skills Checklist submitted for  ${student.name.first_name}`
    );
  } catch (err) {
    console.error(
      `❌ Final Submission failed`,
      err.response?.data || err.message
    );
  }
}

async function runSocialSkillsChecklistUpload(
  filePath = "./output/social_skills_checklist_with_ids.csv"
) {
  const workbook = xlsx.readFile(filePath, {
    cellText: false,
    cellDates: true,
    codepage: 65001,
  });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  for (const row of rows) {
    await uploadSocialSkillsChecklist(row);
  }

  console.log("✅ All Social Skills Checklist records processed");
}

module.exports = { runSocialSkillsChecklistUpload };
