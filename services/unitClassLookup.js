const axios = require('axios');
const { API_BASE_URL, JWT_TOKEN } = require('../config/config');

async function getUnitClassLookup() {
  const res = await axios.get(`${API_BASE_URL}/schools/units/view-units`, {
    headers: { Authorization: `Bearer ${JWT_TOKEN}` },
  });

  const unitMap = {};
  const classMap = {};

  for (const entry of res.data.data) {
    const unitName = entry.unit.unit_name.trim().toLowerCase();
    const unitId = entry.unit._id;
    unitMap[unitName] = unitId;

    for (const cls of entry.classes) {
      const key = `${unitName}|${cls.class_name.trim().toLowerCase()}`;
      classMap[key] = cls._id;
    }
  }

  return { unitMap, classMap };
}

module.exports = { getUnitClassLookup };
