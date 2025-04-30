const axios = require('axios');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { API_BASE_URL, JWT_TOKEN } = require('../config/config');
const { getTodayDate, excelDateToYMD} = require('./uploadHelper');

async function uploadSpecialEducationAssessment(row) {
  const studentId = row['STUDENT ID'];
  if (!studentId) {
    console.warn(`⚠️ Skipping row without Student ID: ${row['Student Name']}`);
    return;
  }

  let assessmentId = '';

  // Step 1: Create Initial Form
  try {
    let createdAt = row['createdAt'];

    if (typeof createdAt === 'number') {
      createdAt = excelDateToYMD(createdAt);
    }
    if (!createdAt) {
      createdAt = getTodayDate(); // fallback helper if missing
    }
    const res = await axios.post(
      `${API_BASE_URL}/students/special-education-assessment/autosave/1`,
      {
        student_id: studentId,
        presentLevel: row['content.presentLevel'] || '',
        createdAt: createdAt,
      },
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );
    assessmentId = res.data.data._id;
    // console.log(res.data,'assessmentId')
    console.log(`✅ Step 1 created assessment for ${row['Student Name']}`);
  } catch (err) {
    console.error(
      `❌ Step 1 failed for ${row['Student Name']}`,
      err.response?.data || err.message
    );
    return;
  }

  const steps = [
    {
      step: 2,
      payload: {
        eyeHandCoordination:
          row['content.fineMotorSkills.eyeHandCoordination'] || '',
        eyeHandCoordinationDetails:
          row['content.fineMotorSkills.eyeHandCoordinationDetails'] || '',
        Holding: row['content.fineMotorSkills.Holding'] || '',
      },
    },
    {
      step: 3,
      payload: {
        color: row['content.functionalAcademics.color'] || '',
        shape: row['content.functionalAcademics.shape'] || '',
        size: row['content.functionalAcademics.size'] || '',
        preSkills: row['content.functionalAcademics.preSkills'] || '',
      },
    },
    {
      step: 4,
      payload: {
        identification:
          row['content.academics.readingSkills.identification'] || '',
        matching: row['content.academics.readingSkills.matching'] || '',
        sorting: row['content.academics.readingSkills.sorting'] || '',
        differentiation:
          row['content.academics.readingSkills.differentiation'] || '',
        sightWord: row['content.academics.readingSkills.sightWord'] || '',
        wordLevel: row['content.academics.readingSkills.wordLevel'] || '',
        sentenceLevel:
          row['content.academics.readingSkills.sentenceLevel'] || '',
        paragraph: row['content.academics.readingSkills.paragraph'] || '',
        scribbling: row['content.academics.writingSkills.scribbling'] || '',
        tracingAndDotsJoining:
          row['content.academics.writingSkills.tracingAndDotsJoining'] || '',
        formationOfLetters:
          row['content.academics.writingSkills.formationOfLetters'] || '',
        copyWriting: row['content.academics.writingSkills.copyWriting'] || '',
        Punctuation: row['content.academics.writingSkills.Punctuation'] || '',
        numberConcept:
          row['content.academics.arithmeticSkills.numberConcept'] || '',
        counting: row['content.academics.arithmeticSkills.counting'] || '',
        basicOperations:
          row['content.academics.arithmeticSkills.basicOperations'] || '',
        placeValue: row['content.academics.arithmeticSkills.placeValue'] || '',
      },
    },
    { step: 5, payload: { adl: row['content.adl'] || '' } },
    { step: 6, payload: { sensory: row['content.sensory'] || '' } },
    {
      step: 7,
      payload: {
        preVocationalSkills: row['content.preVocationalSkills'] || '',
      },
    },
    {
      step: 8,
      payload: {
        drinking: row['content.adlAssessment.drinking'] || '',
        eating: row['content.adlAssessment.eating'] || '',
        toiletIndication: row['content.adlAssessment.toiletIndication'] || '',
        brushing: row['content.adlAssessment.brushing'] || '',
        unButtoning: row['content.adlAssessment.unButtoning'] || '',
        toileting: row['content.adlAssessment.toileting'] || '',
        washing: row['content.adlAssessment.washing'] || '',
        buttoning: row['content.adlAssessment.buttoning'] || '',
        dressing: row['content.adlAssessment.dressing'] || '',
        bathing: row['content.adlAssessment.bathing'] || '',
        grooming: row['content.adlAssessment.grooming'] || '',
        combing: row['content.adlAssessment.combing'] || '',
        hairTying: row['content.adlAssessment.hairTying'] || '',
        nailCutting: row['content.adlAssessment.nailCutting'] || '',
        shavingOrNapkin: row['content.adlAssessment.shavingOrNapkin'] || '',
        shoeLaceTying: row['content.adlAssessment.shoeLaceTying'] || '',
      },
    },
  ];

  for (const { step, payload } of steps) {
    try {
      await axios.put(
        `${API_BASE_URL}/students/special-education-assessment/autosave/${assessmentId}/${step}`,
        payload,
        { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
      );
      console.log(`✅ Step ${step} saved for ${row['Student Name']}`);
    } catch (err) {
      console.error(
        `❌ Step ${step} failed for ${row['Student Name']}`,
        err.response?.data || err.message
      );
    }
  }

  // Step 9: Handle files
  // const form = new FormData();
  // const file1Path = row["content.upload_documents.upload_documents[0].path"];
  // const file2Path = row["content.upload_documents.upload_documents[1].path"];

  // if (file1Path && fs.existsSync(file1Path)) {
  //   form.append("files", fs.createReadStream(file1Path));
  // }
  // if (file2Path && fs.existsSync(file2Path)) {
  //   form.append("files", fs.createReadStream(file2Path));
  // }

  // if (form.has("files")) {
  //   try {
  //     await axios.put(
  //       `${API_BASE_URL}/students/special-education-assessment/autosave/${assessmentId}/9`,
  //       form,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${JWT_TOKEN}`,
  //           ...form.getHeaders(),
  //         },
  //       }
  //     );
  //     console.log(`✅ Step 9 files uploaded for ${row["Student Name"]}`);
  //   } catch (err) {
  //     console.error(`❌ Step 9 file upload failed for ${row["Student Name"]}`, err.response?.data || err.message);
  //   }
  // }

  // Step 10: Treatment plan
  try {
    await axios.put(
      `${API_BASE_URL}/students/special-education-assessment/autosave/${assessmentId}/10`,
      {
        goals: row['content.treatmentPlan.goals'] || '',
        activities: row['content.treatmentPlan.activities'] || '',
        sessionsPerWeek: row['content.treatmentPlan.sessionsPerWeek'] || '',
      },
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );
    console.log(`✅ Step 10 treatment plan saved for ${row['Student Name']}`);
  } catch (err) {
    console.error(
      `❌ Step 10 failed for ${row['Student Name']}`,
      err.response?.data || err.message
    );
  }

  // Step 11: Submit
  try {
    await axios.put(
      `${API_BASE_URL}/students/special-education-assessment/submit/${assessmentId}`,
      {},
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );
    console.log(`🎉 Assessment submitted for ${row['Student Name']}`);
  } catch (err) {
    console.error(
      `❌ Final submission failed`,
      err.response?.data || err.message
    );
  }
}

async function runSpecialEducationAssessmentUpload(filePath = "./output/special_education_assessment_with_ids.csv") {
  const workbook = xlsx.readFile(filePath, { cellText: false, cellDates: true, codepage: 65001 });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  for (const row of rows) {
    await uploadSpecialEducationAssessment(row);
  }

  console.log('✅ All Special Education Assessments processed');
}

module.exports = { runSpecialEducationAssessmentUpload };
