const axios = require('axios');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { API_BASE_URL, JWT_TOKEN } = require('../config/config');
const { getTodayDate, excelDateToYMD } = require('./uploadHelper');

async function uploadPhysiotherapyAssessment(row) {
  const studentId = row['Student ID'] || row['STUDENT ID'] || row['student id'];

console.log(studentId)
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
      `${API_BASE_URL}/students/physiotherapy-assessment/autosave/1`,
      {
        student_id: studentId,
        chiefComplaints:
          row['content.generalInformation.chiefComplaints'] || '',
        previousTreatment:
          row['content.generalInformation.previousTreatment'] || '',
        createdAt: createdAt,
      },
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );
    assessmentId = res.data.data._id;
    console.log(
      `✅ Step 1 created physiotherapy assessment for ${row['Student Name']}`
    );
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
        interactionWithParents:
          row[
            'content.observation.behavioralObservation.interactionWithParents'
          ] || '',
        responseToCommands:
          row['content.observation.behavioralObservation.responseToCommands'] ||
          '',
        eyeContact:
          row['content.observation.behavioralObservation.eyeContact'] || '',
        additionalDetails:
          row['content.observation.behavioralObservation.additionalDetails'] ||
          '',
        attentionSpan:
          row['content.observation.behavioralObservation.attentionSpan'] || '',
        visualAbnormalities:
          row['content.observation.physicalObservation.visualAbnormalities'] ||
          '',
        abnormalPatterns:
          row['content.observation.physicalObservation.abnormalPatterns'] || '',
        involuntaryMovements:
          row['content.observation.physicalObservation.involuntaryMovements'] ||
          '',
        formOfLocomotion:
          row['content.observation.physicalObservation.formOfLocomotion'] || '',
        posture: row['content.observation.physicalObservation.posture'] || '',
      },
    },
    {
      step: 3,
      payload: {
        musculoSkeletalExamination:
          row[
            'content.examination.musculoSkeletal.general.musculoSkeletalExamination'
          ] || '',
        muscleWasting:
          row['content.examination.musculoSkeletal.general.muscleWasting'] ||
          '',
        limbLengthDiscrepancy:
          row[
            'content.examination.musculoSkeletal.general.limbLengthDiscrepancy'
          ] || '',
        neck:
          row[
            'content.examination.musculoSkeletal.contractureDeformity.neck'
          ] || '',
        trunk:
          row[
            'content.examination.musculoSkeletal.contractureDeformity.trunk'
          ] || '',
        upperLimb:
          row[
            'content.examination.musculoSkeletal.contractureDeformity.upperLimb'
          ] || '',
        lowerLimb:
          row[
            'content.examination.musculoSkeletal.contractureDeformity.lowerLimb'
          ] || '',
        upperLimbs: row['content.examination.rangeOfMotion.upperLimbs'] || '',
        lowerLimbs: row['content.examination.rangeOfMotion.lowerLimbs'] || '',
        pathologicalReflexes:
          row['content.examination.pathologicalReflexes'] || '',
        balanceAndCoordination:
          row['content.examination.balanceAndCoordination'] || '',
        fineMotor: row['content.examination.evaluation.fineMotor'] || '',
        grossMotor: row['content.examination.evaluation.grossMotor'] || '',
        gmfmScore: row['content.examination.gmfmScore'] || '',
        modifiedAshworthScale:
          row['content.examination.modifiedAshworthScale'] || '',
        gait: row['content.examination.gait'] || '',
        sensoryEvaluation: row['content.examination.sensoryEvaluation'] || '',
        functionalAbility: row['content.examination.functionalAbility'] || '',
        associatedProblems: row['content.examination.associatedProblems'] || '',
        investigations: row['content.examination.investigations'] || '',
        diagnosis: row['content.diagnosis.diagnosis'] || '',
        familyExpectation: row['content.diagnosis.familyExpectation'] || '',
        childDescription: row['content.diagnosis.childDescription'] || '',
      },
    },
  ];

  for (const { step, payload } of steps) {
    try {
      await axios.put(
        `${API_BASE_URL}/students/physiotherapy-assessment/autosave/${assessmentId}/${step}`,
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

  // Step 4: Upload files (optional, commented for now)
  /*
  const form = new FormData();
  const file1Path = row['content.upload_documents.upload_documents[0].path'];

  if (file1Path && fs.existsSync(file1Path)) {
    form.append('files', fs.createReadStream(file1Path));
  }

  if (form.has('files')) {
    try {
      await axios.put(
        `${API_BASE_URL}/students/physiotherapy-assessment/autosave/${assessmentId}/4`,
        form,
        {
          headers: {
            Authorization: `Bearer ${JWT_TOKEN}`,
            ...form.getHeaders(),
          },
        }
      );
      console.log(`✅ Step 4 files uploaded for ${row['Student Name']}`);
    } catch (err) {
      console.error(`❌ Step 4 file upload failed`, err.response?.data || err.message);
    }
  }
  */

  // Step 5: Plan of Action
  try {
    await axios.put(
      `${API_BASE_URL}/students/physiotherapy-assessment/autosave/${assessmentId}/5`,
      {
        goals: row['content.planOfAction.goals'] || '',
        activities: row['content.planOfAction.activities'] || '',
        sessionsPerWeek: row['content.planOfAction.sessionsPerWeek'] || '',
      },
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );
    console.log(`✅ Step 5 plan of action saved for ${row['Student Name']}`);
  } catch (err) {
    console.error(
      `❌ Step 5 failed for ${row['Student Name']}`,
      err.response?.data || err.message
    );
  }

  // Step 6: Submit
  try {
    await axios.put(
      `${API_BASE_URL}/students/physiotherapy-assessment/submit/${assessmentId}`,
      {},
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );
    console.log(
      `🎉 Physiotherapy Assessment submitted for ${row['Student Name']}`
    );
  } catch (err) {
    console.error(
      `❌ Final submission failed`,
      err.response?.data || err.message
    );
  }
}

async function runPhysiotherapyAssessmentUpload(
  filePath = './output/physiotherapy_assessment_with_ids.csv'
) {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  for (const row of rows) {
    await uploadPhysiotherapyAssessment(row);
  }

  console.log('✅ All Physiotherapy Assessments processed');
}

module.exports = { runPhysiotherapyAssessmentUpload };
