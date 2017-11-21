const mqlight = require("mqlight")
const express = require("express")
const bodyParser = require("body-parser")
const uuid = require("node-uuid")

const TOPIC = "public"
const CREDENTIALS = {
  id: "CLIENT_" + uuid.v4().substring(0, 7),
  service: "amqp://vmeberlitz.southcentralus.cloudapp.azure.com:5672",
}
const client = mqlight.createClient(CREDENTIALS, err => {
  if (err) {
    console.log("Connection error on service " + CREDENTIALS.service)
  } else {
    console.log("Connected on service " + CREDENTIALS.service)
  }
  client.subscribe(TOPIC)
  client.on("message", processMessage)
})
client.on("error", err => console.log(err))

const messages = []
function processMessage(data, delivery) {
  messages.push({ data, delivery })
}

const PORT = process.env.PORT || 8080
const server = express()
server.use(express.static(__dirname + "/public"))
server.use(bodyParser.json())

server.get("/messages", (req, res) => {
  if (messages.length === 0) {
    return res.send(204)
  }
  const data = []
  while (messages.length > 0) {
    const message = messages.shift()
    data.push(message.data)
  }
  res.json(data)
})

server.post("/messages", (req, res) => {
  if (!req.body.message) {
    return res.send(500)
  }
  const message = {
    data: req.body.message,
    client: client.id
  }
  client.send(TOPIC, message)
  return res.send(200)
})

server.listen(PORT, () => console.log("running on port " + PORT))
