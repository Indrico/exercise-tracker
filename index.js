const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const { validationResult, body } = require('express-validator')
require('dotenv').config()
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const { Schema } = mongoose;

// Schema configuration
const usernameSchema = new Schema({
  username: String,
});

const exerciseSchema = new Schema({
  username: String,
  description: String,
  duration: Number,
  date: String,
});

let Username = mongoose.model('username', usernameSchema);
let Exercise = mongoose.model('exercise', exerciseSchema);

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users', 
  body('username').isLength({ min: 3 })
, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }

  let username = req.body.username;
  
  let output = { username };

  await Username.create(output, (err, result) => {
    if (err) return console.error(err);
    res.json(result);
  });
})

app.get('/api/users', (req, res) => {
  Username.find({}, (err, users) => {
    if (err) return console.error(err);
    res.json(users);
  })
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body;
  const { _id } = req.params;

  // find username by id
  let userData = await Username.findById(_id)
  const { username } = userData;

  let dateOutput;
  if (!date) {
    dateOutput = new Date().toDateString();
  } else {
    dateOutput = new Date(date).toDateString();
  }

  let input = {
    username,
    description,
    duration,
    date: dateOutput,
  }

  await Exercise.create(input, (err, result) => {
    if (err) return console.error(err);
    res.json(result);
  });
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  // find username by id
  let userData = await Username.findById(_id)
  const { username } = userData;

  let logs = await Exercise.find({ username });
  if (from !== undefined && to !== undefined) {
    logs = logs.filter(log => {
      if (log.date) {
        console.log(new Date(log.date).getTime());
        console.log(new Date(from).getTime());
        return new Date(log.date).getTime() >= new Date(from).getTime() && new Date(log.date).getTime() <= new Date(to).getTime()
      }
    })
  }

  if (limit) {
    logs = logs.slice(0, limit)
  }
  
  let output = {
    username,
    count: logs.length,
    _id,
    log: logs
  }

  res.json(output);
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
