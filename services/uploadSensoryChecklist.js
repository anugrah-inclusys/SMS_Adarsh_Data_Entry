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
  const steps = Array(7).fill({});

  tabsStructure.forEach((tab, index) => {
    steps[index] = tab.inputs.reduce((acc, input) => {
      acc[input] = row[`sensory_dysfunction.${tab.name}.${input}`] || "";
      return acc;
    }, {});
  });

  return steps;
}

async function uploadSensoryChecklist(row, tabsStructure) {
  const studentId = row["STUDENT ID"];
  if (!studentId) {
    console.warn(`⚠️ Skipping row without student_id: ${row["Student Name"]}`);
    return;
  }

  const student = await fetchStudentDetails(studentId);
  if (!student) return;

  const { first_name, last_name } = parseFullName(row["Student Name"] || "");
  const createdAt = parseExcelDate(row["sensory_dysfunction.createdAt"]);
  const basePayload = {
    student_id: student._id,
    firstName: first_name,
    lastName: last_name,
    createdAt: createdAt,
  };

  const steps = mapSteps(row, tabsStructure);

  let checklistId;

  // Step 1: Create Sensory Checklist
  try {
    const payload = { ...basePayload, 0: steps[0] };
    const res = await axios.post(
      `${API_BASE_URL}/students/sensory-dysfunction/autosave/${studentId}/1`,
      payload,
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    checklistId = res.data.data._id;
    console.log(
      `✅ Step 1 created Sensory Dysfunction checklist for ${checklistId}`
    );
  } catch (err) {
    console.error(
      `❌ Failed creating Sensory Dysfunction checklist`,
      err.response?.data || err.message
    );
    return;
  }

  // Step 2–7 Updates
  for (let i = 1; i < steps.length; i++) {
    try {
      const payload = { ...basePayload, [i]: steps[i] };
      await axios.put(
        `${API_BASE_URL}/students/sensory-dysfunction/autosave/${studentId}/${
          i + 1
        }`,
        payload,
        {
          headers: { Authorization: `Bearer ${JWT_TOKEN}` },
        }
      );
      console.log(`✅ Step ${i + 1} updated for ${checklistId}`);
    } catch (err) {
      console.error(
        `❌ Step ${i + 1} failed for ${checklistId}`,
        err.response?.data || err.message
      );
    }
  }

  // Final submission
  try {
    await axios.put(
      `${API_BASE_URL}/students/sensory-dysfunction/submit/${checklistId}`,
      {},
      {
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }
    );
    console.log(
      `🎉 Sensory Dysfunction checklist submitted for ${checklistId}`
    );
  } catch (err) {
    console.error(
      `❌ Final submission failed for ${checklistId}`,
      err.response?.data || err.message
    );
  }
}

async function runSensoryChecklistUpload(
  filePath = "./output/sensory_dysfunction_with_ids.csv"
) {
  const workbook = xlsx.readFile(filePath, {
    cellText: false,
    cellDates: true,
    codepage: 65001,
  });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  const tabsStructure = [
    {
      name: "vision",
      inputs: [
        "Looking at shiny objects",
        "Looking at spinning or moving objects",
        "Looking at very bright light or sunshine",
        "Looking at dim light, dark or shade",
        "Looking through a coloured glass",
        "Moving fingers in front of eyes",
        "Corner vision",
        "Spinning objects close to eyes",
        "Difficulty controlling eye movement to track and follow moving objects",
        "Covers eyes or squints to protect from light",
        "Has difficulty in keeping eyes focused on task",
        "Eye contact",
        "Eye poking",
      ],
    },
    {
      name: "auditory",
      inputs: [
        "Hearing loud sounds",
        "Watching TV at high/low volume",
        "Background noise when concentrating",
        "Games with rapid verbal instructions",
        "Response to unfamiliar sounds",
        "Making noise for own purpose",
        "Reaction to low-pitched sounds",
        "Holds hands over ears to protect from sound",
        "Reacts to sounds of animals (e.g., barking dog)",
      ],
    },
    {
      name: "tactile",
      inputs: [
        "Responds to unexpected touch.",
        "Clothing, shoes or accessories that are very tight or very loose.",
        "Grooming activities such face and hair washing, hair brushing, hair cutting, nail trimming, tooth brushing.",
        "Certain clothing fabrics, tags, cuffs, belts etc.",
        "Hands, face or other body parts messy with paint, glue, sand, food, lotion etc.",
        "Trying new foods",
        "Eating particular food textures such as chewy, crispy, smooth, crunchy, soft and pulpy.",
        "Standing in a queue or standing close to other peoples.",
        "Walking barefoot.",
        "Feeling of light touch.",
        "Walk on toes.",
        "Licks own skin or items.",
        "Standing in wet places.",
        "Rubs or scratches out a skin area.( Mosquito or flies bite )",
        "Awareness of pain and temperature.",
        "Taking a bath shower or swimming.",
        "Getting towelled dry",
      ],
    },
    {
      name: "taste_and_smell",
      inputs: [
        "Strong odors such as perfumes, petrol, gas, cleaning products etc.",
        "Smelling objects such as plastic items, clay,garbage (waste ) etc.",
        "Eating new foods.",
        "Eating familiar foods.",
        "Eating strongly flavoured foods(very spicy, salty, bitter, sour)",
        "Picky eating.",
        "To smell some one or some places.",
        "Excessive smelling when introduce to objects, peoples or places.",
        "To avoid or seek unpleasant odors.",
        "May eat or drink things that are poisonous(Hand wash, phenoyl, kerosene etc.)",
        "Smelling unfamiliar scents.",
      ],
    },
    {
      name: "proprioception",
      inputs: [
        "Activities requiring physical strength and force (running, skipping, playing footbal, cycling etc.,)",
        "Having eyes closed or covered",
        "Standing or Hopping on one foot",
        "Straight line walking",
        "Walking across uneven surfaces (stairs, stepping over stool )",
        "High risk play(jumps from extreme height, climbs tal trees)",
        "Activities such as jumping, banging, pushing, pulling, climbing, bouncing etc.,",
        "Holding objects with excess pressure ( writing)",
        "Fine motor tasks such as writing, drawing, closing buttons etc.",
        "Give extra weight on a table for balance while sitting",
        "Tight hug or tight clothing",
      ],
    },
    {
      name: "vestibular",
      inputs: [
        "Riding equipments that moves through space(swings, escalators and elevators)",
        "Spinning activities (spinning toys, spinning around in circles)",
        "Challenges to balance such as skating, bicycle riding,skipping and balance beam.",
        "Climbing and descending stairs, slides and ladders.",
        "Unstable surfaces like fabric carpet, sand and snow.",
        "To perform backward motions.",
        "Rocks body, shakes leg or head while sitting.",
        "Running, jumping, hopping, spinning etc. instead of walking.",
      ],
    },
    {
      name: "interoception",
      inputs: [
        "Pain tolerance.",
        "Hungry or thirsty.",
        "Needing to go to the toilet.",
        "Feeling hot or cold.",
      ],
    },
  ];

  for (const row of rows) {
    await uploadSensoryChecklist(row, tabsStructure);
  }

  console.log("✅ All Sensory Dysfunction checklist records processed");
}

module.exports = { runSensoryChecklistUpload };
