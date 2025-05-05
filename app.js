const { runEnquiryUpload } = require("./services/uploadEnquiry");
const { runStaffUpload } = require("./services/uploadStaff");
const { runAdmissionUpload } = require("./services/uploadAdmission");
const {
  runSpecialEducationAssessmentUpload,
} = require("./services/uploadSpecialEducationAssessment");
const {
  runPhysiotherapyAssessmentUpload,
} = require("./services/uploadPhysioTherapyAssessment");
const {
  runOccupationalTherapyAssessmentUpload,
} = require("./services/uploadOccupationaltherapyAssessment");
const { injectStudentIds } = require("./services/injectStudentIdIntoAdmission");
const {
  runInitialAssessmentUpload,
} = require("./services/uploadInitialAssessment");
const {
  runPsychologyAssessmentUpload,
} = require("./services/uploadPsychologyAssessment");
const {
  runSpeechAssessmentUpload,
} = require("./services/uploadSpeechAssessment");
const {
  runSpecialEducationTermUpload,
} = require("./services/uploadSpecialEducationTerm");
const { runEvaluationUpload } = require("./services/uploadEvaluation");
const {
  runSocialSkillsChecklistUpload,
} = require("./services/uploadSocialSkillsChecklist");
const { runADLChecklistUpload } = require("./services/uploadADLChecklist");
const {
  runSensoryChecklistUpload,
} = require("./services/uploadSensoryChecklist");
const {
  runLifeSkillsChecklistUpload,
} = require("./services/uploadLifeSkillsChecklist");
const { runComprehensiveAssessmentUpload } = require('./services/uploadComprehensiveAssessment');
const { runTechnicalTermUpload } = require("./services/uploadTechnicalTerm");
const { runTechnicalTermReportUpload } = require("./services/uploadTechnicalTermReport.JS");
const { runSpecialEducationReportUpload } = require("./services/uploadSpecialEducationReport");

(async () => {
  try {

    // //staff upload
    // await runStaffUpload();


    // //enquiry form
    // await runEnquiryUpload();

    // //admission form
    // await injectStudentIds({
    //   admissionPath: "./data/enquiry.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/admission_with_ids.csv",
    // });
    // await runAdmissionUpload();

    // //initial assessment
    // await injectStudentIds({
    //   admissionPath: "./data/initial_assessment.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/initial_assessment_with_ids.csv",
    // });
    // await runInitialAssessmentUpload();

    // //special education term assessment
    // await injectStudentIds({
    //   admissionPath: "./data/special_education_term.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/special_education_term_with_ids.csv",
    // });
    // await runSpecialEducationTermUpload()

    //// special education assessment-teacher
    // await injectStudentIds({
    //   admissionPath: "./data/special_education_assessment.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/special_education_assessment_with_ids.csv",
    // });
    // await runSpecialEducationAssessmentUpload()

    // //physiotherapy assessment
    // await injectStudentIds({
    //   admissionPath: "./data/physiotherapy_assessment.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/physiotherapy_assessment_with_ids.csv",
    // });
    // await runPhysiotherapyAssessmentUpload()

    // //occupational therapy assessment assessment
    // await injectStudentIds({
    //   admissionPath: './data/occupational_therapy_assessment.csv',
    //   enquiryIdsPath: './output/student_ids.xlsx',
    //   outputPath: './output/occupational_therapy_assessment_with_ids.csv',
    // });
    // await runOccupationalTherapyAssessmentUpload();

    ////psychology assessment assessment
    // await injectStudentIds({
    //   admissionPath: './data/psychology_assessement.csv',
    //   enquiryIdsPath: './output/student_ids.xlsx',
    //   outputPath: './output/psychology_assessment_with_ids.csv',
    // });
    // await runPsychologyAssessmentUpload();

    // //speech therapy assessment assessment
    // await injectStudentIds({
    //   admissionPath: './data/SpeechAssessment.csv',
    //   enquiryIdsPath: './output/student_ids.xlsx',
    //   outputPath: './output/speech_assessment_with_ids.csv',
    // });
    // await runSpeechAssessmentUpload();

    ////comprehensive assessment
    // await injectStudentIds({
    //   admissionPath: './data/comprehensive.csv',
    //   enquiryIdsPath: './output/student_ids.xlsx',
    //   outputPath: './output/comprehensive_assessment_with_ids.csv',
    // });
    // await runComprehensiveAssessmentUpload();

    // //Technical term assessment
    // await injectStudentIds({
    //   admissionPath: './data/technicalTermAssessment.csv',
    //   enquiryIdsPath: './output/student_ids.xlsx',
    //   outputPath: './output/technical_term_assessment_with_ids.csv',
    // });
    // await runTechnicalTermUpload();

    // //Technical term report
    // await injectStudentIds({
    //   admissionPath: './data/technicalTermReport.csv',
    //   enquiryIdsPath: './output/student_ids.xlsx',
    //   outputPath: './output/technical_term_report_with_ids.csv',
    // });
    // await runTechnicalTermReportUpload();

    //special education term report
    await injectStudentIds({
      admissionPath: './data/specialEducationTermReport.csv',
      enquiryIdsPath: './output/student_ids.xlsx',
      outputPath: './output/special_education_report_with_ids.csv',
    });
    await runSpecialEducationReportUpload();


    // //evaluation form
    // await injectStudentIds({
    //   admissionPath: "./data/evaluation_form.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/evaluation_form_with_ids.csv",
    // });
    // await runEvaluationUpload();

    // // social-skills-checklist
    // await injectStudentIds({
    //   admissionPath: "./data/social_skills_checklist.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/social_skills_checklist_with_ids.csv",
    // });
    // await runSocialSkillsChecklistUpload();

    // // adl-checklist
    // await injectStudentIds({
    //   admissionPath: "./data/adl_checklist.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/adl_checklist_with_ids.csv",
    // });
    // await runADLChecklistUpload();

    // // sensory_dysfunction-checklist
    // await injectStudentIds({
    //   admissionPath: "./data/sensory_dysfunction.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/sensory_dysfunction_with_ids.csv",
    // });
    // await runSensoryChecklistUpload();

    // // life_skills_checklist-checklist
    // await injectStudentIds({
    //   admissionPath: "./data/life_skills_checklist.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/life_skills_checklist_with_ids.csv",
    // });
    // await runLifeSkillsChecklistUpload();

    console.log("🎉 Upload complete!");
  } catch (err) {
    console.error("🚨 Upload failed!", err);
  }
})();
