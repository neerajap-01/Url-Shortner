const express = require('express');
var bodyParser = require('body-parser');
const route = require('./routes/route');
const mongoose = require('mongoose');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect('mongodb+srv://Uranium-Batch:aruSjkdGdfhc9MRK@functionup.eel5r.mongodb.net/group37Database?retryWrites=true&w=majority',{
  useNewUrlParser: true,
})
.then(() => {console.log('Connected to MongoDB')})
.catch(err => {console.log('Error connecting to MongoDB: ' + err)})

app.use('/', route);

app.listen(process.env.PORT || 3000, function(){
  console.log('Express is running on port ' + (process.env.PORT || 3000))
});