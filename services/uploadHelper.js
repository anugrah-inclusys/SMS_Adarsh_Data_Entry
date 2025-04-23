const fs = require("fs");
const path = require("path");

function parseExcelDate(value) {
  if (!value) return '';
  if (typeof value === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + value * 86400000).toISOString();
  }
  return new Date(value).toISOString();
}

function getFilesForRow(row, baseFolder = "staff_files") {
  const email = String(row.email || "").trim();
  const dirPath = path.resolve(__dirname, "..", baseFolder, email);
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath).map((fileName) => path.join(dirPath, fileName));
}
function parseAddress(fullAddress = '') {
  const segments = fullAddress.split(',').map(s => s.trim());
  const lastSegment = segments[segments.length - 1];
  const postal_code_match = lastSegment?.match(/\b\d{6}\b/);

  return {
    house_name: segments[0] || '',
    street: segments[1] || '',
    city: segments[2]?.replace(/\d{6}$/, '').trim() || '',
    state: "Kerala",
    country: "India",
    postal_code: postal_code_match ? postal_code_match[0] : '',
  };
}

function parseFullName(fullName = '') {
  const [first_name = '', ...rest] = fullName.trim().split(' ');
  return {
    first_name,
    last_name: rest.join(' ') || '',
  };
}

module.exports = { parseExcelDate, getFilesForRow,parseAddress,parseFullName };
