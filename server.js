const express = require('express');
const uuid = require('uuid');
const bodyParser = require('body-parser')

const speakeasy = require('speakeasy');
const { JsonDB } = require('node-json-db');
const { Config } = require('node-json-db/dist/lib/JsonDBConfig');

const app = express();
app.use(bodyParser.json())
const db = new JsonDB(new Config("myDataBase", true, false, '/'));

app.get('/api', (req, res) => {
    res.json({
        message: "two factor authentication"
    })
})

//register user &create temp secret

app.post('/api/register', (req, res) => {
    const id = uuid.v4()
    try {
        const path = '/user/${id}'
        const tempt_secret = speakeasy.generateSecret()
        db.push(path, { id, tempt_secret })
        res.json({ id, secret: tempt_secret.base32 })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: 'error '

        }

        )

    }
})

///verify user and make secret permannet
app.post("/api/verify", (req, res) => {
    const { userId, token } = req.body;
    try {
        // Retrieve user from database
        const path = `/user/${userId}`;
        const user = db.getData(path);
        console.log({ user })
        const { base32: secret } = user.temp_secret;
        const verified = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token
        });
        if (verified) {
            // Update user data
            db.push(path, { id: userId, secret: user.temp_secret });
            res.json({ verified: true })
        } else {
            res.json({ verified: false })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving user' })
    };
})
const PORT = 5000

app.listen(PORT, () => {
    console.log(`server running at${PORT}`)
})