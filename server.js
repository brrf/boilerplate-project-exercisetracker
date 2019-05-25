const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')
const mongo = require('mongodb')
const mongoose = require('mongoose')

var port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors())
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))

var userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true
  }
})

var User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user',  (req, res) => {
  var user = new User({
    username: req.body.username
  });
  
   user.save(function (err) {
  if (err) console.log(err);
  });

  res.json({
    username: user.username,
    _id: user._id
  })    
})

app.get('/test', (req, res) => {
  User.findOne({username: 'moshe2'}, (err, data) => {
    if (err) console.log('no user found');
    res.send(data)
  })
})

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
