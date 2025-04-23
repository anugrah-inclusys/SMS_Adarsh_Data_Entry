const axios = require("axios");
const xlsx = require("xlsx");
const { parseExcelDate, parseAddress, parseFullName } = require("./uploadHelper");
const { API_BASE_URL, JWT_TOKEN } = require("../config/config");

async function uploadEnquiry(row) {
  let studentId;
  const parsedAddress = parseAddress(row["ADDRESS"]);
  const fatherNameParsed = parseFullName(row["FATHER'S NAME"]);
  const motherNameParsed = parseFullName(row["MOTHER'NAME"]);
  const autosaveSteps = [
    {
      step: 1,
      payload: {
        name: {
          first_name: row["NAME OF STUDENT"] || "",
          last_name: "", // Can be derived if needed
        },
        date_of_birth: parseExcelDate(row["DATE OF BIRTH"]),
        gender: row["SEX"]?.toUpperCase() || "",
      },
    },
    {
      step: 2,
      payload: {
        family_id: {
          father_name: fatherNameParsed,
          mother_name: motherNameParsed,
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
          referred_by: row["REFERRED BY"] || "", // Add this column if applicable
          preliminary_diagnosis: {
            name: row["DIAGNOSIS"] || "",
          },
        },
      },
    },
  ];

  // Step-by-step autosave
  for (const { step, payload } of autosaveSteps) {
    const url = `${API_BASE_URL}/students/enquiry/autosave/${step}`;

    try {
      const res = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      });
      studentId = res.data.data._id;
      console.log(
        `✅ Step ${step} saved for ${payload.name?.first_name || studentId}`
      );
    } catch (err) {
      console.error(
        `❌ Step ${step} failed:`,
        err.response?.data || err.message
      );
      return;
    }
  }

  // Final Submission
  const submissionPayload = {
    name: {
      first_name: row["NAME OF STUDENT"] || "",
      last_name: "",
    },
    gender: row["SEX"] || "",
    date_of_birth: parseExcelDate(row["DATE OF BIRTH"]),
    contact_info: {
      phone: row["PHONE NO."] || "",
    },
    family_id: {
      father_name: row["FATHER'S NAME"] || "",
      mother_name: row["MOTHER'NAME"] || "",
    },
    address_id: {
      full_address: row["ADDRESS"] || "",
      panchayat: row["MUNICIPALITY/PANCHAYATH"] || "",
    },
    assessment: {
      reason: row["DIAGNOSIS"] || "",
      certificate: row["DIAGNOSIS -CERTIFICATE"] || "",
      percentage: row["PERCENTAGE"] || "",
    },
    aadhaar: row["ADHAR CARD NO:"] || "",
    class: `${row["CLASS"] || ""} ${row["CLASS.1"] || ""}`.trim(),
    religion: row["RELIGION&CASTE"] || "",
    admin_no: row["ADMN No."] || "",
    date_of_joining: parseExcelDate(row["DATE OF JOINING"]),
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
