function generateUniqueNo(prefix = "") {
  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${prefix ? "-" : ""}${timestamp}-${random}`;
}

module.exports = { generateUniqueNo };
