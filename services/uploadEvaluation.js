const axios = require("axios");
const xlsx = require("xlsx");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const { parseExcelDate, getFilesForRow } = require("./uploadHelper");
const { API_BASE_URL, JWT_TOKEN, HEADERS } = require("../config/config");

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
async function fetchAdmissionDetails(studentId) {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/students/admission-form/${studentId}`,
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    return res.data;
  } catch (err) {
    console.error(
      `❌ Failed fetching student admission data: ${studentId}`,
      err.response?.data || err.message
    );
    return null;
  }
}

function mapStep1(row, student, admissionData) {
  return {
    student_id: row["STUDENT ID"] || student?._id || "",
    registrationNumber:
      row["content.student_details.registrationNumber"] ||
      admissionData?.personalInfo?.admission_id ||
      "",
    name:
      row["Student Name"] ||
      `${student?.name?.first_name} ${student?.name?.last_name}` ||
      "",
    dob: parseExcelDate(row["dob"]) || student?.date_of_birth || null,
    age: row["age"] || student?.age || "",
    mailID:
      row["content.student_details.mailID"] ||
      student?.contact_info?.email ||
      "",
    fathersName:
      row["content.family_details.fathersName"] ||
      `${student?.family_id?.father_name?.first_name} ${student?.family_id?.father_name?.last_name}` ||
      "",
    fathersAge: row["content.family_details.fathersAge"] || "",
    mothersName:
      row["content.family_details.mothersName"] ||
      `${student?.family_id?.mother_name?.first_name} ${student?.family_id?.mother_name?.last_name}` ||
      "",
    mothersAge: row["content.family_details.mothersAge"] || "",
    fathersEducation: row["content.family_details.fathersEducation"] || "",
    mothersEducation: row["content.family_details.mothersEducation"] || "",
    fathersOccupation: row["content.family_details.fathersOccupation"] || "",
    mothersOccupation: row["content.family_details.mothersOccupation"] || "",
    annualFamilyIncome: row["content.family_details.annualFamilyIncome"] || "",
    primaryCaretaker: row["content.family_details.primaryCaretaker"] || "",
    otherCareTaker: row["content.family_details.otherCareTaker"] || "",
    phoneNumberResidence:
      row["content.additional_details.phoneNumberResidence"] || "",
    mobileNumber: row["content.additional_details.mobileNumber"] || "",
    informant: row["content.additional_details.informant"] || "",
    otherinformant: row["content.additional_details.otherinformant"] || "",
    religion:
      row["content.additional_details.religion"] ||
      admissionData?.personalInfo?.religion ||
      "",
    motherTongue: row["content.additional_details.motherTongue"] || "",
    othermotherTongue:
      row["content.additional_details.othermotherTongue"] || "",
    dateOfEvaluation:
      parseExcelDate(row["content.additional_details.dateOfEvaluation"]) ||
      null,
    createdAt: parseExcelDate(row["createdAt"]) || "",
  };
}
function mapStep2(row, admissionData) {
  return {
    permHouseName: row["content.PermanentAddress.permHouseName"] || "",
    permStreetName: row["content.PermanentAddress.permStreetName"] || "",
    permCity: row["content.PermanentAddress.permCity"] || "",
    permDistrict: row["content.PermanentAddress.permDistrict"] || "",
    permState: row["content.PermanentAddress.permState"] || "",
    permPinCode: row["content.PermanentAddress.permPinCode"] || "",
    presHouseName: row["content.PresentAddress.presHouseName"] || "",
    presStreetName: row["content.PresentAddress.presStreetName"] || " ",
    presCity: row["content.PresentAddress.presCity"] || " ",
    presDistrict: row["content.PresentAddress.presDistrict"] || " ",
    presState: row["content.PresentAddress.presState"] || " ",
    presPinCode: row["content.PresentAddress.presPinCode"] || " ",
    createdAt: parseExcelDate(row["createdAt"]) || "",
  };
}

function mapStep3(row) {
  return {
    // General Information
    chiefComplaints:
      row["content.sections.generalInformation.chiefComplaints"] || "",
    otherchiefcomplaints:
      row["content.sections.generalInformation.othercheifcomplaints"] || "",
    mostBothersomeComplaint:
      row["content.sections.generalInformation.mostBothersomeComplaint"] || "",
    diagnosis: row["content.sections.generalInformation.diagnosis"] || "",
    problems: row["content.sections.generalInformation.problems"] || "",
    otherProblem: row["content.sections.generalInformation.otherProblem"] || "",
    habits: row["content.sections.generalInformation.habits"] || "",
    otherHabit: row["content.sections.generalInformation.otherHabit"] || "",
    issues: row["content.sections.generalInformation.issues"] || "",
    history: row["content.sections.generalInformation.history"] || "",
    postnatal: row["content.sections.generalInformation.postnatal"] || "",

    // Family History
    typeOfFamily: row["content.sections.family_history.typeOfFamily"] || "",
    familyProblem: row["content.sections.family_history.familyProblem"] || "",
    specifyFamilyProblem:
      row["content.sections.family_history.specifyFamilyProblem"] || "",
    specifyFamilyProblemNext:
      row["content.sections.family_history.specifyFamilyProblemNext"] || "",
    familyTree: row["content.sections.family_history.familyTree"] || "",

    // Parental History
    consanguinity: row["content.sections.parental_history.consanguinity"] || "",
    motherAgeAtBirth:
      row["content.sections.parental_history.motherAgeAtBirth"] || "",
    previousMiscarriage:
      row["content.sections.parental_history.previousMiscarriage"] || "",
    parentalHabits:
      row["content.sections.parental_history.parentalHabits"] || "",

    // Prenatal History
    prenatalCheckup:
      row["content.sections.prenatal_history.prenatalCheckup"] || "",
    pregnancyIssues:
      row["content.sections.prenatal_history.pregnancyIssues"] || "",
    pregnancyDescription:
      row["content.sections.prenatal_history.pregnancyDescription"] || "",

    // Natal History
    fetalMovements: row["content.sections.natal_history.fetalMovements"] || "",
    term: row["content.sections.natal_history.term"] || "",
    gestationalAge: row["content.sections.natal_history.gestationalAge"] || "",
  };
}

function mapStep4(row) {
  return {
    // Delivery Details
    placeOfDelivery:
      row["content.sections.delivery_details.placeOfDelivery"] || "",
    typeOfDelivery:
      row["content.sections.delivery_details.typeOfDelivery"] || "",
    deliveredBy: row["content.sections.delivery_details.deliveredBy"] || "",
    laborHours: row["content.sections.delivery_details.laborHours"] || "",
    presentation: row["content.sections.delivery_details.presentation"] || "",
    otherdeliveredby:
      row["content.sections.delivery_details.otherdeliveredby"] || "",
    Hoursknown: row["content.sections.delivery_details.Hoursknown"] || "",

    // Birth Details
    cordAroundNeck: row["content.sections.birth_details.cordAroundNeck"] || "",
    excessiveBleeding:
      row["content.sections.birth_details.excessiveBleeding"] || "",
    resuscitativeEfforts:
      row["content.sections.birth_details.resuscitativeEfforts"] || "",
    rhFactorMother: row["content.sections.birth_details.rhFactorMother"] || "",
    rhFactorChild: row["content.sections.birth_details.rhFactorChild"] || "",

    // Apgar Score
    birthWeight: row["content.sections.apgar_score.birthWeight"] || "",
    birthCry: row["content.sections.apgar_score.birthCry"] || "",
    suckReflex: row["content.sections.apgar_score.suckReflex"] || "",
    colorAtBirth: row["content.sections.apgar_score.colorAtBirth"] || "",
    apgarScore: row["content.sections.apgar_score.apgarScore"] || "",
    apgarScoreBirth: row["content.sections.apgar_score.apgarScoreBirth"] || "",
    apgarScore5Min: row["content.sections.apgar_score.apgarScore5Min"] || "",

    // Neonatal Care
    immunization: row["content.sections.neonatal_care.immunization"] || "",
    nicuAdmission: row["content.sections.neonatal_care.nicuAdmission"] || "",
    nicuDescription:
      row["content.sections.neonatal_care.nicuDescription"] || "",

    // Post-Natal History
    postNatalHistory:
      row["content.sections.post_natal_history.postNatalHistory"] || "",
    postNatalDescription:
      row["content.sections.post_natal_history.postNatalDescription"] || "",
  };
}

function mapStep5(row) {
  return {
    // Gross Motor Skills
    neckControl:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.neckControl"
      ] || "",
    neckControlAge:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.neckControlAge"
      ] || "",
    rolling:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.rolling"
      ] || "",
    rollingAge:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.rollingAge"
      ] || "",
    sittingWithoutSupport:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.sittingWithoutSupport"
      ] || "",
    sittingWithoutSupportAge:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.sittingWithoutSupportAge"
      ] || "",
    crawling:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.crawling"
      ] || "",
    crawlingAge:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.crawlingAge"
      ] || "",
    standingWithoutSupport:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.standingWithoutSupport"
      ] || "",
    standingWithoutSupportAge:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.standingWithoutSupportAge"
      ] || "",
    walkingWithoutSupport:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.walkingWithoutSupport"
      ] || "",
    walkingWithoutSupportAge:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.walkingWithoutSupportAge"
      ] || "",
    climbing:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.climbing"
      ] || "",
    climbingAge:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.climbingAge"
      ] || "",
    running:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.running"
      ] || "",
    runningAge:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.runningAge"
      ] || "",
    walkingUpDownSteps:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.walkingUpDownSteps"
      ] || "",
    walkingUpDownStepsAge:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.walkingUpDownStepsAge"
      ] || "",
    ridesTricycle:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.ridesTricycle"
      ] || "",
    ridesTricycleAge:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.ridesTricycleAge"
      ] || "",
    hopsSkips:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.hopsSkips"
      ] || "",
    hopsSkipsAge:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.hopsSkipsAge"
      ] || "",
    jumpsOverObstacles:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.jumpsOverObstacles"
      ] || "",
    jumpsOverObstaclesAge:
      row[
        "content.sections.developmental_assessment.gross_motor_skills.jumpsOverObstaclesAge"
      ] || "",

    // Fine Motor Skills
    handRegard:
      row[
        "content.sections.developmental_assessment.fine_motor_skills.handRegard"
      ] || "",
    handRegardAge:
      row[
        "content.sections.developmental_assessment.fine_motor_skills.handRegardAge"
      ] || "",
    reachForObject:
      row[
        "content.sections.developmental_assessment.fine_motor_skills.reachForObject"
      ] || "",
    reachForObjectAge:
      row[
        "content.sections.developmental_assessment.fine_motor_skills.reachForObjectAge"
      ] || "",
    transferObject:
      row[
        "content.sections.developmental_assessment.fine_motor_skills.transferObject"
      ] || "",
    transferObjectAge:
      row[
        "content.sections.developmental_assessment.fine_motor_skills.transferObjectAge"
      ] || "",
    pincerGrasp:
      row[
        "content.sections.developmental_assessment.fine_motor_skills.pincerGrasp"
      ] || "",
    pincerGraspAge:
      row[
        "content.sections.developmental_assessment.fine_motor_skills.pincerGraspAge"
      ] || "",
    releaseObjects:
      row[
        "content.sections.developmental_assessment.fine_motor_skills.releaseObjects"
      ] || "",
    releaseObjectsAge:
      row[
        "content.sections.developmental_assessment.fine_motor_skills.releaseObjectsAge"
      ] || "",
    buildingBlocks:
      row[
        "content.sections.developmental_assessment.fine_motor_skills.buildingBlocks"
      ] || "",
    buildingBlocksAge:
      row[
        "content.sections.developmental_assessment.fine_motor_skills.buildingBlocksAge"
      ] || "",
    turnsPages:
      row[
        "content.sections.developmental_assessment.fine_motor_skills.turnsPages"
      ] || "",
    turnsPagesAge:
      row[
        "content.sections.developmental_assessment.fine_motor_skills.turnsPagesAge"
      ] || "",
    drinkFromCup:
      row[
        "content.sections.developmental_assessment.fine_motor_skills.drinkFromCup"
      ] || "",
    drinkFromCupAge:
      row[
        "content.sections.developmental_assessment.fine_motor_skills.drinkFromCupAge"
      ] || "",
    dressUndressPartially:
      row[
        "content.sections.developmental_assessment.fine_motor_skills.dressUndressPartially"
      ] || "",
    dressUndressPartiallyAge:
      row[
        "content.sections.developmental_assessment.fine_motor_skills.dressUndressPartiallyAge"
      ] || "",
    buttonsAndCatchesBall:
      row[
        "content.sections.developmental_assessment.fine_motor_skills.buttonsAndCatchesBall"
      ] || "",
    buttonsAndCatchesBallAge:
      row[
        "content.sections.developmental_assessment.fine_motor_skills.buttonsAndCatchesBallAge"
      ] || "",

    // Social Skills
    socialSmile:
      row[
        "content.sections.developmental_assessment.social_skills.socialSmile"
      ] || "",
    socialSmileAge:
      row[
        "content.sections.developmental_assessment.social_skills.socialSmileAge"
      ] || "",
    recognizingMother:
      row[
        "content.sections.developmental_assessment.social_skills.recognizingMother"
      ] || "",
    recognizingMotherAge:
      row[
        "content.sections.developmental_assessment.social_skills.recognizingMotherAge"
      ] || "",
    mirrorPlay:
      row[
        "content.sections.developmental_assessment.social_skills.mirrorPlay"
      ] || "",
    mirrorPlayAge:
      row[
        "content.sections.developmental_assessment.social_skills.mirrorPlayAge"
      ] || "",
    strangerAnxiety:
      row[
        "content.sections.developmental_assessment.social_skills.strangerAnxiety"
      ] || "",
    strangerAnxietyAge:
      row[
        "content.sections.developmental_assessment.social_skills.strangerAnxietyAge"
      ] || "",
    indicatesDesire:
      row[
        "content.sections.developmental_assessment.social_skills.indicatesDesire"
      ] || "",
    indicatesDesireAge:
      row[
        "content.sections.developmental_assessment.social_skills.indicatesDesireAge"
      ] || "",
    imitatesActions:
      row[
        "content.sections.developmental_assessment.social_skills.imitatesActions"
      ] || "",
    imitatesActionsAge:
      row[
        "content.sections.developmental_assessment.social_skills.imitatesActionsAge"
      ] || "",
    playsWithChildren:
      row[
        "content.sections.developmental_assessment.social_skills.playsWithChildren"
      ] || "",
    playsWithChildrenAge:
      row[
        "content.sections.developmental_assessment.social_skills.playsWithChildrenAge"
      ] || "",
    selfFeeding:
      row[
        "content.sections.developmental_assessment.social_skills.selfFeeding"
      ] || "",
    selfFeedingAge:
      row[
        "content.sections.developmental_assessment.social_skills.selfFeedingAge"
      ] || "",
    groupPlay:
      row[
        "content.sections.developmental_assessment.social_skills.groupPlay"
      ] || "",
    groupPlayAge:
      row[
        "content.sections.developmental_assessment.social_skills.groupPlayAge"
      ] || "",
    competitiveGames:
      row[
        "content.sections.developmental_assessment.social_skills.competitiveGames"
      ] || "",
    competitiveGamesAge:
      row[
        "content.sections.developmental_assessment.social_skills.competitiveGamesAge"
      ] || "",

    // Language Skills
    alertToSound:
      row[
        "content.sections.developmental_assessment.language_skills.alertToSound"
      ] || "",
    alertToSoundAge:
      row[
        "content.sections.developmental_assessment.language_skills.alertToSoundAge"
      ] || "",
    babbling:
      row[
        "content.sections.developmental_assessment.language_skills.babbling"
      ] || "",
    babblingAge:
      row[
        "content.sections.developmental_assessment.language_skills.babblingAge"
      ] || "",
    respondsToName:
      row[
        "content.sections.developmental_assessment.language_skills.respondsToName"
      ] || "",
    respondsToNameAge:
      row[
        "content.sections.developmental_assessment.language_skills.respondsToNameAge"
      ] || "",
    nonspecificWords:
      row[
        "content.sections.developmental_assessment.language_skills.nonspecificWords"
      ] || "",
    nonspecificWordsAge:
      row[
        "content.sections.developmental_assessment.language_skills.nonspecificWordsAge"
      ] || "",
    followCommands:
      row[
        "content.sections.developmental_assessment.language_skills.followCommands"
      ] || "",
    followCommandsAge:
      row[
        "content.sections.developmental_assessment.language_skills.followCommandsAge"
      ] || "",
    identifiesBodyParts:
      row[
        "content.sections.developmental_assessment.language_skills.identifiesBodyParts"
      ] || "",
    identifiesBodyPartsAge:
      row[
        "content.sections.developmental_assessment.language_skills.identifiesBodyPartsAge"
      ] || "",
    formsSentences:
      row[
        "content.sections.developmental_assessment.language_skills.formsSentences"
      ] || "",
    formsSentencesAge:
      row[
        "content.sections.developmental_assessment.language_skills.formsSentencesAge"
      ] || "",
    usesThreeWordSentences:
      row[
        "content.sections.developmental_assessment.language_skills.usesThreeWordSentences"
      ] || "",
    usesThreeWordSentencesAge:
      row[
        "content.sections.developmental_assessment.language_skills.usesThreeWordSentencesAge"
      ] || "",
    knowsColors:
      row[
        "content.sections.developmental_assessment.language_skills.knowsColors"
      ] || "",
    knowsColorsAge:
      row[
        "content.sections.developmental_assessment.language_skills.knowsColorsAge"
      ] || "",
    asksWordMeaning:
      row[
        "content.sections.developmental_assessment.language_skills.asksWordMeaning"
      ] || "",
    asksWordMeaningAge:
      row[
        "content.sections.developmental_assessment.language_skills.asksWordMeaningAge"
      ] || "",

    // Emotional Skills
    stopsCryingWhenPicked:
      row[
        "content.sections.developmental_assessment.emotional_skills.stopsCryingWhenPicked"
      ] || "",
    stopsCryingWhenPickedAge:
      row[
        "content.sections.developmental_assessment.emotional_skills.stopsCryingWhenPickedAge"
      ] || "",
    enjoysBeingPlayedWith:
      row[
        "content.sections.developmental_assessment.emotional_skills.enjoysBeingPlayedWith"
      ] || "",
    enjoysBeingPlayedWithAge:
      row[
        "content.sections.developmental_assessment.emotional_skills.enjoysBeingPlayedWithAge"
      ] || "",
    showsFearOfStrangers:
      row[
        "content.sections.developmental_assessment.emotional_skills.showsFearOfStrangers"
      ] || "",
    showsFearOfStrangersAge:
      row[
        "content.sections.developmental_assessment.emotional_skills.showsFearOfStrangersAge"
      ] || "",
    egocentric:
      row[
        "content.sections.developmental_assessment.emotional_skills.egocentric"
      ] || "",
    egocentricAge:
      row[
        "content.sections.developmental_assessment.emotional_skills.egocentricAge"
      ] || "",
    demandsAttention:
      row[
        "content.sections.developmental_assessment.emotional_skills.demandsAttention"
      ] || "",
    demandsAttentionAge:
      row[
        "content.sections.developmental_assessment.emotional_skills.demandsAttentionAge"
      ] || "",
    lessEgocentric:
      row[
        "content.sections.developmental_assessment.emotional_skills.lessEgocentric"
      ] || "",
    lessEgocentricAge:
      row[
        "content.sections.developmental_assessment.emotional_skills.lessEgocentricAge"
      ] || "",
    affectionateToFamily:
      row[
        "content.sections.developmental_assessment.emotional_skills.affectionateToFamily"
      ] || "",
    affectionateToFamilyAge:
      row[
        "content.sections.developmental_assessment.emotional_skills.affectionateToFamilyAge"
      ] || "",
    comfortsPlaymates:
      row[
        "content.sections.developmental_assessment.emotional_skills.comfortsPlaymates"
      ] || "",
    comfortsPlaymatesAge:
      row[
        "content.sections.developmental_assessment.emotional_skills.comfortsPlaymatesAge"
      ] || "",
  };
}

async function uploadEvaluation(row) {
  const studentId = row["STUDENT ID"];
  if (!studentId) {
    console.warn("⚠️ Skipping row with missing Student ID");
    return;
  }
  const student = await fetchStudentDetails(studentId);
  if (!student) return;
  const admissionData = await fetchAdmissionDetails(studentId);
  if (!admissionData) return;

  const steps = [
    mapStep1(row, student, admissionData),
    mapStep2(row, admissionData),
    mapStep3(row),
    mapStep4(row),
    mapStep5(row),
  ];

  let assessmentId;

  try {
    const res = await axios.post(
      `${API_BASE_URL}/students/evaluation-form/autosave/1`,
      steps[0],
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    assessmentId = res.data.data._id;
    console.log(`✅ Step 1 created Evaluation Form ${assessmentId}`);
  } catch (err) {
    console.error(
      `❌ Step 1 creation failed`,
      err.response?.data || err.message
    );
    return;
  }

  // Step 2–5 PUT Updates
  for (let i = 1; i < steps.length; i++) {
    try {
      await axios.put(
        `${API_BASE_URL}/students/evaluation-form/autosave/${assessmentId}/${
          i + 1
        }`,
        steps[i],
        {
          headers: { Authorization: `Bearer ${JWT_TOKEN}` },
        }
      );
      console.log(`✅ Step ${i + 1} updated for ${assessmentId}`);
    } catch (err) {
      console.error(
        `❌ Step ${i + 1} failed`,
        err.response?.data || err.message
      );
    }
  }

  // Upload family tree (Step 3)

  const pedigreeFiles = getFilesForRow(
    row,
    "ADMISSION ID",
    "./files/evaluation_form"
  );
  const pedigreePath = pedigreeFiles.length > 0 ? pedigreeFiles[0] : null;
  if (!pedigreePath) {
    console.log(`⚠️ No family tree file found for ${studentId}`);
  }

  if (pedigreePath) {
    const form = new FormData();
    form.append("familyTree", fs.createReadStream(pedigreePath));
    for (const [key, value] of Object.entries(steps[2])) {
      if (key !== "student_id") {
        form.append(key, value || "");
      }
    }
    form.append("student_id", studentId);
    try {
      await axios.put(
        `${API_BASE_URL}/students/evaluation-form/autosave/${assessmentId}/3`,
        form,
        {
          headers: HEADERS(form),
        }
      );
      console.log(
        `📁 Step 3 with file uploaded for ${student.name.first_name}`
      );
    } catch (err) {
      console.error(
        `❌ Step 3 file upload failed for ${student.name.first_name}`,
        err.response?.data || err.message
      );
    }
  }

  try {
    await axios.put(
      `${API_BASE_URL}/students/evaluation-form/submit/${assessmentId}`,
      {},
      { headers: { Authorization: `Bearer ${JWT_TOKEN}` } }
    );
    console.log(`🎉 Evaluation form submitted for ${assessmentId}`);
  } catch (err) {
    console.error(
      `❌ Final submission failed for ${assessmentId}`,
      err.response?.data || err.message
    );
  }
}

async function runEvaluationUpload(
  filePath = "./output/evaluation_form_with_ids.csv"
) {
  const workbook = xlsx.readFile(filePath, {
    cellText: false,
    cellDates: true,
    codepage: 65001,
  });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);
  for (const row of rows) {
    await uploadEvaluation(row);
  }
  console.log("✅ All evaluation forms processed");
}

module.exports = { runEvaluationUpload };
