require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const url = require('url');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');


app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(express.json());

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

// mongoose connection
mongoose.connect(process.env.MONGO_URL).then(function(){
  console.log("connected...");
}).catch(err => console.log(err));

const urlSchema = new mongoose.Schema(
    {
        int_path: String,
        url: String
    }
);

const URLModel = mongoose.model('URLStore', urlSchema);


app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

async function addNewURL(int_path, url) {
    let newURL = new URLModel(
        {
            int_path: int_path,
            url: url
        }
    );
    const result = await newURL.save();
    return result;
}

app.post('/api/shorturl', function(req, res) {
 const postedURL = req.body.url;
    const parsedURL = url.parse(postedURL);
    const hostname = parsedURL.hostname;
      if (hostname == null) res.json({ error: 'invalid url' });
    dns.lookup(hostname, async function (err, addresses) {
            if (!err) {
               const result = await URLModel.find().count();
               const response = addNewURL(result + 1 , req.body.url);
                if (response) res.json({
                  original_url: postedURL,
                  short_url: result + 1,
                });
                else res.json({ error: "invalid url" });
        }
    });
});


app.get("/api/shorturl/:shorten_url", async function(req, res){
   const result = await URLModel.findOne({ int_path: req.params.shorten_url });
    console.log(result);
    res.redirect(result['url']);
});
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
