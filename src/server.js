const http = require('http');
const { routeRequest } = require('./lib/router');

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  try {
    await routeRequest(req, res);
  } catch (error) {
    console.error('Unhandled error in request handling:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
