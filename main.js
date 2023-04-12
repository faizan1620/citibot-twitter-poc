const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
app.use(cors({ credentials: true }))
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())
const crypto = require('crypto')
const { sendTwitterMessage, parseTwitterWebhook } = require('./util')

SOURCE = 'twitter'

app.post('/send', bodyParser.json(), async (req, res) => {
  const recipientID = req.body.recipientId;
  const text = req.body.text;   
  const dataString = `{"event": {"type": "message_create", "message_create": {"target": { "recipient_id": "${recipientID}"},"message_data": {"text": "${text}"}}}}`;
  const response = await sendTwitterMessage(dataString)
  res.send(response)
})

app.post('/receive', async(req,res) => {
  let card = {}
  const webhook = parseTwitterWebhook(req.body)

  if(!webhook){
    res.sendStatus(404)
    return
  }
  const { text, from, to } = webhook

  if(!text || !from){
    console.log("Messsage could not be received")
    res.sendStatus(404)
    return
  }

  card.source = SOURCE
  card.to = to
  card.from = from
  card.message = text

  console.log(card)
  res.send("received")
})

app.get('/receive', async(req,res) => {
  const crc_token = req.query.crc_token
  const hmac = crypto.createHmac('sha256', OAUTH_CONSUMER_SECRET).update(crc_token).digest('base64')
  const response = {response_token: 'sha256=' +hmac}
  res.send(response)
})

app.listen(3000,()=>
    console.log("Listening on port: 3000")
)