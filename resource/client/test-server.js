import http from 'node:http'

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('Node server works')
})

server.on('error', (error) => {
  console.error('Server error:', error)
  process.exit(1)
})

server.listen(30001, '127.0.0.1', () => {
  console.log('Listening on http://127.0.0.1:30001')
})