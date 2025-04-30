const axios = require('axios');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { API_BASE_URL, JWT_TOKEN } = require('../config/config');
const { getTodayDate, excelDateToYMD,cleanRangeString } = require('./uploadHelper');

async function uploadOccupationalTherapyAssessment(row) {
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
      createdAt = getTodayDate(); // fallback helper if missing
    }

    const res = await axios.post(
      `${API_BASE_URL}/students/occupational-therapy/autosave/1`,
      {
        student_id: studentId,
        eyeContact:
          row['content.neuroMusculoskeletal.observation.eyeContact'] || '',
        additional_details:
          row['content.neuroMusculoskeletal.observation.additional_details'] ||
          '',
        respondsToCommand:
          row['content.neuroMusculoskeletal.observation.respondsToCommand'] ||
          '',
        posture: row['content.neuroMusculoskeletal.observation.posture'] || '',
        gait: row['content.neuroMusculoskeletal.observation.gait'] || '',
        muscleTone:
          row['content.neuroMusculoskeletal.examination.muscleTone'] || '',
        musclePower:
          row['content.neuroMusculoskeletal.examination.musclePower'] || '',
        vision: row['content.neuroMusculoskeletal.examination.vision'] || '',
        hearing: row['content.neuroMusculoskeletal.examination.hearing'] || '',
        speech_examination:
          row['content.neuroMusculoskeletal.examination.speech_examination'] ||
          '',
        upperLimb:
          row['content.neuroMusculoskeletal.jointRangeOfMotion.upperLimb'] ||
          '',
        lowerLimb:
          row['content.neuroMusculoskeletal.jointRangeOfMotion.lowerLimb'] ||
          '',
        tactile: row['content.neuroMusculoskeletal.sensory_area.tactile'] || '',
        additional_details_tactile:
          row[
            'content.neuroMusculoskeletal.sensory_area.additional_details_tactile'
          ] || '',
        visual: row['content.neuroMusculoskeletal.sensory_area.visual'] || '',
        additional_details_visual:
          row[
            'content.neuroMusculoskeletal.sensory_area.additional_details_visual'
          ] || '',
        auditory:
          row['content.neuroMusculoskeletal.sensory_area.auditory'] || '',
        additional_details_auditory:
          row[
            'content.neuroMusculoskeletal.sensory_area.additional_details_auditory'
          ] || '',
        olfactory:
          row['content.neuroMusculoskeletal.sensory_area.olfactory'] || '',
        additional_details_olfactory:
          row[
            'content.neuroMusculoskeletal.sensory_area.additional_details_olfactory'
          ] || '',
        vestibular:
          row['content.neuroMusculoskeletal.sensory_area.vestibular'] || '',
        additional_details_vestibular:
          row[
            'content.neuroMusculoskeletal.sensory_area.additional_details_vestibular'
          ] || '',
        proprioception:
          row['content.neuroMusculoskeletal.sensory_area.proprioception'] || '',
        additional_details_proprioception:
          row[
            'content.neuroMusculoskeletal.sensory_area.additional_details_proprioception'
          ] || '',
        oral_input:
          row['content.neuroMusculoskeletal.sensory_area.oral_input'] || '',
        additional_details_oral_input:
          row[
            'content.neuroMusculoskeletal.sensory_area.additional_details_oral_input'
          ] || '',

        dominance:
          row['content.neuroMusculoskeletal.handFunctions.dominance'] || '',

        upward:
          row['content.neuroMusculoskeletal.handFunctions.reach.upward'] || '',
        downward:
          row['content.neuroMusculoskeletal.handFunctions.reach.downward'] ||
          '',
        horizontal:
          row['content.neuroMusculoskeletal.handFunctions.reach.horizontal'] ||
          '',

        spherical:
          row[
            'content.neuroMusculoskeletal.handFunctions.grasp.gross_grasp.spherical'
          ] || '',
        cylindrical:
          row[
            'content.neuroMusculoskeletal.handFunctions.grasp.gross_grasp.cylindrical'
          ] || '',
        hook:
          row[
            'content.neuroMusculoskeletal.handFunctions.grasp.gross_grasp.hook'
          ] || '',

        lateral:
          row[
            'content.neuroMusculoskeletal.handFunctions.grasp.fine_grasp.lateral'
          ] || '',
        pincer:
          row[
            'content.neuroMusculoskeletal.handFunctions.grasp.fine_grasp.pincer'
          ] || '',

        transfer: row['content.neuroMusculoskeletal.transfer'] || '',
        release: row['content.neuroMusculoskeletal.release'] || '',

        gripStrength: row['content.neuroMusculoskeletal.gripStrength'] || '',

        finger_to_palm:
          row['content.neuroMusculoskeletal.finger_to_palm'] || '',
        palm_to_finger:
          row['content.neuroMusculoskeletal.palm_to_finger'] || '',
        vertical: row['content.neuroMusculoskeletal.vertical'] || '',
        horizontal_grasp:
          row['content.neuroMusculoskeletal.horizontal_grasp'] || '',
        simple_180_degree:
          row['content.neuroMusculoskeletal.simple_180_degree'] || '',
        complex_360_degree:
          row['content.neuroMusculoskeletal.complex_360_degree'] || '',

        Finger_to_nose_test:
          row[
            'content.neuroMusculoskeletal.coordination.upper_limb.Finger_to_nose_test'
          ] || '',
        heel_to_shin_test:
          row[
            'content.neuroMusculoskeletal.coordination.lower_limb.heel_to_shin_test'
          ] || '',

        attention:
          row[
            'content.neuroMusculoskeletal.Cognitive_perceptual_skills.attention'
          ] || '',
        concentration:
          row[
            'content.neuroMusculoskeletal.Cognitive_perceptual_skills.concentration'
          ] || '',
        size_concept:
          row[
            'content.neuroMusculoskeletal.Cognitive_perceptual_skills.size_concept'
          ] || '',
        shape_concept:
          row[
            'content.neuroMusculoskeletal.Cognitive_perceptual_skills.shape_concept'
          ] || '',
        right_left_descrimination:
          row[
            'content.neuroMusculoskeletal.Cognitive_perceptual_skills.right_left_descrimination'
          ] || '',

        depth:
          row['content.neuroMusculoskeletal.Visual_perceptual_skills.depth'] ||
          '',
        eye_hand:
          row[
            'content.neuroMusculoskeletal.Visual_perceptual_skills.eye_hand'
          ] || '',
        ball_throwing_catching:
          row[
            'content.neuroMusculoskeletal.Visual_perceptual_skills.ball_throwing_catching'
          ] || '',

        play_development_details:
          row['content.neuroMusculoskeletal.play_development_details'] || '',
        behaviour: row['content.neuroMusculoskeletal.behaviour'] || '',
        speech: row['content.neuroMusculoskeletal.speech'] || '',
        Bladder_and_bowel_control:
          row['content.neuroMusculoskeletal.Bladder_and_bowel_control'] || '',
        bowel_control: row['content.neuroMusculoskeletal.bowel_control'] || '',
        activities_of_daily_living_dressing_upper_body:
          row[
            'content.neuroMusculoskeletal.activities_of_daily_living_dressing_upper_body'
          ] || '',
        activities_of_daily_living_dressing_lower_body:
          row[
            'content.neuroMusculoskeletal.activities_of_daily_living_dressing_lower_body'
          ] || '',
        activities_of_daily_living_bathing:
          row[
            'content.neuroMusculoskeletal.activities_of_daily_living_bathing'
          ] || '',
        activities_of_daily_living_toileting:
          row[
            'content.neuroMusculoskeletal.activities_of_daily_living_toileting'
          ] || '',
        activities_of_daily_living_eating:
          row[
            'content.neuroMusculoskeletal.activities_of_daily_living_eating'
          ] || '',
        activities_of_daily_living_grooming:
          row[
            'content.neuroMusculoskeletal.activities_of_daily_living_grooming'
          ] || '',
        activities_of_daily_living_bowel_management:
          row[
            'content.neuroMusculoskeletal.activities_of_daily_living_bowel_management'
          ] || '',
        activities_of_daily_living_bladder_management:
          row[
            'content.neuroMusculoskeletal.activities_of_daily_living_bladder_management'
          ] || '',
        diagnosis: row['content.neuroMusculoskeletal.diagnosis'] || '',

        createdAt: createdAt,
      },
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );

    assessmentId = res.data.data._id;
    console.log(
      `✅ Step 1 created occupational therapy assessment for ${row['Student Name']}`
    );
  } catch (err) {
    console.error(
      `❌ Step 1 failed for ${row['Student Name']}`,
      err.response?.data || err.message
    );
    return;
  }

  // Step 2: Sensory Screening
  const steps = [
    {
      step: 2,
      payload: {
        appear_fearful_of_playground:
          row[
            'content.sensoryScreening.vestibular.appear_fearful_of_playground'
          ] || '',
        become_sick_easily:
          row['content.sensoryScreening.vestibular.become_sick_easily'] || '',
        appear_fearful_of_heights:
          row[
            'content.sensoryScreening.vestibular.appear_fearful_of_heights'
          ] || '',
        avoid_balancing:
          row['content.sensoryScreening.vestibular.avoid_balancing'] || '',
        seek_fast_moving:
          row['content.sensoryScreening.vestibular.seek_fast_moving'] || '',
        avoid_sports:
          row['content.sensoryScreening.vestibular.avoid_sports'] || '',
        oblivious_to_risks:
          row['content.sensoryScreening.vestibular.oblivious_to_risks'] || '',
        frequent_movement:
          row['content.sensoryScreening.vestibular.frequent_movement'] || '',
        avoid_touch: row['content.sensoryScreening.tactile.avoid_touch'] || '',
        avoid_messy_play:
          row['content.sensoryScreening.tactile.avoid_messy_play'] || '',
        irritated_by_textures:
          row['content.sensoryScreening.tactile.irritated_by_textures'] || '',
        irritated_by_proximity:
          row['content.sensoryScreening.tactile.irritated_by_proximity'] || '',
        appears_active:
          row['content.sensoryScreening.tactile.appears_active'] || '',
        difficulty_small_objects:
          row['content.sensoryScreening.tactile.difficulty_small_objects'] ||
          '',
        hand_exploration:
          row['content.sensoryScreening.tactile.hand_exploration'] || '',
        mouth_objects:
          row['content.sensoryScreening.tactile.mouth_objects'] || '',

        pressure_handling:
          row[
            'content.sensoryScreening.ProprioceptiveScreening.pressure_handling'
          ] || '',
        body_positioning:
          row[
            'content.sensoryScreening.ProprioceptiveScreening.body_positioning'
          ] || '',
        enjoy_rough_play:
          row[
            'content.sensoryScreening.ProprioceptiveScreening.enjoy_rough_play'
          ] || '',
        seek_deep_pressure:
          row[
            'content.sensoryScreening.ProprioceptiveScreening.seek_deep_pressure'
          ] || '',
        relax_with_massage:
          row[
            'content.sensoryScreening.ProprioceptiveScreening.relax_with_massage'
          ] || '',

        uncomfortable_sunlight:
          row[
            'content.sensoryScreening.VisualScreening.uncomfortable_sunlight'
          ] || '',
        sensitive_lighting_changes:
          row[
            'content.sensoryScreening.VisualScreening.sensitive_lighting_changes'
          ] || '',
        sensory_integration:
          row['content.sensoryScreening.VisualScreening.sensory_integration'] ||
          '',
        turnaway_television:
          row['content.sensoryScreening.VisualScreening.turnaway_television'] ||
          '',
        focus_moving_objects:
          row[
            'content.sensoryScreening.VisualScreening.focus_moving_objects'
          ] || '',
        difficulty_scanning:
          row['content.sensoryScreening.VisualScreening.difficulty_scanning'] ||
          '',
        notice_new_people:
          row['content.sensoryScreening.VisualScreening.notice_new_people'] ||
          '',

        upset_loud_noises:
          row['content.sensoryScreening.AuditoryScreening.upset_loud_noises'] ||
          '',
        hum_screen_noise:
          row['content.sensoryScreening.AuditoryScreening.hum_screen_noise'] ||
          '',
        respond_to_voice:
          row['content.sensoryScreening.AuditoryScreening.respond_to_voice'] ||
          '',

        dislike_strong_sensations:
          row[
            'content.sensoryScreening.OlfactoryGustatoryScreening.dislike_strong_sensations'
          ] || '',
        crave_strong_sensations:
          row[
            'content.sensoryScreening.OlfactoryGustatoryScreening.crave_strong_sensations'
          ] || '',
        smear_feces:
          row[
            'content.sensoryScreening.OlfactoryGustatoryScreening.smear_feces'
          ] || '',
        eat_non_edible:
          row[
            'content.sensoryScreening.OlfactoryGustatoryScreening.eat_non_edible'
          ] || '',
      },
    },
  ];

  for (const { step, payload } of steps) {
    try {
      await axios.put(
        `${API_BASE_URL}/students/occupational-therapy/autosave/${assessmentId}/${step}`,
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

  // Step 3: Upload Files (optional)
  /*
  const form = new FormData();
  const filePath = row['content.upload_documents.upload_documents[0].path'];

  if (filePath && fs.existsSync(filePath)) {
    form.append('files', fs.createReadStream(filePath));
  }

  if (form.has('files')) {
    try {
      await axios.put(
        `${API_BASE_URL}/students/occupational-therapy/autosave/${assessmentId}/3`,
        form,
        {
          headers: {
            Authorization: `Bearer ${JWT_TOKEN}`,
            ...form.getHeaders(),
          },
        }
      );
      console.log(`✅ Step 3 files uploaded for ${row['Student Name']}`);
    } catch (err) {
      console.error(`❌ Step 3 file upload failed`, err.response?.data || err.message);
    }
  }
  */

  // Step 4: Plan of Action
  try {
    await axios.put(
      `${API_BASE_URL}/students/occupational-therapy/autosave/${assessmentId}/4`,
      {
        goals: row['content.plan_of_action.goals'] || '',
        activities: row['content.plan_of_action.activities'] || '',
        sessionsPerWeek: cleanRangeString(row['content.plan_of_action.sessionsPerWeek']) || '',

      },
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );
    console.log(`✅ Step 4 plan of action saved for ${row['Student Name']}`);
  } catch (err) {
    console.error(
      `❌ Step 4 failed for ${row['Student Name']}`,
      err.response?.data || err.message
    );
  }

  // Step 5: Submit
  try {
    await axios.put(
      `${API_BASE_URL}/students/occupational-therapy/submit/${assessmentId}`,
      {},
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );
    console.log(
      `🎉 Occupational Therapy Assessment submitted for ${row['Student Name']}`
    );
  } catch (err) {
    console.error(
      `❌ Final submission failed`,
      err.response?.data || err.message
    );
  }
}

async function runOccupationalTherapyAssessmentUpload(
  filePath = './output/occupational_therapy_assessment_with_ids.csv'
) {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  for (const row of rows) {
    await uploadOccupationalTherapyAssessment(row);
  }

  console.log('✅ All Occupational Therapy Assessments processed');
}

module.exports = { runOccupationalTherapyAssessmentUpload };
