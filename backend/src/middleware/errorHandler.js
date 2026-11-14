import { fail } from '../utils/http.js';

export function notFound(_req, res) {
  return fail(res, 'API route not found', 404);
}

export function errorHandler(error, _req, res, _next) {
  const status = Number(error.status) || 500;
  if (status >= 500) console.error(error);
  return fail(res, status >= 500 ? 'An unexpected server error occurred' : error.message, status);
}
