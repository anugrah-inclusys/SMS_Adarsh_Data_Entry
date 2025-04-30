const axios = require('axios');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { API_BASE_URL, JWT_TOKEN } = require('../config/config');
const { getTodayDate, excelDateToYMD } = require('./uploadHelper');

async function uploadSpeechAssessment(row) {
  const studentId = row['Student ID'] || row['STUDENT ID'];
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
      createdAt = getTodayDate();
    }

    const res = await axios.post(
      `${API_BASE_URL}/students/speech-assessment/autosave/1`,
      {
        student_id: studentId,
        presenting_complaints: row['content.presenting_complaints'] || '',
        createdAt: createdAt,
      },
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );

    assessmentId = res.data.data._id;
    console.log(`✅ Step 1 created speech assessment for ${row['Student Name']}`);
  } catch (err) {
    console.error(`❌ Step 1 failed for ${row['Student Name']}`, err.response?.data || err.message);
    return;
  }

  const steps = [
    {
      step: 2,
      payload: {
        eye_contact: row['content.prelinguistic_skills.eye_contact'] || '',
        eye_contact_additional_details: row['content.prelinguistic_skills.eye_contact_additional_details'] || '',
        name_call_response: row['content.prelinguistic_skills.name_call_response'] || '',
        name_call_response_additional_details: row['content.prelinguistic_skills.name_call_response_additional_details'] || '',
        sitting_behaviour: row['content.prelinguistic_skills.sitting_behaviour'] || '',
        sitting_behaviour_additional_details: row['content.prelinguistic_skills.sitting_behaviour_additional_details'] || '',
        attention: row['content.prelinguistic_skills.attention'] || '',
        attention_additional_details: row['content.prelinguistic_skills.attention_additional_details'] || '',
      },
    },
    {
      step: 3,
      payload: {
        cooing: row['content.speech_development.cooing'] || '',
        cooing_additional_details: row['content.speech_development.cooing_additional_details'] || '',
        babbling: row['content.speech_development.babbling'] || '',
        babbling_additional_details: row['content.speech_development.babbling_additional_details'] || '',
        first_word: row['content.speech_development.first_word'] || '',
        first_word_additional_details: row['content.speech_development.first_word_additional_details'] || '',
        phrase: row['content.speech_development.phrase'] || '',
        phrase_additional_details: row['content.speech_development.phrase_additional_details'] || '',
        sentence: row['content.speech_development.sentence'] || '',
        sentence_additional_details: row['content.speech_development.sentence_additional_details'] || '',
      },
    },
    {
      step: 4,
      payload: {
        vision: row['content.sensory_development.vision'] || '',
        audition: row['content.sensory_development.audition'] || '',
      },
    },
    {
      step: 5,
      payload: {
        receptive_language_skills: row['content.language_skills.receptive_language_skills'] || '',
        expressive_language_skills: row['content.language_skills.expressive_language_skills'] || '',
      },
    },
    {
      step: 6,
      payload: {
        lips_structure: row['content.opme.lips.structure'] || '',
        lips_function_protrusion: row['content.opme.lips.function.protrusion'] || '',
        lips_function_spreading: row['content.opme.lips.function.spreading'] || '',
        lips_function_rounding: row['content.opme.lips.function.rounding'] || '',
        lips_function_puckering: row['content.opme.lips.function.puckering'] || '',
        tongue_structure: row['content.opme.tongue.structure'] || '',
        tongue_function_elevation: row['content.opme.tongue.function.elevation'] || '',
        tongue_function_spreading: row['content.opme.tongue.function.spreading'] || '',
        tongue_function_lateral_movements: row['content.opme.tongue.function.lateral_movements'] || '',
        tongue_function_retraction: row['content.opme.tongue.function.retraction'] || '',
        teeth_structure: row['content.opme.teeth.structure'] || '',
        teeth_function: row['content.opme.teeth.function'] || '',
        hard_palate_structure: row['content.opme.hard_palate.structure'] || '',
        hard_palate_function: row['content.opme.hard_palate.function'] || '',
        soft_palate_structure: row['content.opme.soft_palate.structure'] || '',
        soft_palate_function: row['content.opme.soft_palate.function'] || '',
        maxilla_and_mandible_structure: row['content.opme.maxilla_and_mandible.structure'] || '',
        maxilla_and_mandible_function: row['content.opme.maxilla_and_mandible.function'] || '',
        uvula_structure: row['content.opme.uvula.structure'] || '',
        uvula_function: row['content.opme.uvula.function'] || '',
      },
    },
    {
        step: 7,
        payload: {
          remarks: row['content.remarks'] || '',
        },
      },
      {
        step: 8,
        payload: {
            sucking: String(row['content.vegetative_skills.sucking'] || '').toLowerCase() === 'true',
            chewing: String(row['content.vegetative_skills.chewing'] || '').toLowerCase() === 'true',
            blowing: String(row['content.vegetative_skills.blowing'] || '').toLowerCase() === 'true',
            biting: String(row['content.vegetative_skills.biting'] || '').toLowerCase() === 'true',
            swallowing: String(row['content.vegetative_skills.swallowing'] || '').toLowerCase() === 'true',
            
        },
      },
      {
        step: 9,
        payload: {
          speech_imitation_rating: row['content.speech_imitation_skills.rating'] || '',
          speech_imitation_comment: row['content.speech_imitation_skills.comment'] || '',
        },
      },
      {
        step: 10,
        payload: {
          speech_intelligibility_rating: row['content.speech_intelligibility.rating'] || '',
          speech_intelligibility_comment: row['content.speech_intelligibility.comment'] || '',
        },
      },
      {
        step: 11,
        payload: {
          group_play: row['content.play_skills.group_play'] === 'true',
          solo_play: row['content.play_skills.solo_play'] === 'true',
          both: row['content.play_skills.both'] === 'true',
        },
      },
      {
        step: 12,
        payload: {
          native_language: row['content.linguistic_skills.native_language'] || '',
          stimulation_at_home: row['content.linguistic_skills.stimulation_at_home'] || '',
        },
      },
      {
        step: 13,
        payload: {
          language_test_findings: row['content.language_test_findings'] || '',
        },
      },
      {
        step: 14,
        payload: {
          provisional_diagnosis: row['content.provisional_diagnosis'] || '',
        },
      },
      {
        step: 16,
        payload: {
          goals: row['content.plan_of_action.goals'] || '',
          activities: row['content.plan_of_action.activities'] || '',
          sessions_per_week: row['content.plan_of_action.sessions_per_week'] || '',
        },
      },
    ];
  for (const { step, payload } of steps) {
    try {
      await axios.put(
        `${API_BASE_URL}/students/speech-assessment/autosave/${assessmentId}/${step}`,
        payload,
        { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
      );
      console.log(`✅ Step ${step} saved for ${row['Student Name']}`);
    } catch (err) {
      console.error(`❌ Step ${step} failed for ${row['Student Name']}`, err.response?.data || err.message);
    }
  }

  // Step 17: Submit
  try {
    await axios.put(
      `${API_BASE_URL}/students/speech-assessment/submit/${assessmentId}`,
      {},
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );
    console.log(`🎉 Speech Assessment submitted for ${row['Student Name']}`);
  } catch (err) {
    console.error(`❌ Final submission failed`, err.response?.data || err.message);
  }
}

async function runSpeechAssessmentUpload(filePath = './output/speech_assessment_with_ids.csv') {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  for (const row of rows) {
    await uploadSpeechAssessment(row);
  }

  console.log('✅ All Speech Assessments processed');
}

module.exports = { runSpeechAssessmentUpload };
