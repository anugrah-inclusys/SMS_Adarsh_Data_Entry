const axios = require("axios");
const xlsx = require("xlsx");
const {
  parseExcelDate,
  parseAddress,
  parseFullName,
  removeSpaces,
  parsePhoneNumbers,
} = require("./uploadHelper");
const { API_BASE_URL, JWT_TOKEN } = require("../config/config");
const { getUnitClassLookup } = require("./unitClassLookup");

function mapExcelRowToSteps(row) {
  const steps = [];
  const { mobile, alternate } = parsePhoneNumbers(row["PHONE NO."]);
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
        category: row["CATEGORY"] || "",
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
        phone: alternate || "",
        mobile_number: mobile || "",
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

async function buildSubmissionPayload(row) {
  const parsedName = parseFullName(row["NAME OF STUDENT"]);
  const parsedAddress = parseAddress(row["ADDRESS"]);
  const { unitMap, classMap } = await getUnitClassLookup();
  const unitName = (row["UNIT"] || "").trim().toLowerCase();
  const className = (row["CLASS"] || "").trim().toLowerCase();
  const unit_id = unitMap[unitName] || "";
  const class_id = classMap[`${unitName}|${className}`] || "";
  const { mobile, alternate } = parsePhoneNumbers(row["PHONE NO."]);

  if (!unit_id || !class_id) {
    console.warn(
      `⚠️ Missing unit/class ID for ${row["NAME OF STUDENT"]}: ${unitName}, ${className}`
    );
  }
  return {
    name: parsedName,
    date_of_birth: parseExcelDate(row["DATE OF BIRTH"]),
    age: row["AGE"],
    gender: row["SEX"],
    encryptedFields: {
      aadhaarNumber: row["ADHAR CARD NO:"] || "",
      caste: row["RELIGION&CASTE"]?.split(" - ")[1] || "",
      category: row["CATEGORY"] || "",
      disabilityPercentage: row["PERCENTAGE"] || "",
      religion: row["RELIGION&CASTE"]?.split(" - ")[0] || "",
    },
    contact_info: {
      phone_residence: alternate || "",
      email: "",
      mobile_number: mobile || "",
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
    childProblemDescription: row["DIAGNOSIS"] || "",
    email: "",
    phone: alternate || "",
    mobile_number: mobile || "",
    unit_id: unit_id,
    class_id: class_id,
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
  const submissionPayload = await buildSubmissionPayload(row);
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
  // Final approval
  const payload = {
    admission_id: row["ADMN No."],
    date_of_admission: parseExcelDate(row["DATE OF JOINING"]),
  };
  try {
    await axios.post(
      `${API_BASE_URL}/students/admission-form/approve/${studentId}`,
      payload,
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    console.log(`🎯 Admission approved for ${row["NAME OF STUDENT"]}`);
  } catch (err) {
    console.error(
      `❌ Approval failed for ${row["NAME OF STUDENT"]}`,
      err.response?.data || err.message
    );
  }
}

async function runAdmissionUpload(
  filePath = "./output/admission_with_ids.csv"
) {
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
