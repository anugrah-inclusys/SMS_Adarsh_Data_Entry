const axios = require("axios");
const xlsx = require("xlsx");
const { writeFileSync } = require("fs");
const { utils, writeFile } = require("xlsx");
const {
  parseExcelDate,
  parseAddress,
  parseFullName,
  parseToString,
  parsePhoneNumbers,
  parseDate,
} = require("./uploadHelper");
const { API_BASE_URL, JWT_TOKEN } = require("../config/config");

async function uploadEnquiry(row) {
  let studentId;
  let admissionId;
  const parsedName = parseFullName(row["Student Name"]);
  const parsedAddress = parseAddress(row["ADDRESS"]);
  const fatherParsed = parseFullName(row["FATHER'S NAME"]);
  const motherParsed = parseFullName(row["MOTHER'NAME"]);
  const { mobile, alternate, phone_residence } = parsePhoneNumbers(
    row["PHONE NO."]
  );
  const autosaveSteps = [
    {
      step: 1,
      payload: {
        name: parsedName,
        date_of_birth: parseDate(row["DATE OF BIRTH"]),
        gender: row["GENDER"].toLowerCase() || "",
      },
    },
    {
      step: 2,
      payload: {
        family_id: {
          father_name: fatherParsed,
          mother_name: motherParsed,
        },
      },
    },
    {
      step: 3,
      payload: {
        address_id: {
          ...parsedAddress,
        },
      },
    },
    {
      step: 4,
      payload: {
        contact_info: {
          mobile_number: mobile || "",
          alternate_mobile_number: alternate || "",
          phone_residence: phone_residence || "",
          email: "",
        },
      },
    },
    {
      step: 5,
      payload: {
        assessment: {
          referred_by: parseToString(row["REFERRED BY"]) || "",
          preliminary_diagnosis: {
            name: row["DIAGNOSIS"] || "",
          },
        },
      },
    },
  ];

  // Step-by-step autosave
  const firstStep = autosaveSteps[0];
  try {
    const res = await axios.post(
      `${API_BASE_URL}/students/enquiry/autosave/1`,
      firstStep.payload,
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    studentId = res.data.data._id;
    console.log(`✅ Step 1 created student ${studentId}`);
  } catch (err) {
    console.error(
      "❌ Failed to create student",
      err.response?.data || err.message
    );
    return;
  }

  // Subsequent calls → Update student
  for (let i = 1; i < autosaveSteps.length; i++) {
    const { step, payload } = autosaveSteps[i];
    try {
      const res = await axios.put(
        `${API_BASE_URL}/students/enquiry/autosave/${studentId}/${step}`,
        payload,
        {
          headers: { Authorization: `Bearer ${JWT_TOKEN}` },
        }
      );
      console.log(`✅ Step ${step} updated for ${studentId}`);
    } catch (err) {
      console.error(
        `❌ Step ${step} failed`,
        err.response?.data || err.message
      );
    }
  }

  // Final Submission
  const submissionPayload = {
    name: parsedName,
    gender: row["GENDER"] || "",
    date_of_birth: parseDate(row["DATE OF BIRTH"]),
    contact_info: {
      mobile_number: mobile || "",
      alternate_mobile_number: alternate || "",
      phone_residence: phone_residence || "",
      email: "",
    },
    family_id: {
      father_name: fatherParsed,
      mother_name: motherParsed,
    },
    address_id: {
      ...parsedAddress,
    },
    assessment: {
      referred_by: row["REFERRED BY"] || "",
      preliminary_diagnosis: {
        name: row["DIAGNOSIS"] || "",
      },
    },
  };

  try {
    const res = await axios.put(
      `${API_BASE_URL}/students/enquiry/submit/${studentId}`,
      submissionPayload,
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    console.log(`🎉 Enquiry submitted: ${row["Student Name"]} (${studentId})`);
  } catch (err) {
    console.error(
      `❌ Submission failed for ${row["Student Name"]}`,
      err.response?.data || err.message
    );
  }
  // Final approval
  const payload = {
    admission_id: row["ADMN No."],
    //ACT
    date_of_admission: parseExcelDate(row["DATE OF JOINING"]),

    // //ACE
    // date_of_admission: parseDate(row["DATE OF JOINING"]),
  };
  try {
    const response = await axios.post(
      `${API_BASE_URL}/students/admission-form/approve/${studentId}`,
      payload,
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    admissionId = response.data.admission_id;
    console.log(`🎯 Admission approved for ${row["Student Name"]}`);
  } catch (err) {
    console.error(
      `❌ Approval failed for ${row["Student Name"]}`,
      err.response?.data || err.message
    );
  } finally {
    return { studentId, admissionId };
  }
}

async function runEnquiryUpload(filePath = "./data/enquiry.csv") {
  const workbook = xlsx.readFile(filePath, {
    cellText: false,
    cellDates: true,
    codepage: 65001,
  });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  const results = [];
  for (const row of rows) {
    const { studentId, admissionId } = await uploadEnquiry(row);
    if (studentId) {
      const { first_name, last_name } = parseFullName(row["Student Name"]);
      results.push({
        STUDENT_ID: studentId,
        ADMISSION_ID: admissionId,
        NAME: `${first_name} ${last_name}`,
      });
    }
  }

  console.log("✅ All enquiry records processed");
  const outputSheet = utils.json_to_sheet(results);
  const outputWorkbook = utils.book_new();
  utils.book_append_sheet(outputWorkbook, outputSheet, "Enquiry IDs");
  writeFile(outputWorkbook, "./output/student_ids.xlsx");

  console.log("✅ All enquiry records processed and student IDs saved.");
}

module.exports = { runEnquiryUpload };
