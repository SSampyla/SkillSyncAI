import crypto from "crypto";

// =============================
// Cache (in-memory)
// =============================

const cache = new Map();

export const getCache = (key) => {
  const entry = cache.get(key);

  if (!entry) return null;

  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }

  return entry.data;
};

export const setCache = (key, data, ttlMs = 1000 * 60 * 10) => {
  cache.set(key, {
    data,
    expiry: Date.now() + ttlMs
  });
};

// =============================
// Stable cache key
// =============================

export const createCacheKey = (prefix, payload) => {
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");

  return `${prefix}:${hash}`;
};

// =============================
// Async handler
// =============================

export const asyncHandler = (handler, context) => {
  return async (req, res) => {
    const startTime = Date.now();

    try {
      const result = await handler(req, res);

      const duration = Date.now() - startTime;

      console.log(`${context} success (${duration} ms)`);

      if (!res.headersSent) {
        res.json({
          ...result,
          responseTimeMs: duration
        });
      }

    } catch (err) {
      handleError(res, err, startTime, context);
    }
  };
};

// =============================
// Error handler
// =============================

export const handleError = (res, err, startTime, context) => {
  const duration = Date.now() - startTime;

  console.error(`${context} failed (${duration} ms)`);

  const upstreamStatus =
    err?.status || err?.statusCode || err?.error?.status;

  const upstreamMessage =
    err?.message || err?.error?.message;

  const upstreamCode =
    err?.code || err?.error?.code;

  if (upstreamStatus) {
    console.error("LLM error:", {
      status: upstreamStatus,
      message: upstreamMessage,
      code: upstreamCode
    });

    return res.status(502).json({
      error: upstreamMessage || "Tekoälypalvelu ei vastannut oikein."
    });
  }

  console.error("Backend error:", err);

  res.status(500).json({
    error: `Palvelinvirhe ${context.toLowerCase()}.`
  });
};