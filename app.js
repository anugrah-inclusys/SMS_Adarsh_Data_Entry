const { runEnquiryUpload } = require('./services/uploadEnquiry');
const { runStaffUpload } = require('./services/uploadStaff');
const { runAdmissionUpload } = require('./services/uploadAdmission');
const {
  runSpecialEducationAssessmentUpload,
} = require('./services/uploadSpecialEducationAssessment');
const {
  runPhysiotherapyAssessmentUpload,
} = require('./services/uploadPhysioTherapyAssessment');
const {
  runOccupationalTherapyAssessmentUpload,
} = require('./services/uploadOccupationaltherapyAssessment');
const { injectStudentIds } = require('./services/injectStudentIdIntoAdmission');
const {
  runInitialAssessmentUpload,
} = require('./services/uploadInitialAssessment');
const {
  runPsychologyAssessmentUpload,
} = require('./services/uploadPsychologyAssessment');
const { runSpeechAssessmentUpload } = require('./services/uploadSpeechAssessment');
const { runSpecialEducationTermUpload } = require("./services/uploadSpecialEducationTerm");
const { runEvaluationUpload } = require("./services/uploadEvaluation");
const { runComprehensiveAssessmentUpload } = require('./services/uploadComprehensiveAssessment');

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


    //initial assessment
    // await injectStudentIds({
    //   admissionPath: "./data/initial_assessment.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/initial_assessment_with_ids.csv",
    // });
    // await runInitialAssessmentUpload();

//special education term assessment-teacher
    // await injectStudentIds({
    //   admissionPath: "./data/special_education_term.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/special_education_term_with_ids.csv",
    // });
    // await runSpecialEducationTermUpload()

    //special education assessment-teacher
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

    //psychology assessment assessment
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

    //comprehensive assessment
    await injectStudentIds({
      admissionPath: './data/comprehensive.csv',
      enquiryIdsPath: './output/student_ids.xlsx',
      outputPath: './output/comprehensive_assessment_with_ids.csv',
    });
    await runComprehensiveAssessmentUpload();


    // //evaluation form
    // await injectStudentIds({
    //   admissionPath: "./data/evaluation_form.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/evaluation_form_with_ids.csv",
    // });
    // await runEvaluationUpload()

    console.log('🎉 Upload complete!');
  } catch (err) {
    console.error('🚨 Upload failed!', err);
  }
})();
