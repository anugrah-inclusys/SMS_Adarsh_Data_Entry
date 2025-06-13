const axios = require("axios");
const xlsx = require("xlsx");
const {
  parseExcelDate,
  parseAddress,
  parseFullName,
  removeSpaces,
  parsePhoneNumbers,
  parseToNumber,
  getAdmissionFilesForRow,
} = require("./uploadHelper");
const { API_BASE_URL, JWT_TOKEN, HEADERS } = require("../config/config");
const { getUnitClassLookup } = require("./unitClassLookup");
const fs = require("fs");
const FormData = require("form-data");

async function fetchStudentDetails(studentId) {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/students/enquiry/${studentId}`,
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    return res.data;
  } catch (err) {
    console.error(
      `❌ Failed fetching student: ${studentId}`,
      err.response?.data || err.message
    );
    return null;
  }
}

function mapExcelRowToSteps(row, student) {
  const steps = [];
  const { mobile, phone_residence, alternate } = parsePhoneNumbers(
    row["PHONE NO."]
  );
  if (row["Student Name"] || row["ADHAR CARD NO:"]) {
    const parsedName = parseFullName(row["Student Name"]);
    steps.push({
      step: 1,
      payload: {
        firstName: parsedName.first_name,
        lastName: parsedName.last_name,
        dob: parseExcelDate(row["DATE OF BIRTH"]),
        age: student?.age || "",
        gender: row["GENDER"],
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
        permHouseName: address.house_name || "",
        permStreetName: address.street || "",
        permCity: address.city || "",
        permDistrict: address.district || "",
        permState: address.state || "",
        permPinCode: address.postal_code || "",
      },
    });
  }
  if (row["ADDRESS"]) {
    const address = parseAddress(row["ADDRESS"]);
    steps.push({
      step: 4,
      payload: {
        presHouseName: address.house_name || "",
        presStreetName: address.street || "",
        presCity: address.city || "",
        presDistrict: address.district || "",
        presState: address.state || "",
        presPinCode: address.postal_code || "",
      },
    });
  }

  if (row["DIAGNOSIS"]) {
    steps.push({
      step: 5,
      payload: {
        childProblemDescription: row["DIAGNOSIS"],
        email: "",
        phone: phone_residence || "",
        mobile_number: mobile || "",
      },
    });
  }

  if (row["FEES"] || row["VEHICLE FEE"]) {
    steps.push({
      step: 7,
      payload: {
        referredTo: "",
        rehabCharge: parseToNumber(row["FEES"]),
        adminCharge: "",
        ptaContribution: "",
        transportCharge: parseToNumber(row["VEHICLE FEE"]),
        totalFee: "",
      },
    });
  }

  return steps;
}

async function buildSubmissionPayload(row, student) {
  const parsedName = parseFullName(row["Student Name"]);
  const parsedAddress = parseAddress(row["ADDRESS"]);
  const { unitMap, classMap } = await getUnitClassLookup();
  const unitName = (row["UNIT"] || "").trim().toLowerCase();
  const className = (row["CLASS"] || "").trim().toLowerCase();
  const unit_id = unitMap[unitName] || "";
  const class_id = classMap[`${unitName}|${className}`] || "";
  const { mobile, phone_residence } = parsePhoneNumbers(row["PHONE NO."]);

  if (!unit_id || !class_id) {
    console.warn(
      `⚠️ Missing unit/class ID for ${row["Student Name"]}: ${unitName}, ${className}`
    );
  }
  return {
    name: parsedName,
    date_of_birth: parseExcelDate(row["DATE OF BIRTH"]),
    age: student?.age || "",
    gender: row["GENDER"],
    encryptedFields: {
      aadhaarNumber: row["ADHAR CARD NO:"] || "",
      caste: row["RELIGION&CASTE"]?.split(" - ")[1] || "",
      category: row["CATEGORY"] || "",
      disabilityPercentage: row["PERCENTAGE"] || "",
      religion: row["RELIGION&CASTE"]?.split(" - ")[0] || "",
    },
    contact_info: {
      phone_residence: phone_residence || "",
      email: "",
      mobile_number: mobile || "",
    },
    address_id: {
      permanent: {
        permHouseName: parsedAddress.house_name || "",
        permStreetName: parsedAddress.street || "",
        permCity: parsedAddress.city || "",
        permDistrict: parsedAddress.district || "",
        permState: parsedAddress.state || "",
        permPinCode: parsedAddress.postal_code || "",
      },
      present: {
        presHouseName: parsedAddress.house_name || "",
        presStreetName: parsedAddress.street || "",
        presCity: parsedAddress.city || "",
        presDistrict: parsedAddress.district || "",
        presState: parsedAddress.state || "",
        presPinCode: parsedAddress.postal_code || "",
      },
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
        rehabCharge: parseToNumber(row["FEES"]),
        adminCharge: "",
        ptaContribution: "",
        transportCharge: parseToNumber(row["VEHICLE FEE"]),
        totalFee: "",
      },
      scholarship_details: {
        scholarship: "",
        scholarshipAmount: "",
      },
    },
    childProblemDescription: row["DIAGNOSIS"] || "",
    email: "",
    phone: phone_residence || "",
    mobile_number: mobile || "",
    unit_id: unit_id,
    class_id: class_id,
  };
}

async function uploadAdmission(row, studentId) {
  const student = await fetchStudentDetails(studentId);
  if (!student) return;

  const steps = mapExcelRowToSteps(row, student);

  for (const { step, payload } of steps) {
    try {
      const res = await axios.put(
        `${API_BASE_URL}/students/admission-form/autosave/${studentId}/${step}`,
        payload,
        {
          headers: { Authorization: `Bearer ${JWT_TOKEN}` },
        }
      );
      console.log(`✅ Step ${step} uploaded for ${row["Student Name"]}`);
    } catch (err) {
      console.error(
        `❌ Step ${step} failed for ${row["Student Name"]}`,
        err.response?.data || err.message
      );
    }
  }
  async function uploadAdmissionDocumentsStep6(row, studentId) {
    const fileMap = getAdmissionFilesForRow(row, "ADMISSION ID");
    if (Object.keys(fileMap).length === 0) {
      console.log(`ℹ️ No Step 6 files found for ${studentId}`);
      return;
    }
    const requiredFiles = [
      "aadhaar",
      "disability_certificate",
      "birth_certificate",
    ];
    for (const req of requiredFiles) {
      if (!fileMap[req]) {
        console.warn(`⚠️ Missing required file '${req}' for ${studentId}`);
      }
    }

    const form = new FormData();
    for (const [fieldName, filePath] of Object.entries(fileMap)) {
      form.append(fieldName, fs.createReadStream(filePath));
    }

    try {
      await axios.put(
        `${API_BASE_URL}/students/admission-form/autosave/${studentId}/6`,
        form,
        {
          headers: HEADERS(form),
        }
      );
      console.log(`✅ Step 6 files uploaded for ${row["Student Name"]}`);
    } catch (err) {
      console.error(
        `❌ Step 6 file upload failed for ${row["Student Name"]}`,
        err.response?.data || err.message
      );
    }
  }
  await uploadAdmissionDocumentsStep6(row, studentId);

  // Final submission
  const submissionPayload = await buildSubmissionPayload(row, student);
  try {
    await axios.put(
      `${API_BASE_URL}/students/admission-form/submit/${studentId}`,
      submissionPayload,
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    console.log(`🎉 Admission form submitted for ${row["Student Name"]}`);
  } catch (err) {
    console.error(
      `❌ Final submission failed for ${row["Student Name"]}`,
      err.response?.data || err.message
    );
  }
  // // Final approval
  // const payload = {
  //   admission_id: row["ADMN No."],
  //   date_of_admission: parseExcelDate(row["DATE OF JOINING"]),
  // };
  // try {
  //   await axios.post(
  //     `${API_BASE_URL}/students/admission-form/approve/${studentId}`,
  //     payload,
  //     {
  //       headers: { Authorization: `Bearer ${JWT_TOKEN}` },
  //     }
  //   );
  //   console.log(`🎯 Admission approved for ${row["Student Name"]}`);
  // } catch (err) {
  //   console.error(
  //     `❌ Approval failed for ${row["Student Name"]}`,
  //     err.response?.data || err.message
  //   );
  // }
}

async function runAdmissionUpload(
  filePath = "./output/admission_with_ids.csv"
) {
  const workbook = xlsx.readFile(filePath, {
    cellText: false,
    cellDates: true,
    codepage: 65001,
  });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  for (const row of rows) {
    const studentId = row["STUDENT ID"] || "";
    if (!studentId) {
      console.warn(
        `⚠️ Skipping row with missing STUDENT ID: ${row["Student Name"]}`
      );
      continue;
    }

    await uploadAdmission(row, studentId);
  }

  console.log("✅ All admission records processed");
}

module.exports = { runAdmissionUpload };
