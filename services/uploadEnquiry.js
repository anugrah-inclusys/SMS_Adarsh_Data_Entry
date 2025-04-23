const axios = require("axios");
const xlsx = require("xlsx");
const {
  parseExcelDate,
  parseAddress,
  parseFullName,
  parseToString,
} = require("./uploadHelper");
const { API_BASE_URL, JWT_TOKEN } = require("../config/config");

async function uploadEnquiry(row) {
  let studentId;
  const parsedName = parseFullName(row["NAME OF STUDENT"]);
  const parsedAddress = parseAddress(row["ADDRESS"]);
  const fatherParsed = parseFullName(row["FATHER'S NAME"]);
  const motherParsed = parseFullName(row["MOTHER'NAME"]);

  const autosaveSteps = [
    {
      step: 1,
      payload: {
        name: parsedName,
        date_of_birth: parseExcelDate(row["DATE OF BIRTH"]),
        gender: row["SEX"] || "",
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
          mobile_number: row["PHONE NO."] || "",
          alternate_mobile_number: "",
          phone_residence: "",
          email: "",
        },
      },
    },
    {
      step: 5,
      payload: {
        assessment: {
          referred_by: parseToString(row["REFERRED BY"]) || "", // Add this column if applicable
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
    gender: row["SEX"] || "",
    date_of_birth: parseExcelDate(row["DATE OF BIRTH"]),
    contact_info: {
      mobile_number: row["PHONE NO."] || "",
      alternate_mobile_number: "",
      phone_residence: "",
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
    console.log(
      `🎉 Enquiry submitted: ${row["NAME OF STUDENT"]} (${studentId})`
    );
  } catch (err) {
    console.error(
      `❌ Submission failed for ${row["NAME OF STUDENT"]}`,
      err.response?.data || err.message
    );
  }
}

async function runEnquiryUpload(filePath = "./data/enquiry.csv") {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  for (const row of rows) {
    await uploadEnquiry(row);
  }

  console.log("✅ All enquiry records processed");
}

module.exports = { runEnquiryUpload };
