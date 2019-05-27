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
  username: 
    {
      type: String,
      required: true,
      unique: true
    },
  exercises: 
    {
      type: [{description: String, duration: Number, date: Date}],
      required: false
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

app.get('/api/exercise/users', (req, res) => {
  User.find({}, '_id username', (err, data) => {
    if (err) console.log(err);
    res.json(data)
  })
})

app.get('/api/exercise/log/', (req, res) => {
  if (!req.query.userId) return res.send('must provide a userId to query')
  let {from, to, limit} = req.query
  User.findById(req.query.userId, (err, data) => {
    let exercises = data.exercises
    let response = {
      _id: data._id,
      username: data.username,
    }
    if (err) return res.send('no such user');
    if(!isNaN(limit)) {
      response.limit = limit
      exercises = exercises.slice(0, limit)
    }
    if(to) {
      to = new Date(to);
      response.to = to;
      exercises = exercises.filter(function(item) {
        return item.date <= to
      });
    }
    if (from) {
      from = new Date(from);
      response.from = from;
      exercises = exercises.filter(function(item) {
        return item.date >= from
      })
    }
    response.log = exercises;
    
    res.json(response)
  })
});
app.post('/api/exercise/add', (req, res) => {
  if (!req.body.date) {
    req.body.date = new Date();
  }
             
  User.findByIdAndUpdate(req.body.userId, {$push: {exercises: {
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date                     
    }
  }}, (err, data) => {
    if (err) console.log(err);
    res.json({
      username: data.username,
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.date
    })
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
