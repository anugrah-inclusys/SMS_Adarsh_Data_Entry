const { runEnquiryUpload } = require("./services/uploadEnquiry");
const { runStaffUpload } = require("./services/uploadStaff");
const { runAdmissionUpload } = require("./services/uploadAdmission");
const { runSpecialEducationAssessmentUpload } = require("./services/uploadSpecialEducationAssessment");
const { injectStudentIds } = require("./services/injectStudentIdIntoAdmission");
const {
  runInitialAssessmentUpload,
} = require("./services/uploadInitialAssessment");

(async () => {
  try {
    // await runStaffUpload();
    // await runEnquiryUpload();
    // await injectStudentIds({
    //   admissionPath: "./data/enquiry.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/admission_with_ids.csv",
    // });
    // await runAdmissionUpload();
    // await injectStudentIds({
    //   admissionPath: "./data/initial_assessment.csv",
    //   enquiryIdsPath: "./output/student_ids.xlsx",
    //   outputPath: "./output/initial_assessment_with_ids.csv",
    // });
    // await runInitialAssessmentUpload();
    await injectStudentIds({
      admissionPath: "./data/special_education_assessment.csv",
      enquiryIdsPath: "./output/student_ids.xlsx",
      outputPath: "./output/special_education_assessment_with_ids.csv",
    });
    await runSpecialEducationAssessmentUpload()


    console.log("🎉 Upload complete!");
  } catch (err) {
    console.error("🚨 Upload failed!", err);
  }
})();
