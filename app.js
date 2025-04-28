const { runEnquiryUpload } = require("./services/uploadEnquiry");
const { runStaffUpload } = require("./services/uploadStaff");
const { runAdmissionUpload } = require("./services/uploadAdmission");
const { injectStudentIds } = require("./services/injectStudentIdIntoAdmission");
const {
  runInitialAssessmentUpload,
} = require("./services/uploadInitialAssessment");
const { runSpecialEducationTermUpload } = require("./services/uploadSpecialEducationTerm");

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
      admissionPath: "./data/special_education_term.csv",
      enquiryIdsPath: "./output/student_ids.xlsx",
      outputPath: "./output/special_education_term_with_ids.csv",
    });
    await runSpecialEducationTermUpload()

    console.log("🎉 Upload complete!");
  } catch (err) {
    console.error("🚨 Upload failed!", err);
  }
})();
