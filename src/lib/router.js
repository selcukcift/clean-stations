const url = require('url');
const { getParts, getPartById } = require('../api/partsHandlers');
const { getAssemblies, getAssemblyById } = require('../api/assembliesHandlers');
const { getCategories } = require('../api/categoriesHandlers');
const { handleGenerateBom } = require('../api/bomHandlers.js'); // Corrected handler name
const { sendJSONResponse } = require('./requestUtils');

async function routeRequest(req, res) { // Added async here
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;
  const path = parsedUrl.pathname;

  console.log(`Received request: ${method} ${path}`);

  // Regex for specific ID routes
  const partIdRegex = /^\/api\/parts\/([^\/]+)$/;
  const assemblyIdRegex = /^\/api\/assemblies\/([^\/]+)$/;

  let match;

  if (method === 'GET' && path === '/api/parts') {
    await getParts(req, res);
  } else if (method === 'GET' && (match = path.match(partIdRegex))) {
    const partId = match[1];
    await getPartById(req, res, partId);
  } else if (method === 'GET' && path === '/api/assemblies') {
    await getAssemblies(req, res);
  } else if (method === 'GET' && (match = path.match(assemblyIdRegex))) {
    const assemblyId = match[1];
    await getAssemblyById(req, res, assemblyId);
  } else if (method === 'GET' && path === '/api/categories') {
    await getCategories(req, res); // Added await
  } else if (method === 'POST' && path === '/api/bom/generate') { // Added route for BOM generation
    await handleGenerateBom(req, res); // Corrected handler function call
  } else {
    sendJSONResponse(res, 404, { error: 'Not Found' });
  }
}

module.exports = { routeRequest };
