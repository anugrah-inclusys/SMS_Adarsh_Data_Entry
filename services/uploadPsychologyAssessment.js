const axios = require("axios");
const xlsx = require("xlsx");
const fs = require("fs");
const FormData = require("form-data");
const { API_BASE_URL, JWT_TOKEN } = require("../config/config");
const {
  getTodayDate,
  excelDateToYMD,
  cleanRangeString,
} = require("./uploadHelper");

async function uploadPsychologyAssessment(row) {
  const studentId = row["Student ID"] || row["STUDENT ID"];
  if (!studentId) {
    console.warn(`⚠️ Skipping row without Student ID: ${row["Student Name"]}`);
    return;
  }

  let assessmentId = "";
  try {
    let createdAt = row["createdAt"];
    if (typeof createdAt === "number") {
      createdAt = excelDateToYMD(createdAt);
    }
    if (!createdAt) {
      createdAt = getTodayDate();
    }

    const res = await axios.post(
      `${API_BASE_URL}/students/psychological-assessment/autosave/1`,
      {
        student_id: studentId,
        informant: row["content.general_information.informant"] || "",
        relation: row["content.general_information.relation"] || "",
        familyType: row["content.general_information.familyType"] || "",
        createdAt,
      },
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );

    assessmentId = res.data.data._id;
    console.log(
      `✅ Step 1 created psychology assessment for ${row["Student Name"]}`
    );
  } catch (err) {
    console.error(
      `❌ Step 1 failed for ${row["Student Name"]}`,
      err.response?.data || err.message
    );
    return;
  }

  const steps = [
    {
      step: 2,
      payload: {
        complaintsDetails:
          row["content.presenting_complaints.complaintsDetails"] || "",
      },
    },
    {
      step: 3,
      payload: {
        nameOfSchool: row["content.educational_history.nameOfSchool"] || "",
        class: row["content.educational_history.class"] || "",
        attendance: row["content.educational_history.attendance"] || "",
        medium: row["content.educational_history.medium"] || "",
      },
    },
    {
      step: 4,
      payload: {
        reading: row["content.academic_skills.reading"],
        writing: row["content.academic_skills.writing"],
        counting:
          cleanRangeString(row["content.academic_skills.counting"]) || "",
        academicReadiness: row["content.academic_skills.academicReadiness"],
        coCurricularActivities:
          row["content.academic_skills.coCurricularActivities"],
      },
    },

    {
      step: 5,
      payload: {
        generalAppearance:
          row["content.mental_status_examination.generalAppearance"] || "",
        thought: row["content.mental_status_examination.thought"] || "",
        perception: row["content.mental_status_examination.perception"] || "",
        moodAndTemperament:
          row["content.mental_status_examination.moodAndTemperament"] || "",
      },
    },
    {
      step: 6,
      payload: {
        attentionAndConcentration:
          row["content.cognitive_functioning.attentionAndConcentration"] || "",
        orientation: row["content.cognitive_functioning.orientation"] || "",
        memory: row["content.cognitive_functioning.memory"] || "",
        intelligence: row["content.cognitive_functioning.intelligence"] || "",
        comprehension: row["content.cognitive_functioning.comprehension"] || "",
        playSkills: row["content.cognitive_functioning.playSkills"] || "",
      },
    },
    {
      step: 7,
      payload: {
        judgement: row["content.abstract_ability.judgement"] || "",
        insight: row["content.abstract_ability.insight"] || "",
      },
    },
    {
      step: 8,
      payload: {
        affectionAndEmotionalControl:
          row[
            "content.social_and_emotional_skills.affectionAndEmotionalControl"
          ] || "",
        conductAndBehaviorControl:
          row[
            "content.social_and_emotional_skills.conductAndBehaviorControl"
          ] || "",
      },
    },
    {
      step: 9,
      payload: {
        speechAndLanguageDetails:
          row["content.speech_and_language_skills.speechAndLanguageDetails"] ||
          "",
      },
    },
    {
      step: 10,
      payload: {
        handedness: row["content.physical_skills.handedness"] || "",
        fineMotorSkills: row["content.physical_skills.fineMotorSkills"] || "",
        grossMotorSkills: row["content.physical_skills.grossMotorSkills"] || "",
      },
    },
    {
      step: 11,
      payload: {
        sensoryIssuesDetails:
          row["content.sensory_issues.sensoryIssuesDetails"] || "",
      },
    },
    {
      step: 12,
      payload: {
        behavioralObservationDetails:
          row["content.behavioral_observation.behavioralObservationDetails"] ||
          "",
      },
    },
    {
      step: 13,
      payload: {
        leisureActivityDetails:
          row["content.leisure_time_activity.leisureActivityDetails"] || "",
      },
    },
    {
      step: 14,
      payload: {
        testAdministeredDetails:
          row["content.test_administered.testAdministeredDetails"] || "",
      },
    },
    {
      step: 15,
      payload: {
        diagnosisDetails:
          row["content.provisional_diagnosis.diagnosisDetails"] || "",
      },
    },
  ];

  for (const { step, payload } of steps) {
    try {
      await axios.put(
        `${API_BASE_URL}/students/psychological-assessment/autosave/${assessmentId}/${step}`,
        payload,
        { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
      );
      console.log(`✅ Step ${step} saved for ${row["Student Name"]}`);
    } catch (err) {
      console.error(
        `❌ Step ${step} failed for ${row["Student Name"]}`,
        err.response?.data || err.message
      );
    }
  }

  // Step 16: Upload files
  /*
  const form = new FormData();
  const filePath = row['content.upload_documents.upload_documents[0].path'];
  if (filePath && fs.existsSync(filePath)) {
    form.append('files', fs.createReadStream(filePath));
    try {
      await axios.put(
        `${API_BASE_URL}/students/psychological-assessment/autosave/${assessmentId}/16`,
        form,
        {
          headers: {
            Authorization: `Bearer ${JWT_TOKEN}`,
            ...form.getHeaders(),
          },
        }
      );
      console.log(`✅ Step 16 file uploaded for ${row['Student Name']}`);
    } catch (err) {
      console.error(`❌ Step 16 file upload failed`, err.response?.data || err.message);
    }
  }
  */

  // Step 17: Plan of action
  try {
    await axios.put(
      `${API_BASE_URL}/students/psychological-assessment/autosave/${assessmentId}/17`,
      {
        goals: row["content.plan_of_action.goals"] || "",
        activities: row["content.plan_of_action.activities"] || "",
        sessionsPerWeek:
          cleanRangeString(row["content.plan_of_action.sessionsPerWeek"]) || "",
      },
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );
    console.log(`✅ Step 17 plan of action saved for ${row["Student Name"]}`);
  } catch (err) {
    console.error(
      `❌ Step 17 failed for ${row["Student Name"]}`,
      err.response?.data || err.message
    );
  }

  // Step 18: Final submission
  try {
    await axios.put(
      `${API_BASE_URL}/students/psychological-assessment/submit/${assessmentId}`,
      {},
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );
    console.log(
      `🎉 Psychology Assessment submitted for ${row["Student Name"]}`
    );
  } catch (err) {
    console.error(
      `❌ Final submission failed`,
      err.response?.data || err.message
    );
  }
}

async function runPsychologyAssessmentUpload(
  filePath = "./output/psychology_assessment_with_ids.csv"
) {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { raw: false }); // <- Forces formatted text instead of raw numbers

  for (const row of rows) {
    await uploadPsychologyAssessment(row);
  }

  console.log("✅ All Psychological Assessments processed");
}

module.exports = { runPsychologyAssessmentUpload };
