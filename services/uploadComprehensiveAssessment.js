const axios = require("axios");
const xlsx = require("xlsx");
const fs = require("fs");
const FormData = require("form-data");
const { API_BASE_URL, JWT_TOKEN } = require("../config/config");
const {
  excelDateToYMD,
  cleanRangeString,
  getTodayDate,
} = require("./uploadHelper");
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

async function uploadComprehensiveAssessment(row) {
  const studentId = row["Student ID"] || row["STUDENT ID"] || row["student id"];
  if (!studentId) {
    console.warn(`⚠️ Skipping row without Student ID: ${row["Student Name"]}`);
    return;
  }

    // Resolve unit/class IDs from name (Step 10)
    const { unitMap, classMap } = await getUnitClassLookup();
    const unitName = (row["content.unit_id"] || "").trim().toLowerCase();
    const className = (row["content.class_id"] || "").trim().toLowerCase();
    const unit_id = unitMap[unitName] || "";
    const class_id = classMap[`${unitName}|${className}`] || "";
    const student = await fetchStudentDetails(studentId);
    if (!student) return;
  
    // console.log("🚀 Step 10 Payload:", {
    //   unit_id,
    //   class_id,
    //   provisional_diagnosis: row["content.provisional_diagnosis"] || "",
    //   remarks: row["content.remarks"] || "",
    // });

  let assessmentId = "";

  // Step 1: Create Comprehensive Form
  try {
    const res = await axios.post(
      `${API_BASE_URL}/students/comprehensive-assessment/autosave/1`,
      {
        student_id: studentId,
        assessment_details:
          row["content.sections.special_education.assessment_details"] || "",
        assessment_date: row["assessment_date"]
          ? excelDateToYMD(row["assessment_date"])
          : "", // Set to empty string if not provided
      },
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );
    assessmentId = res.data.data._id;
    console.log(
      `✅ Step 1 created comprehensive form for ${student.name.first_name}`
    );
  } catch (err) {
    console.error(`❌ Step 1 failed`, err.response?.data || err.message);
    return;
  }



  const steps = [
    {
      step: 2,
      payload: {
        activities_of_daily_living:
          row[
            "content.sections.special_education.activities_of_daily_living"
          ] || "",
      },
    },
    {
      step: 3,
      payload: {
        medical_history:
          row["content.sections.special_education.medical_history"] || "",
      },
    },
    {
      step: 4,
      payload: {
        extra_curricular_activities:
          row[
            "content.sections.special_education.extra_curricular_activities"
          ] || "",
      },
    },
    {
      step: 5,
      payload: {
        assessment_details:
          row["content.sections.physiotherapy.assessment_details"] || "",
      },
    },
    {
      step: 6,
      payload: {
        assessment_details:
          row["content.sections.occupational_therapy.assessment_details"] || "",
      },
    },
    {
      step: 7,
      payload: {
        sensory_dysfunction:
          row["content.sections.occupational_therapy.sensory_dysfunction"] ||
          "",
      },
    },
    {
      step: 8,
      payload: {
        assessment_details:
          row["content.sections.speech_and_language.assessment_details"] || "",
      },
    },
    {
      step: 9,
      payload: {
        assessment_details:
          row["content.sections.psychology.assessment_details"] || "",
      },
    },
    {
      step: 10,
      payload: {
        unit_id: unit_id || student?.unit_id,
        class_id: class_id || student?.class_id,
        provisional_diagnosis: row["content.provisional_diagnosis"] || "",
        remarks: row["content.remarks"] || "",
      },
    },
  ];

  for (const { step, payload } of steps) {
    try {
      await axios.put(
        `${API_BASE_URL}/students/comprehensive-assessment/autosave/${assessmentId}/${step}`,
        payload,
        { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
      );
      console.log(`✅ Step ${step} saved for ${student.name.first_name}`);
    } catch (err) {
      console.error(
        `❌ Step ${step} failed`,
        err.response?.data || err.message
      );
    }
  }

  // Final Submission
  try {
    await axios.put(
      `${API_BASE_URL}/students/comprehensive-assessment/submit/${studentId}`,
      null, // or omit the body
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );

    console.log(
      `🎉 Comprehensive Assessment submitted for ${student.name.first_name}`
    );
  } catch (err) {
    console.error(
      `❌ Final submission failed`,
      err.response?.data || err.message
    );
    return;
  }

  // Final Approval
  try {
    await axios.post(
      `${API_BASE_URL}/students/comprehensive/approve/${studentId}`,
      {},
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );
    console.log(`🎯 Class change approved for ${student.name.first_name}`);
  } catch (err) {
    console.error(`❌ Approval failed`, err.response?.data || err.message);
  }
}

//     async function runComprehensiveAssessmentUpload(filePath = './output/comprehensive_assessment_with_ids.csv') {
//       if (!fs.existsSync(filePath)) {
//         console.error(`❌ File not found: ${filePath}`);
//         return;
//       }

//       const workbook = xlsx.readFile(filePath, { cellText: false, cellDates: true });
//       const sheet = workbook.Sheets[workbook.SheetNames[0]];
//       const rows = xlsx.utils.sheet_to_json(sheet);

//       for (const row of rows) {
//         await uploadComprehensiveAssessment(row);
//       }

//       console.log('✅ All Comprehensive Assessments processed');
//     }

//     module.exports = { runComprehensiveAssessmentUpload };

//   } catch (err) {
//     console.error(`❌ Approval failed`, err.response?.data || err.message);
//   }
// }

async function runComprehensiveAssessmentUpload(
  filePath = "./output/comprehensive_assessment_with_ids.csv"
) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return;
  }

 const workbook = xlsx.readFile(filePath, {
      cellText: false,
      cellDates: true,
      codepage: 65001,
    });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);


  for (const row of rows) {
    await uploadComprehensiveAssessment(row);
  }

  console.log("✅ All Comprehensive Assessments processed");
}

module.exports = { runComprehensiveAssessmentUpload };
