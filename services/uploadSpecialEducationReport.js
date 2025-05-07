const axios = require('axios');
const xlsx = require('xlsx');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const { parseExcelDate } = require('./uploadHelper');
const { API_BASE_URL, JWT_TOKEN} = require('../config/config');

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
// Step 1: Personal Information Mapping
function mapStep1(row, student) {
  return {
    student_id: row['student_id'] || student?._id || '',
    name:
      row['Student Name'] ||
      `${student?.name?.first_name} ${student?.name?.last_name}` ||
      '',
    dob: parseExcelDate(row['dob']) || student?.date_of_birth || null,
    age: row['age'] || student?.age || '',
    gender:
      student?.encryptedFields?.gender || row['gender'] || 'Not specified',
    dateOfIEP: parseExcelDate(row['dateOfIEP']) || null,
    provisionalDiagnosis:
      student?.assessment?.preliminary_diagnosis.name ||
      row['provisionalDiagnosis'] ||
      '',
    associatedProblems: row['associatedProblems'] || '',
    medication: row['medication'] || '',
    createdAt: parseExcelDate(row["createdAt"]) ||  "",
  };
}

function getStepData(step, row) {
  switch (step) {
    case 2:
      return {
        classroomactivitiesacademics: {
          presentLevel: row['classroomactivitiesacademics.presentLevel'] || '',
          goalsAchieved:
            row['classroomactivitiesacademics.goalsAchieved'] || '',
          shortTermGoal:
            row['classroomactivitiesacademics.shortTermGoal'] || '',
          longTermGoal: row['classroomactivitiesacademics.longTermGoal'] || '',
          remarks: row['classroomactivitiesacademics.remarks'] || '',
        },
      };
    case 3:
      return {
        adl: {
          remarks: row['adl.remarks'] || '',
          goalsAchieved: row['adl.goalsAchieved'] || '',
          shortTermGoal: row['adl.shortTermGoal'] || '',
        },
      };
    case 4:
      return {
        sensory: {
          remarks: row['sensory.remarks'] || '',
          goalsAchieved: row['sensory.goalsAchieved'] || '',
          shortTermGoal: row['sensory.shortTermGoal'] || '',
        },
      };
    case 5:
      return {
        socialization: {
          remarks: row['socialization.remarks'] || '',
          goalsAchieved: row['socialization.goalsAchieved'] || '',
          shortTermGoal: row['socialization.shortTermGoal'] || '',
        },
      };
    case 6:
      return {
        lifeSkills: {
          remarks: row['lifeSkills.remarks'] || '',
          goalsAchieved: row['lifeSkills.goalsAchieved'] || '',
          shortTermGoal: row['lifeSkills.shortTermGoal'] || '',
        },
      };
    case 7:
      return {
        preVocation: {
          remarks: row['preVocation.remarks'] || '',
          goalsAchieved: row['preVocation.goalsAchieved'] || '',
          shortTermGoal: row['preVocation.shortTermGoal'] || '',
        },
      };
    default:
      return {};
  }
}

async function uploadSpecialEducationReport(row) {
  const studentId = row['STUDENT ID'];
  const term = String(row['term'] || '').trim();

  if (!studentId || !term) {
    console.warn(`⚠️ Skipping row: Missing student_id or term`);
    return;
  }

  const student = await fetchStudentDetails(studentId);
  if (!student) return;

  const step1 = mapStep1(row, student);
  let assessmentId;

  // Step 1: Create the report
  try {
    const res = await axios.post(
      `${API_BASE_URL}/students/special-education-report/autosave/1/${term}`,
      { ...step1, student_id: student._id },
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    assessmentId = res.data.data._id;
    console.log(`✅ Step 1 created Special Education Report ${assessmentId}`);
  } catch (err) {
    console.error(
      `❌ Step 1 creation failed`,
      err.response?.data || err.message
    );
    return;
  }

  // Step 2–7 (if available)
  for (let step = 2; step <= 7; step++) {
    const stepData = getStepData(step, row);
    if (Object.keys(stepData).length === 0) continue;

    try {
      await axios.put(
        `${API_BASE_URL}/students/special-education-report/autosave/${assessmentId}/${step}`,
        stepData,
        {
          headers: { Authorization: `Bearer ${JWT_TOKEN}` },
        }
      );
      console.log(`✅ Step ${step} saved for ${assessmentId}`);
    } catch (err) {
      console.error(
        `❌ Step ${step} failed`,
        err.response?.data || err.message
      );
    }
  }

  // Step 8: File Upload
  // const filePaths = getFilesForRow(
  //   row,
  //   'ADMISSION ID',
  //   './files/special_education'
  // );
  // if (filePaths.length > 0) {
  //   const form = new FormData();
  //   for (const filePath of filePaths) {
  //     form.append('files', fs.createReadStream(filePath));
  //   }

  //   try {
  //     await axios.put(
  //       `${API_BASE_URL}/students/special-education-report/autosave/${assessmentId}/8`,
  //       form,
  //       {
  //         headers: HEADERS(form),
  //       }
  //     );
  //     console.log(`✅ Step 8 files uploaded for ${assessmentId}`);
  //   } catch (err) {
  //     console.error(
  //       `❌ Step 8 file upload failed`,
  //       err.response?.data || err.message
  //     );
  //   }
  // } else {
  //   console.log(`ℹ️ No files found for Step 8 for ${assessmentId}`);
  // }

  // Final Submission
  try {
    await axios.put(
      `${API_BASE_URL}/students/special-education-report/submit/${assessmentId}`,
      {},
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    console.log(`🎉 Special Education Report submitted for ${assessmentId}`);
  } catch (err) {
    console.error(
      `❌ Final submission failed`,
      err.response?.data || err.message
    );
  }
}

async function runSpecialEducationReportUpload(
  filePath = './output/special_education_report_with_ids.csv'
) {
  const workbook = xlsx.readFile(filePath, {
    cellText: false,
    cellDates: true,
    codepage: 65001,
  });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  for (const row of rows) {
    await uploadSpecialEducationReport(row);
  }

  console.log('✅ All Special Education Reports processed');
}

module.exports = { runSpecialEducationReportUpload };
