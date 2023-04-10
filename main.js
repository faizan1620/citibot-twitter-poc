require('dotenv').config()
const express = require('express')
const app = express()
const request = require('request')
const cors = require('cors')
const bodyParser = require('body-parser')
app.use(cors({ credentials: true }))
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())
const crypto = require('crypto')

const { OAUTH_CONSUMER_KEY, OAUTH_CONSUMER_SECRET, OAUTH_TOKEN, OAUTH_NONCE, OAUTH_SIGNATURE } = process.env
app.post('/send', bodyParser.json(), async (req, res) => {

  const recipientID = req.body.recipientId; //"1640248464972951553"
  const text = req.body.text;   //"Hi This is a test message"

    // URL Link for twitter endpoint
    const urlLink = 'https://api.twitter.com/1.1/direct_messages/events/new.json';
    
    
    // Generating timestamp
    const ts = Math.floor(new Date().getTime()/1000);
   const timestamp = ts;

    // Authorization Parameters
    const params = {
        "oauth_version"          : "1.0",
        "oauth_consumer_key"     : OAUTH_CONSUMER_KEY,
        "oauth_token"            : OAUTH_TOKEN,
        "oauth_timestamp"        : 1681107736,
        "oauth_nonce"            : OAUTH_NONCE,
        "oauth_signature_method" : "HMAC-SHA1",
        "oauth_signature"        : OAUTH_SIGNATURE
    };
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
  msg = req.body.direct_message_events[0].message_create
  console.log("Received message =>", JSON.stringify(msg))
  res.send("received")
})

app.get('/receive', async(req,res) => {
  const crc_token = req.query.crc_token
  hmac = crypto.createHmac('sha256', OAUTH_CONSUMER_SECRET).update(crc_token).digest('base64')
  response = {response_token: 'sha256=' +hmac}
  res.send(response)
})

app.listen(3000,()=>
    console.log("Listening on port: 3000")
)