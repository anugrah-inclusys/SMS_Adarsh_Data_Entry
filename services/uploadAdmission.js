const axios = require("axios");
const xlsx = require("xlsx");
const {
  parseExcelDate,
  parseAddress,
  parseFullName,
  removeSpaces,
} = require("./uploadHelper");
const { API_BASE_URL, JWT_TOKEN } = require("../config/config");

function mapExcelRowToSteps(row) {
  const steps = [];

  if (row["NAME OF STUDENT"] || row["ADHAR CARD NO:"]) {
    const parsedName = parseFullName(row["NAME OF STUDENT"]);
    steps.push({
      step: 1,
      payload: {
        firstName: parsedName.first_name,
        lastName: parsedName.last_name,
        dob: parseExcelDate(row["DATE OF BIRTH"]),
        age: row["AGE"],
        gender: row["SEX"],
        religion: row["RELIGION&CASTE"]?.split(" - ")[0] || "",
        caste: row["RELIGION&CASTE"]?.split(" - ")[1] || "",
        aadhaarNumber: removeSpaces(row["ADHAR CARD NO:"]) || "",
        disabilityPercentage: row["PERCENTAGE"] || "",
        category: row["CLASS.1"] || "",
      },
    });
  }

  if (row["FATHER'S NAME"] || row["MOTHER'NAME"]) {
    steps.push({
      step: 2,
      payload: {
        parentName: row["FATHER'S NAME"],
        parentOccupation: "",
        motherName: row["MOTHER'NAME"],
        annualIncome: "",
        panchayathCorporation: row["MUNICIPALITY/PANCHAYATH"] || "",
      },
    });
  }

  if (row["ADDRESS"]) {
    const address = parseAddress(row["ADDRESS"]);
    steps.push({
      step: 3,
      payload: {
        permHouseName: address.house_name,
        permStreetName: address.street,
        permCity: address.city,
        permDistrict: address.city,
        permState: address.state,
        permPinCode: address.postal_code,
      },
    });
  }
  if (row["ADDRESS"]) {
    const address = parseAddress(row["ADDRESS"]);
    steps.push({
      step: 4,
      payload: {
        presHouseName: address.house_name,
        presStreetName: address.street,
        presCity: address.city,
        presDistrict: address.city,
        presState: address.state,
        presPinCode: address.postal_code,
      },
    });
  }

  if (row["DIAGNOSIS"]) {
    steps.push({
      step: 5,
      payload: {
        childProblemDescription: row["DIAGNOSIS"],
        email: "",
        phone: row["PHONE NO."] || "",
        mobile_number: "",
      },
    });
  }

  if (row["FEES"] || row["VEHICLE FEE"]) {
    steps.push({
      step: 7,
      payload: {
        referredTo: "",
        rehabCharge: row["FEES"],
        adminCharge: "",
        ptaContribution: "",
        transportCharge: row["VEHICLE FEE"],
        totalFee: "",
      },
    });
  }

  return steps;
}

function buildSubmissionPayload(row) {
  const parsedName = parseFullName(row["NAME OF STUDENT"]);
  const parsedAddress = parseAddress(row["ADDRESS"]);

  return {
    name: parsedName,
    date_of_birth: parseExcelDate(row["DATE OF BIRTH"]),
    age: row["AGE"],
    gender: row["SEX"],
    encryptedFields: {
      aadhaarNumber: row["ADHAR CARD NO:"] || "",
      caste: row["RELIGION&CASTE"]?.split(" - ")[1] || "",
      category: "",
      disabilityPercentage: row["PERCENTAGE"] || "",
      religion: row["RELIGION&CASTE"]?.split(" - ")[0] || "",
    },
    contact_info: {
      phone_residence: row["PHONE NO."] || "",
      email: "",
      mobile_number: "",
    },
    address_id: {
      permanent: {
        permHouseName: parsedAddress.house_name,
        permStreetName: parsedAddress.street,
        permCity: parsedAddress.city,
        permDistrict: parsedAddress.city,
        permState: parsedAddress.state,
        permPinCode: parsedAddress.postal_code,
      },
      present: {},
    },
    family_id: {
      background_details: {
        parentName: row["FATHER'S NAME"],
        parentOccupation: "",
        motherName: row["MOTHER'NAME"],
      },
    },
    fees_id: {
      referral_details: {
        referredTo: "",
        rehabCharge: row["FEES"],
        adminCharge: "",
        ptaContribution: "",
        transportCharge: row["VEHICLE FEE"],
        totalFee: "",
      },
      scholarship_details: {
        scholarship: "",
        scholarshipAmount: "",
      },
    },
    admission_info: {
      childProblemDescription: row["DIAGNOSIS"] || "",
      email: "",
      phone: row["PHONE NO."] || "",
      mobile_number: "",
    },
  };
}

async function uploadAdmission(row, studentId) {
  const steps = mapExcelRowToSteps(row);

  for (const { step, payload } of steps) {
    try {
      const res = await axios.put(
        `${API_BASE_URL}/students/admission-form/autosave/${studentId}/${step}`,
        payload,
        {
          headers: { Authorization: `Bearer ${JWT_TOKEN}` },
        }
      );
      console.log(`✅ Step ${step} uploaded for ${row["NAME OF STUDENT"]}`);
    } catch (err) {
      console.error(
        `❌ Step ${step} failed for ${row["NAME OF STUDENT"]}`,
        err.response?.data || err.message
      );
    }
  }

  // Final submission
  const submissionPayload = buildSubmissionPayload(row);
  try {
    await axios.put(
      `${API_BASE_URL}/students/admission-form/submit/${studentId}`,
      submissionPayload,
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    console.log(`🎉 Admission form submitted for ${row["NAME OF STUDENT"]}`);
  } catch (err) {
    console.error(
      `❌ Final submission failed for ${row["NAME OF STUDENT"]}`,
      err.response?.data || err.message
    );
  }
}

async function runAdmissionUpload(filePath = "./data/admission.csv") {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  for (const row of rows) {
    const studentId = row["STUDENT ID"] || "";
    if (!studentId) {
      console.warn(
        `⚠️ Skipping row with missing STUDENT ID: ${row["NAME OF STUDENT"]}`
      );
      continue;
    }

    await uploadAdmission(row, studentId);
  }

  console.log("✅ All admission records processed");
}

module.exports = { runAdmissionUpload };
