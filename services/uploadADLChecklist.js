const axios = require("axios");
const xlsx = require("xlsx");
const { parseFullName, parseExcelDate } = require("./uploadHelper");
const { API_BASE_URL, JWT_TOKEN } = require("../config/config");

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

function mapSteps(row, tabsStructure) {
  const steps = Array(8).fill({});

  tabsStructure.forEach((tab, index) => {
    if (tab.name === "REVIEW AND SUBMIT") return;
    steps[index] = tab.inputs.reduce((acc, input) => {
      acc[input] =
        row[`activities_of_daily_living.${tab.name.toLowerCase()}.${input}`] ||
        "";
      return acc;
    }, {});
  });

  return steps;
}

async function uploadADLChecklist(row, tabsStructure) {
  const studentId = row["STUDENT ID"];
  if (!studentId) {
    console.warn(`⚠️ Skipping row without student_id: ${row["Student Name"]}`);
    return;
  }

  const student = await fetchStudentDetails(studentId);
  if (!student) return;

  const { first_name, last_name } = parseFullName(row["Student Name"] || "");
  const createdAt = parseExcelDate(row["activities_of_daily_living.createdAt"]);
  const basePayload = {
    student_id: student._id,
    firstName: first_name,
    lastName: last_name,
    createdAt: createdAt,
  };

  const steps = mapSteps(row, tabsStructure);

  let assessmentId;

  // Step 1: Create ADL Checklist
  try {
    const payload = { ...basePayload, 0: steps[0] };
    const res = await axios.post(
      `${API_BASE_URL}/students/adl/autosave/${studentId}/1`,
      payload,
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    assessmentId = res.data.data._id;
    console.log(`✅ Step 1 created ADL checklist for ${assessmentId}`);
  } catch (err) {
    console.error(
      `❌ Failed creating ADL checklist`,
      err.response?.data || err.message
    );
    return;
  }

  // Step 2–8 Updates
  for (let i = 1; i < steps.length; i++) {
    try {
      const payload = { ...basePayload, [i]: steps[i] };
      await axios.put(
        `${API_BASE_URL}/students/adl/autosave/${studentId}/${i + 1}`,
        payload,
        {
          headers: { Authorization: `Bearer ${JWT_TOKEN}` },
        }
      );
      console.log(`✅ Step ${i + 1} updated for ${assessmentId}`);
    } catch (err) {
      console.error(
        `❌ Step ${i + 1} failed for ${assessmentId}`,
        err.response?.data || err.message
      );
    }
  }

  // Final submission
  try {
    await axios.put(
      `${API_BASE_URL}/students/adl/submit/${assessmentId}`,
      {},
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    console.log(`🎉 ADL checklist submitted for ${assessmentId}`);
  } catch (err) {
    console.error(
      `❌ Final submission failed for ${assessmentId}`,
      err.response?.data || err.message
    );
  }
}

async function runADLChecklistUpload(
  filePath = "./output/adl_checklist_with_ids.csv"
) {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  // Define tabsStructure locally here or import it
  const tabsStructure = [
    {
      name: "BRUSHING",
      inputs: [
        "Identify the brush",
        "Takes brush",
        "Wet the brush",
        "Identifies the paste",
        "Takes paste",
        "Open the lid",
        "Apply appropriate quantity of paste on the brush",
        "Close the lid of the paste tube",
        "Keep the paste tube back",
        "Hold the brush properly",
        "Brush gently",
        "Spit the paste",
        "Wash the mouth",
        "Spit the water",
        "Clean the tongue and mouth properly",
        "Wash the brush",
        "Keep the brush back to the same place",
        "Wash the face",
        "Wipe the face",
      ],
    },
    {
      name: "TOILETING",
      inputs: [
        "Identify the toilet needs",
        "Indicate the needs",
        "Identify the correct place for these needs",
        "Open the door of the toilet",
        "Enter the toilet",
        "Close the door",
        "Remove the clothes including the undergarments",
        "Keep the clothes aside",
        "Sit in the right position",
        "Pass the urine or motion",
        "Recognizing the toilet needs completed",
        "Wash the areas properly until it's clean",
        "Flush",
        "Use the hand wash",
        "Take the clothing back",
        "Wear it",
        "Open the door",
        "Come out",
      ],
    },
    {
      name: "BATHING",
      inputs: [
        "Identifies oil",
        "Takes oil",
        "Oils the hair",
        "Identifies towel & Clothes to wear after bath",
        "Takes towel & Clothes to wear after bath",
        "Identifies bathroom",
        "Get inside the bathroom",
        "Close the door",
        "Keep the towel and dress appropriately",
        "Remove clothing",
        "Open the tap / shower",
        "Pour water on the body",
        "Identifies soap from the bathroom",
        "Takes soap",
        "Apply soap on the body",
        "Rub the body with water and soap",
        "Pour water on head",
        "Identifies shampoo",
        "Takes shampoo",
        "Open the lid & take required amount of shampoo",
        "Apply shampoo on the head",
        "Clean the head with water",
        "Take the towel",
        "Dry the hair",
        "Dry the body",
        "Wear the cloth",
        "Come out from the bathroom",
      ],
    },
    {
      name: "DRESSING",
      inputs: [
        "Identifies dressing room",
        "Identifies out clothes",
        "Take clothes",
        "Close the door of dressing room",
        "Take our underwear",
        "Identifies front and back of underwear",
        "Wear underwear accordingly",
        "Take our dress",
        "Identify front, back, inner & outer, sides of dress properly",
        "Wear dress appropriately including proper buttoning",
        "Undress",
      ],
    },
    {
      name: "EATING",
      inputs: [
        "Identifies hunger",
        "Indicate hunger",
        "Place awareness",
        "Kitchen",
        "Dining area",
        "Dining table",
        "Chair",
        "Identifies utensils (plate, glass, spoon, etc.)",
        "Preparations",
        "Wash hands properly",
        "Wash plates",
        "Use napkin/towel",
        "Table manners",
        "Sit appropriately",
        "Take required amount of food",
        "Keep the food in correct position",
        "Avoid wastage of food",
        "Maintain proper discipline",
        "Pick the food with right hand",
        "Mix the food",
        "Put the food in mouth properly",
        "Chew the food",
        "Swallow the food",
        "Wash mouth and hands",
        "Wipe the hands and mouth",
        "Clean the area",
      ],
    },
    {
      name: "DRINKING",
      inputs: [
        "Identifies thirst",
        "Indicate thirst",
        "Identifies water sources",
        "With glass: Identifies glass",
        "With glass: Hold glass",
        "With glass: Pour water into glass",
        "With glass: Sip or suck with straw",
        "With bottle: Identifies bottle",
        "With bottle: Takes bottle",
        "With bottle: Fill water in the bottle",
        "With bottle: Sip or suck the nipple",
        "With bottle: Close the bottle",
        "Replace glass/ bottle",
      ],
    },
    {
      name: "GROOMING",
      inputs: [
        "Wash face gently",
        "Wipe face",
        "Identify required make-up products",
        "Take the products one by one",
        "Apply required amount of make-up products",
        "Replace the products properly",
        // SKIN CARE
        "Identify body lotion/perfume",
        "Take lotion/perfume",
        "Open the lid/perfume",
        "Apply accordingly",
        "Close and replace",
        // HAIR CARE
        "Identify comb",
        "Take comb",
        "Comb the hair properly",
        "Identify hair gel if required and apply it properly",
        "Tie the hair properly if required",
        // SELF-CARE ROUTINE: NAIL CUTTING
        "Identify nail cutter",
        "Take nail cutter",
        "Open and hold it properly",
        "Trim nails properly",
        "Clean the area",
        "Wash hands",
        // SELF-CARE ROUTINE: SHAVING
        "Wet the skin",
        "Identify razor, shaving cream, or gel",
        "Take shaving cream or gel",
        "Apply cream",
        "Shave in the direction that the hair grows",
        "Rinse after each swipe of razor",
        "Wash properly",
        "Clean the razor",
        "Replace it",
        // SANITARY NAPKINS
        "Identify napkin",
        "Pick the napkin according to the need",
        "Unwrap the sanitary napkin",
        "Peel off the center backing and stick on your underwear",
        "Remove the adhesive from them and wrap the wings around the edges of underwear",
        "Ensure it stays in proper place",
        "Wash the hands properly",
        // MENSTRUAL CUP: INSERTING
        "Inserting the cup",
        "Identify the right menstrual cup for your body",
        "Take the cup and hold properly",
        "Wash cup properly",
        "Squat or raise one leg up on the toilet",
        "Fold the cup to make it easy to insert",
        "Insert the cup into the vagina",
        "Twist the cup to make sure it seals",
        // MENSTRUAL CUP: REMOVING
        "Removing the cup",
        "Wash your hands",
        "Sit over a toilet to take the cup",
        "Pinch the side of the cup to break the seal",
        "Empty the cup into the toilet",
        "Wash your cup with soap and water",
        "Sterilize cup",
      ],
    },
    { name: "REVIEW AND SUBMIT", inputs: [] },
  ];

  for (const row of rows) {
    await uploadADLChecklist(row, tabsStructure);
  }

  console.log("✅ All ADL checklist records processed");
}

module.exports = { runADLChecklistUpload };
