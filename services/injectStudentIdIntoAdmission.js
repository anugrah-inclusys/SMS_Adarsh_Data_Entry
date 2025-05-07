module.exports = {
  injectStudentIds: function ({ admissionPath, enquiryIdsPath, outputPath }) {
    const xlsx = require("xlsx");
    const admissionWb = xlsx.readFile(admissionPath);
    const admissionSheet = admissionWb.Sheets[admissionWb.SheetNames[0]];
    const admissionRows = xlsx.utils.sheet_to_json(admissionSheet);

    const enquiryWb = xlsx.readFile(enquiryIdsPath);
    const enquirySheet = enquiryWb.Sheets[enquiryWb.SheetNames[0]];
    const enquiryMap = xlsx.utils.sheet_to_json(enquirySheet);

    const nameToIdMap = {};
    for (const entry of enquiryMap) {
      const normalizedName = entry.NAME?.trim().toLowerCase();
      if (normalizedName) nameToIdMap[normalizedName] = entry.STUDENT_ID;
    }
    const nameToAdmissionIdMap = {};
    for (const entry of enquiryMap) {
      const normalizedName = entry.NAME?.trim().toLowerCase();
      if (normalizedName) nameToAdmissionIdMap[normalizedName] = entry.ADMISSION_ID;
    }

    const updatedAdmissions = admissionRows.map((row) => {
      const name = (row["Student Name"] || "").trim().toLowerCase();
      const studentId = nameToIdMap[name] || "";
      const admissionId = nameToAdmissionIdMap[name] || "";
      return {
        ...row,
        "STUDENT ID": studentId,
        "ADMISSION ID": admissionId,
      };
    });

    const outSheet = xlsx.utils.json_to_sheet(updatedAdmissions);
    const outBook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(outBook, outSheet, "Updated Admission");
    xlsx.writeFile(outBook, outputPath);

    console.log(`✅ Injected student IDs into ${outputPath}`);
  },
};
