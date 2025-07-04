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
const {
  runComprehensiveAssessmentUpload,
} = require("./services/uploadComprehensiveAssessment");
const { runTechnicalTermUpload } = require("./services/uploadTechnicalTerm");
const {
  runTechnicalTermReportUpload,
} = require("./services/uploadTechnicalTermReport.JS");
const {
  runSpecialEducationReportUpload,
} = require("./services/uploadSpecialEducationReport");
const { runMedicalFilesUpload } = require("./services/uploadMedicalFiles");
const { runLestFileUpload } = require("./services/uploadLEST");
const { runTdscFileUpload } = require("./services/uploadTDSC");
const { runReAssessmentUpload } = require("./services/uploadReAssessment");
const {
  runMiscellaneousFilesUpload,
} = require("./services/uploadMiscellaneousFiles");
const {
  runPreVocationalChecklistUpload,
} = require("./services/uploadPreVocationalChecklist");
const { runGenericSkillsUpload } = require("./services/uploadGenericTool");
const { runISSAUpload } = require("./services/uploadISSA");

(async () => {
  try {
    // Staff upload - admin/office_staff
    // await runStaffUpload();

    // // Enquiry form-admin
    // await runEnquiryUpload();

    // // Admission form-admin
    // await injectStudentIds({
    //   admissionPath: "./data/enquiry.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/admission_with_ids.csv",
    // });
    // await runAdmissionUpload();

    // // Initial assessment-admin
    // await injectStudentIds({
    //   admissionPath: "./data/initial_assessment.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/initial_assessment_with_ids.csv",
    // });
    // await runInitialAssessmentUpload();

    // // Re-assessment assessment-admin
    // await injectStudentIds({
    //   admissionPath: "./data/re_assessment.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/re_assessment_with_ids.csv",
    // });
    // await runReAssessmentUpload();

    // // Comprehensive assessment-permission admin
    // await injectStudentIds({
    //   admissionPath: './data/comprehensive.csv',
    //   enquiryIdsPath: './output/student_ids.xlsx',
    //   outputPath: './output/comprehensive_assessment_with_ids.csv',
    // });
    // await runComprehensiveAssessmentUpload();

    // // Physiotherapy assessment-therapist
    // await injectStudentIds({
    //   admissionPath: "./data/physiotherapy_assessment.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/physiotherapy_assessment_with_ids.csv",
    // });
    // await runPhysiotherapyAssessmentUpload()

    // // Occupational therapy assessment assessment-therapist
    // await injectStudentIds({
    //   admissionPath: './data/occupational_therapy_assessment.csv',
    //   enquiryIdsPath: './output/student_ids.xlsx',
    //   outputPath: './output/occupational_therapy_assessment_with_ids.csv',
    // });
    // await runOccupationalTherapyAssessmentUpload();

    // // Psychology assessment assessment-therapist
    // await injectStudentIds({
    //   admissionPath: './data/psychology_assessement.csv',
    //   enquiryIdsPath: './output/student_ids.xlsx',
    //   outputPath: './output/psychology_assessment_with_ids.csv',
    // });
    // await runPsychologyAssessmentUpload();

    // // Speech therapy assessment assessment-therapist
    // await injectStudentIds({
    //   admissionPath: './data/SpeechAssessment.csv',
    //   enquiryIdsPath: './output/student_ids.xlsx',
    //   outputPath: './output/speech_assessment_with_ids.csv',
    // });
    // await runSpeechAssessmentUpload();

    // // Technical term assessment-therapist
    // await injectStudentIds({
    //   admissionPath: './data/technicalTermAssessment.csv',
    //   enquiryIdsPath: './output/student_ids.xlsx',
    //   outputPath: './output/technical_term_assessment_with_ids.csv',
    // });
    // await runTechnicalTermUpload();

    // // Technical term report-therapist
    // await injectStudentIds({
    //   admissionPath: './data/technicalTermReport.csv',
    //   enquiryIdsPath: './output/student_ids.xlsx',
    //   outputPath: './output/technical_term_report_with_ids.csv',
    // });
    // await runTechnicalTermReportUpload();

    // // Special education term assessment-teacher
    // await injectStudentIds({
    //   admissionPath: "./data/special_education_term.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/special_education_term_with_ids.csv",
    // });
    // await runSpecialEducationTermUpload()

    // // Special education term report-teacher
    // await injectStudentIds({
    //   admissionPath: './data/specialEducationTermReport.csv',
    //   enquiryIdsPath: './output/student_ids.xlsx',
    //   outputPath: './output/special_education_report_with_ids.csv',
    // });
    // await runSpecialEducationReportUpload();

    // // Special education assessment-teacher
    // await injectStudentIds({
    //   admissionPath: "./data/special_education_assessment.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/special_education_assessment_with_ids.csv",
    // });
    // await runSpecialEducationAssessmentUpload()

    // // Evaluation form-teacher
    // await injectStudentIds({
    //   admissionPath: "./data/evaluation_form.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/evaluation_form_with_ids.csv",
    // });
    // await runEvaluationUpload();

    // // Social-skills-checklist-teacher
    // await injectStudentIds({
    //   admissionPath: "./data/social_skills_checklist.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/social_skills_checklist_with_ids.csv",
    // });
    // await runSocialSkillsChecklistUpload();

    // // ADL-checklist-teacher
    // await injectStudentIds({
    //   admissionPath: "./data/adl_checklist.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/adl_checklist_with_ids.csv",
    // });
    // await runADLChecklistUpload();

    // // Sensory_dysfunction-checklist-teacher
    // await injectStudentIds({
    //   admissionPath: "./data/sensory_dysfunction.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/sensory_dysfunction_with_ids.csv",
    // });
    // await runSensoryChecklistUpload();

    // // Life_skills_checklist-checklist-teacher
    // await injectStudentIds({
    //   admissionPath: "./data/life_skills_checklist.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/life_skills_checklist_with_ids.csv",
    // });
    // await runLifeSkillsChecklistUpload();

    // // PREVOCATIONAL _checklist-checklist-teacher
    // await injectStudentIds({
    //   admissionPath: "./data/pre_vocational_checklist.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/pre_vocational_checklist_with_ids.csv",
    // });
    // await runPreVocationalChecklistUpload();

    // // LEST -teacher
    // await injectStudentIds({
    //   admissionPath: "./data/lest.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/lest_with_ids.csv",
    // });
    // await runLestFileUpload();

    // // TDSC -teacher
    // await injectStudentIds({
    //   admissionPath: "./data/tdsc.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/tdsc_with_ids.csv",
    // });
    // await runTdscFileUpload();

    // // ISSA -teacher
    // await injectStudentIds({
    //   admissionPath: "./data/issa.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/issa_checklist_with_ids.csv",
    // });
    // await runISSAUpload();

    // // medical-files-teacher
    // await runMedicalFilesUpload();

    // // miscellaneous documents-teacher
    // await runMiscellaneousFilesUpload();

    //    // Generic skills-teacher-need to check createdAt
    // await injectStudentIds({
    //   admissionPath: "./data/generic_tool.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/generic_tool_with_ids.csv",
    // });
    // await runGenericSkillsUpload();

    console.log("🎉 Upload complete!");
  } catch (err) {
    console.error("🚨 Upload failed!", err);
  }
})();
