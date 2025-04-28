const axios = require("axios");
const xlsx = require("xlsx");
const { writeFile } = require("xlsx");
const {
  parseExcelDate,
  parseFullName,
  parsePhoneNumbers,
  parseToNumber,
} = require("./uploadHelper"); // helpers
const { API_BASE_URL, JWT_TOKEN } = require("../config/config");
const { getUnitClassLookup } = require("./unitClassLookup");

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
    diagnosis:
      row["demographicData.diagnosis"] ||
      student?.assessment?.preliminary_diagnosis?.name ||
      "",
    informant: row["demographicData.informant"] || "",
    previousSchoolHistory:
      row["demographicData.previousSchoolHistory"] === "TRUE" || false,
    history: row["demographicData.history"] || "",
    medication: row["demographicData.medication"] || "",
  };
}

function mapStep2(row, student) {
  return {
    student_id: row["_id"] || student?._id || "",
    deliveryType: row["medicalHistory.deliveryType"] || "",
    birthCry: (row["medicalHistory.birthCry"] || "").toLowerCase(),
    birthWeight: parseToNumber(row["medicalHistory.birthWeight"]) || "",
    pedigreeFile: row["medicalHistory.pedigreeFile"] || "",
    chiefComplaints: row["medicalHistory.chiefComplaints"] || "",
    previousTreatment: row["medicalHistory.previousTreatment"] || "",
  };
}

function mapStep3(row, student) {
  return {
    student_id: row["_id"] || student?._id || "",
    behaviour: row["psychologicalSkills.behaviour"] || "",
    cognitive: row["psychologicalSkills.cognitive"] || "",
    attention: row["psychologicalSkills.attention"] || "",
    memory: row["psychologicalSkills.memory"] || "",
    orientation: row["psychologicalSkills.orientation"] || "",
    comprehension: row["psychologicalSkills.comprehension"] || "",
    iq: row["psychologicalSkills.iq"] || "",
    additionalRemarks: row["psychologicalSkills.additionalRemarks"] || "",
    socialDevelopment: row["psychologicalSkills.socialDevelopment"] || "",
    emotionalDevelopment: row["psychologicalSkills.emotionalDevelopment"] || "",
    remarks: row["psychologicalSkills.remarks"] || "",
  };
}

function mapStep4(row, student) {
  return {
    student_id: row["_id"] || student?._id || "",
    grossMotor: row["physiotherapyEvaluation.grossMotor"] || "",
    fineMotor: row["physiotherapyEvaluation.fineMotor"] || "",
    coordination: row["physiotherapyEvaluation.coordination"] || "",
    balance: row["physiotherapyEvaluation.balance"] || "",
    physiotherapyRemarks: row["physiotherapyEvaluation.remarks"] || "",
  };
}

function mapStep5(row, student) {
  return {
    student_id: row["_id"] || student?._id || "",
    drinking: row["adl.drinking"] || "",
    eating: row["adl.eating"] || "",
    dressing: row["adl.dressing"] || "",
    brushing: row["adl.brushing"] || "",
    toileting: row["adl.toileting"] || "",
    combing: row["adl.combing"] || "",
    bathing: row["adl.bathing"] || "",
    higher_skills: row["adl.higherSkills"] || "",
    lifeSkills: row["adl.lifeSkills"] || "",
    sensoryIssues: row["adl.sensoryIssues"] || "",
    eyeHandCoordination:
      row["specialEducationAssessment.eyeHandCoordination"] || "",
    basicConcepts: row["specialEducationAssessment.basicConcepts"] || "",
    preReadingSkills: row["specialEducationAssessment.preReadingSkills"] || "",
    preWritingSkills: row["specialEducationAssessment.preWritingSkills"] || "",
    preNumericSkills: row["specialEducationAssessment.preNumericSkills"] || "",
    academicLevel: row["specialEducationAssessment.academicLevel"] || "",
    specialEdRemarks: row["specialEducationAssessment.specialEdRemarks"] || "",
  };
}

function mapStep6(row, student) {
  return {
    student_id: row["_id"] || student?._id || "",
    eyeContact: row["speech.preLinguisticSkills.eyeContact"] || "",
    nameCallBehaviour:
      row["speech.preLinguisticSkills.nameCallBehaviour"] || "",
    sittingBehaviour: row["speech.preLinguisticSkills.sittingBehaviour"] || "",
    sucking: row["speech.vegetativeSkills.sucking"] || "",
    biting: row["speech.vegetativeSkills.biting"] || "",
    chewing: row["speech.vegetativeSkills.chewing"] || "",
    swallowing: row["speech.vegetativeSkills.swallowing"] || "",
    drooling: row["speech.vegetativeSkills.drooling"] || "",
    cooing: row["speech.milestone.cooing"] || "",
    babbling: row["speech.milestone.babbling"] || "",
    firstWord: row["speech.milestone.firstWord"] || "",
    phrase: row["speech.milestone.phrase"] || "",
    sentence: row["speech.milestone.sentence"] || "",
    value1: row["speech.milestone.value1"] || "",
    value2: row["speech.milestone.value2"] || "",
    value3: row["speech.milestone.value3"] || "",
    cooing_remark: row["speech.milestone.cooing_remark"] || "",
    babbling_remark: row["speech.milestone.babbling_remark"] || "",
    nativeLanguage: row["speech.linguistic.nativeLanguage"] || "",
    languageStimulation: row["speech.linguistic.languageStimulation"] || "",
    modeOfCommunication: row["speech.linguistic.modeOfCommunication"] || "",
    speechRemarks: row["speech.speechRemarks"] || "",
  };
}

function mapStep7(row, student) {
  return {
    student_id: row["_id"] || student?._id || "",
    computerSkill: row["additionalDetails.skills.computer.level"] || "",
    computerRemark: row["additionalDetails.skills.computer.remarks"] || "",
    musicSkill: row["additionalDetails.skills.music.level"] || "",
    musicRemark: row["additionalDetails.skills.music.remarks"] || "",
    danceSkill: row["additionalDetails.skills.dance.level"] || "",
    danceRemark: row["additionalDetails.skills.dance.remarks"] || "",
    drawingSkill: row["additionalDetails.skills.drawing.level"] || "",
    drawingRemark: row["additionalDetails.skills.drawing.remarks"] || "",
    physicallyfitSkill:
      row["additionalDetails.skills.physicalEducation.level"] || "",
    physicallyfitRemark:
      row["additionalDetails.skills.physicalEducation.remarks"] || "",
    virtual_reality: row["additionalDetails.therapy.virtualReality"] || "",
    hydrotherapy: row["additionalDetails.therapy.hydrotherapy"] || "",
    instruments: row["additionalDetails.therapy.instruments"] || "",
    virtual_reality_remark:
      row["additionalDetails.therapy.virtual_reality_remark"] || "",
    hydrotherapy_remark:
      row["additionalDetails.therapy.hydrotherapy_remark"] || "",
    instruments_remark:
      row["additionalDetails.therapy.instruments_remark"] || "",
  };
}

function mapStep8(row, student, unitClassLookup) {
  const unitName = (row["unit"] || "").trim().toLowerCase();
  const className = (row["class"] || "").trim().toLowerCase();
  const unitId = unitClassLookup.unitMap[unitName] || "";
  const classId = unitClassLookup.classMap[`${unitName}|${className}`] || "";

  return {
    student_id: row["_id"] || student?._id || "",
    recommendations:
      row["recommendations.recommendations[0]"]?.split(",") || [],
    recommendationRemarks: row["recommendations.recommendationRemarks"] || "",
    admission: row["recommendations.admission"] || "yes",
    status: row["recommendations.status"] || "",
    admissionremarks: row["recommendations.admissionremarks"] || "",
    reason: row["recommendations.reason"] || "",
    temp: row["recommendations.temp"] === "TRUE",
    unit: unitId,
    class: classId,
    testAdministrated: row["recommendations.testAdministrated"] || "",
  };
}

async function uploadInitialAssessment(row) {
  const studentId = row["STUDENT ID"];
  if (!studentId) {
    console.warn(`⚠️ Skipping row without student_id: ${row["Student Name"]}`);
    return;
  }

  const student = await fetchStudentDetails(studentId);
  if (!student) return;

  const { unitMap, classMap } = await getUnitClassLookup();

  const steps = [
    mapStep1(row, student),
    mapStep2(row, student),
    mapStep3(row, student),
    mapStep4(row, student),
    mapStep5(row, student),
    mapStep6(row, student),
    mapStep7(row, student),
    mapStep8(row, student, { unitMap, classMap }),
  ];

  let assessmentId;

  try {
    const res = await axios.post(
      `${API_BASE_URL}/students/initial-assessment/autosave/1`,
      steps[0],
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );
    assessmentId = res.data.data._id;
    console.log(`✅ Step 1 created initial assessment ${assessmentId}`);
  } catch (err) {
    console.error(`❌ Failed creating initial assessment`, err.response?.data || err.message);
    return;
  }

  for (let i = 1; i < steps.length; i++) {
    try {
      await axios.put(
        `${API_BASE_URL}/students/initial-assessment/autosave/${assessmentId}/${
          i + 1
        }`,
        steps[i],
        {
          headers: { Authorization: `Bearer ${JWT_TOKEN}` },
        }
      );
      console.log(`✅ Step ${i + 1} saved for ${student.name.first_name}`);
    } catch (err) {
      console.error(
        `❌ Step ${i + 1} failed`,
        err.response?.data || err.message
      );
    }
  }

  // Final Submit
  try {
    await axios.put(
      `${API_BASE_URL}/students/initial-assessment/submit/${assessmentId}`,
      {},
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    console.log(`🎉 Assessment submitted for ${student.name.first_name}`);
  } catch (err) {
    console.error(
      `❌ Final Submission failed`,
      err.response?.data || err.message
    );
  }
}

async function runInitialAssessmentUpload(
  filePath = "./output/initial_assessment_with_ids.csv"
) {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  for (const row of rows) {
    await uploadInitialAssessment(row);
  }

  console.log("✅ All initial assessments processed");
}

module.exports = { runInitialAssessmentUpload };
