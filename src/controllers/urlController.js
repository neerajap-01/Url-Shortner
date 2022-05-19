const Url = require('../models/urlModel');
const shortId = require('shortid');
const { isValidUrl, isValid } = require('../utils/validation')
const redis = require('redis')
const { promisify } = require('util');

//creating a redis client
const redisClient = redis.createClient(
  12116,
  'redis-12116.c212.ap-south-1-1.ec2.cloud.redislabs.com',
  { no_ready_check: true }
)

//Authenticating the client (our application)
redisClient.auth('qwertyuiop84521zxcvbnm741753963', function(err){
  if(err) throw err;
});

//if connect log a message
redisClient.on('connect', async function() {
  console.log("Connected to Redis..")
});

//using promisify and bind creating functions
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);
const SETEX_ASYNC = promisify(redisClient.SETEX).bind(redisClient);


// POST /url/shorten

const shorternUrl = async function(req, res){
  try {
    let data= req.body

    //valid data
    if(Object.keys(data).length == 0){
        return res.status(400).send({status:false, message:"Invalid Url please provide valid details"})
    }

    //valid url data
    if(!isValid(data.longUrl)){
        return res.status(400).send({status:false, message:"Please give the long URL"})
    }

    //checking for a valid url data
    if(!isValidUrl(data.longUrl)){
        return res.status(400).send({status:false, message:"Enter a valid url"})
    }

    //getting the data from cache if present
    let getUrl = await GET_ASYNC(`${data.longUrl}`);

    //converting from string to JSON
    let url = JSON.parse(getUrl);
    if(url){
      return res.status(200).send({ status: true, message:"Success", data: url })
    }

    //checking for unique longUrl
    let checkUrl = await Url.findOne({ longUrl: data.longUrl }).select({_id:0, __v:0, createdAt:0, updatedAt:0});
    if(checkUrl) {

      //if already exist then setting the document in the cache with expire time 
      await SETEX_ASYNC(`${data.longUrl}`, 84600, JSON.stringify(checkUrl))
      return res.status(200).send({status:true, message:"Success", data: checkUrl})
    }

    //generating url code
    let urlCode = shortId.generate().toLowerCase();

    const baseUrl = 'http://localhost:3000'

    //creating a short url
    const shortUrl= baseUrl+ '/'+ urlCode;

    data.urlCode=urlCode;
    data.shortUrl=shortUrl;

    //creating document or short url
    await Url.create(data)
    let responseData = await Url.findOne({urlCode:urlCode}).select({_id:0, __v:0, createdAt:0, updatedAt:0})

    //finding the same created document and then setting the document in the cache with expire time     
    await SETEX_ASYNC(`${data.longUrl}`, 84600, JSON.stringify(responseData))
    res.status(201).send({status:true, message:"URL create successfully", data:responseData})    
  } catch (err) {
    res.status(500).send({status: false, error: err.message})
      
  }
}

const redirectLink = async (req, res) => {
  try {
    //getting the data from cache if present
    let getLongUrl = await GET_ASYNC(`${req.params.urlCode}`)

    //converting from string to JSON
    let url = JSON.parse(getLongUrl);
    if(url){
      //redirecting to the original url
      return res.status(307).redirect(url.longUrl);
    }else{
      let getUrl = await Url.findOne({ urlCode: req.params.urlCode })
      if(!getUrl) return res.status(404).send({ status: false, message: 'Url-code not found' });

      //if already exist then setting the document in the cache with expire time 
      await SETEX_ASYNC(`${req.params.urlCode}`, 84600, JSON.stringify(getUrl));

      //redirecting to the original url
      return res.status(307).redirect(getUrl.longUrl)
    }
  } catch (err) {
    res.status(500).send({ status: false, error: err.message });
  }
}

module.exports = { redirectLink, shorternUrl };