require('dotenv').config()
const oauthSignature = require('oauth-signature');

const { OAUTH_CONSUMER_KEY, OAUTH_CONSUMER_SECRET, OAUTH_TOKEN, OAUTH_TOKEN_SECRET } = process.env
const urlLink = 'https://api.twitter.com/1.1/direct_messages/events/new.json';

const parseTwitterWebhook = (event) => {
    let webhookBody
    if(event.direct_message_events) {
      event.direct_message_events.forEach(function (entry) {
        let webhookEvent = entry.message_create
        webhookBody = webhookEvent
        webhookBody.to =  webhookEvent.target.recipient_id
        webhookBody.from =  webhookEvent.sender_id
        webhookBody.text =  webhookEvent.message_data.text
      })
    }
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
  
  function oauth_signature(params){
    const httpMethod = 'POST'
    const consumerSecret = OAUTH_CONSUMER_SECRET
    const tokenSecret = OAUTH_TOKEN_SECRET
    // generates a BASE64 encode HMAC-SHA1 hash
    const signature = oauthSignature.generate(httpMethod, urlLink, params, consumerSecret, tokenSecret);
    return signature
  
  }

const sendTwitterMessage = async(dataString) => {
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
    

    const response = await fetch(urlLink, {
        method: 'post',
        headers: {
         "Authorization": `OAuth oauth_consumer_key="${params.oauth_consumer_key}", oauth_nonce= ${params.oauth_nonce}, oauth_signature= ${params.oauth_signature}, oauth_signature_method="HMAC-SHA1", oauth_timestamp=${params.oauth_timestamp},oauth_token="${params.oauth_token}", oauth_version=${params.oauth_version}`,
         "Content-type": 'application/json'
        },
       body: dataString
      })

    return await response.json()
}

module.exports = {
    sendTwitterMessage,
    parseTwitterWebhook
}