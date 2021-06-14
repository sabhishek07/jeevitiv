const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors');
const uuid = require('uuid');
const session = require('express-session');
const passport = require('passport');


const app = express();
dotenv.config();
const port = process.env.PORT || 8080;


mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true})
.then( () => console.log("Connection Successful"))
.catch( (err) => console.log(err));
mongoose.set('useFindAndModify', false);


app.use(cors());
app.use(bodyParser.json());
app.use(
    session({
        secret: 'secret',
        resave: true,
        saveUninitialized: true
    })
);


const authRoutes = require('./routes/auth');
app.use('/', authRoutes);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})