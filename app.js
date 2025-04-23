const { runEnquiryUpload } = require("./services/uploadEnquiry");
const { runStaffUpload } = require("./services/uploadStaff");
const { runAdmissionUpload } = require("./services/uploadAdmission");

(async () => {
  try {
    // await runStaffUpload();
    // await runEnquiryUpload();
    await runAdmissionUpload();

    console.log("🎉 Upload complete!");
  } catch (err) {
    console.error("🚨 Upload failed!", err);
  }
})();
