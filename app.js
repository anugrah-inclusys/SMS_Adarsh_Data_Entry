const { runEnquiryUpload } = require("./services/uploadEnquiry");
const { runStaffUpload } = require("./services/uploadStaff");
const { runAdmissionUpload } = require("./services/uploadAdmission");
const { injectStudentIds } = require("./services/injectStudentIdIntoAdmission");

(async () => {
  try {
    // await runStaffUpload();
    await runEnquiryUpload();
    await injectStudentIds({
      admissionPath: "./data/admission.csv",
      enquiryIdsPath: "./output/student_ids.xlsx",
      outputPath: "./output/admission_with_ids.csv",
    });
    await runAdmissionUpload();

    console.log("🎉 Upload complete!");
  } catch (err) {
    console.error("🚨 Upload failed!", err);
  }
})();
