// =============================
// Shared
// =============================
const isString = (value) => typeof value === "string";
const isEnum = (value, allowed) => allowed.includes(value);
const isArray = (value) => Array.isArray(value);
const text = (value, max) => isString(value) && value.trim().length > 0 && value.length <= max;

// =============================
// Job Text Validator
// =============================
export const validateJobText = (data) => {
  if (!text(data.jobText, 30000)) throw new Error("jobText must be non-empty string up to 30000 chars");
  return true;
};

// =============================
// Applicant Text Validator
// =============================
export const validateApplicantText = (data) => {
  if (!text(data.applicantText, 30000)) throw new Error("applicantText must be non-empty string up to 30000 chars");
  return true;
};

// =============================
// CV Validator
// =============================
export const validateCV = (data) => {
  if (!text(data.jobText, 30000)) 
    throw new Error("jobText must be non-empty string up to 30000 chars");

  if (!text(data.cvText, 30000)) 
    throw new Error("cvText must be non-empty string up to 30000 chars");

  if (data.language && !isString(data.language)) 
    throw new Error("language must be a string");

  return true;
};

// =============================
// Interview
// =============================
export const validateInterview = (data) => {
  if (!text(data.jobText, 25000)) throw new Error("jobText must be non-empty string up to 25000 chars");
  if (data.language && !isString(data.language)) throw new Error("language must be a string");

  if (!isArray(data.chatHistory)) throw new Error("chatHistory must be an array");
  if (data.chatHistory.length > 30) throw new Error("chatHistory cannot have more than 30 items");

  data.chatHistory.forEach((msg, i) => {
    if (!isEnum(msg.role, ["user", "assistant"])) throw new Error(`chatHistory[${i}].role must be "user" or "assistant"`);
    if (!text(msg.content, 25000)) throw new Error(`chatHistory[${i}].content must be non-empty string up to 25000 chars`);
  });

  return true;
};

// =============================
// Cover Letter
// =============================
export const validateCoverLetter = (data) => {
  if (!text(data.jobText, 20000)) 
    throw new Error("jobText must be a non-empty string up to 20000 chars");
  
  if (!text(data.applicantText, 20000)) 
    throw new Error("applicantText must be a non-empty string up to 20000 chars");

  if (data.language && !isString(data.language)) 
    throw new Error("language must be a string");

  if (data.matchData && typeof data.matchData !== "object") 
    throw new Error("matchData must be an object if provided");

  return true;
};

// =============================
// Portfolio Validator
// =============================
export const validatePortfolio = (data) => {
  if (!data.portfolioText || typeof data.portfolioText !== "string" || data.portfolioText.trim().length === 0) {
    throw new Error("portfolioText must be a non-empty string");
  }
  if (data.portfolioText.length > 30000) {
    throw new Error("portfolioText cannot exceed 30000 characters");
  }
  return true;
};

// =============================
// Middleware
// =============================
export const createValidator = (validatorFn) => (req, res, next) => {
  try {
    validatorFn(req.body);
    next();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};