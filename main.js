require('dotenv').config()
const express = require('express')
const app = express()
const request = require('request')
const cors = require('cors')
const bodyParser = require('body-parser')
const oauthSignature = require('oauth-signature')
app.use(cors({ credentials: true }))
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())
const crypto = require('crypto')

SOURCE = 'twitter'

const parseTwitterWebhook = (event) => {
  let webhookBody
  event.direct_message_events.forEach(function (entry) {
    let webhookEvent = entry.message_create
    webhookBody = webhookEvent
    webhookBody.to =  webhookEvent.target.recipient_id
    webhookBody.from =  webhookEvent.sender_id
    webhookBody.text =  webhookEvent.message_data.text
  })
  return webhookBody
}

function generate_nonce(){
  let nonce = ""
  const length = 11
  for (let i = 0; i < length; i++) {
    let character = Math.floor(Math.random() * 61);
    nonce += "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz".substring(character, character + 1);
  }
  return nonce
}

const { OAUTH_CONSUMER_KEY, OAUTH_CONSUMER_SECRET, OAUTH_TOKEN, OAUTH_TOKEN_SECRET } = process.env
const urlLink = 'https://api.twitter.com/1.1/direct_messages/events/new.json';

function oauth_signature(params){
  const httpMethod = 'POST'
  const consumerSecret = OAUTH_CONSUMER_SECRET
  const tokenSecret = OAUTH_TOKEN_SECRET
  // generates a BASE64 encode HMAC-SHA1 hash
  const signature = oauthSignature.generate(httpMethod, urlLink, params, consumerSecret, tokenSecret);
  return signature

}
app.post('/send', bodyParser.json(), async (req, res) => {

  const recipientID = req.body.recipientId; //"1640248464972951553"
  const text = req.body.text;   //"Hi This is a test message"  
  const timestamp = Math.floor((new Date()).getTime()/1000);

  const nonce = generate_nonce()
    // Authorization Parameters
    const params = {
      oauth_consumer_key     : OAUTH_CONSUMER_KEY,
      oauth_token            : OAUTH_TOKEN,
      oauth_nonce            : nonce,
      oauth_timestamp        : timestamp,
      oauth_signature_method : "HMAC-SHA1",
      oauth_version          : "1.0"
    };
    params.oauth_signature = oauth_signature(params)
    //HMAC-SHA1
    const dataString = `{"event": {"type": "message_create", "message_create": {"target": { "recipient_id": "${recipientID}"},"message_data": {"text": "${text}"}}}}`;

    const options = {
        url: urlLink,
        headers: {
         "Authorization": `OAuth oauth_consumer_key="${params.oauth_consumer_key}", oauth_nonce= ${params.oauth_nonce}, oauth_signature= ${params.oauth_signature}, oauth_signature_method="HMAC-SHA1", oauth_timestamp=${params.oauth_timestamp},oauth_token="${params.oauth_token}", oauth_version=${params.oauth_version}`,
         "Content-type": 'application/json'
        },
       body: dataString
      }

    request.post(options, (error, response, body) =>{
        console.log(response.body);
        return res.send(response.body)
    });
})

app.post('/receive', async(req,res) => {
  let card = {}
  const webhook = parseTwitterWebhook(req.body)
  const { text, from, to } = webhook
  console.log(webhook)
  if(!webhook){
    console.log("Error in parsing incoming webhook")
    res.sendStatus(404)
    return
  }

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