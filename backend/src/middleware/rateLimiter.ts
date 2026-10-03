import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter (applied globally)
 * 300 requests per 15-minute window per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    status: 429,
    message: 'Too many requests from this IP address. Please try again in 15 minutes.',
  },
});

/**
 * Strict rate limiter for Authentication routes (Login, Register, Password Reset)
 * Prevents credential stuffing and brute-force attacks
 * 10 attempts per 15-minute window per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

/**
 * Strict rate limiter for Appointment Booking route
 * Prevents bot slot hoarding and spam appointments
 * 15 bookings per hour per IP
 */
export const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Booking request limit exceeded. Please wait a while before making new appointments.',
  },
});
