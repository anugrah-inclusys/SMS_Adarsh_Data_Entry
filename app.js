const { runEnquiryUpload } = require("./services/uploadEnquiry");
const { runStaffUpload } = require("./services/uploadStaff");
// const { runAdmissionUpload } = require("./services/uploadAdmission");

(async () => {
  try {
    // await runStaffUpload();
    await runEnquiryUpload();
    console.log("🎉 Upload complete!");
  } catch (err) {
    console.error("🚨 Upload failed!", err);
  }
})();
