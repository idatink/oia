import http from "node:http";

http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("ok");
}).listen(3000, () => console.log("listening on :3000"));
