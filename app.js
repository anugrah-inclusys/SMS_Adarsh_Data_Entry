const { runEnquiryUpload } = require("./services/uploadEnquiry");
const { runStaffUpload } = require("./services/uploadStaff");
// const { runAdmissionUpload } = require("./services/uploadAdmission");

(async () => {
  try {
    // await runStaffUpload(); // Or choose another depending on CLI args
    await runEnquiryUpload(); // Or choose another depending on CLI args
    console.log("🎉 Upload complete!");
  } catch (err) {
    console.error("🚨 Upload failed!", err);
  }
})();
