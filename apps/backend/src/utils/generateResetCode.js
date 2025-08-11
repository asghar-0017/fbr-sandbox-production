/**
 * Generates a secure 6-digit reset code
 * @returns {string} 6-digit numeric code
 */
const generateResetCode = () => {
  // Generate a secure 6-digit code
  const min = 100000;
  const max = 999999;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

export default generateResetCode; 