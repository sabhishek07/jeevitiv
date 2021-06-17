const Patient = require('../models/patient')
const Newsletter = require('../models/newsletter')
const nodemailer = require('nodemailer');
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const jwt = require('jsonwebtoken')
const JWT_KEY = "jwtactive987";
const JWT_RESET_KEY = "jwtreset987";
const lodash = require('lodash');


exports.patientSignup = async (req,res) => {

    
    const {name, email, password} = req.body;
    const patientExists = await Patient.findOne({email: req.body.email})
    if(patientExists)
        return res.status(403).json({error: "User with the email already registered"});

    const oauth2Client = new OAuth2(
        "173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com", // ClientID
        "OKXIYR14wBB_zumf30EC__iJ", // Client Secret
        "https://developers.google.com/oauthplayground" // Redirect URL
    );

    
    oauth2Client.setCredentials({
        refresh_token: "1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w"
    });
    const accessToken = oauth2Client.getAccessToken()

    const token = jwt.sign({ name, email, password }, JWT_KEY, { expiresIn: '30m' });
    const CLIENT_URL = 'http://' + req.headers.host;

    const output = `<h2>Please click on below link to activate your account</h2>
                    <p>${CLIENT_URL}/activateUser/${token}</p>
                    <p><b>NOTE: </b> The above activation link expires in 30 minutes.</p>`;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: "OAuth2",
            user: "nodejsa@gmail.com",
            clientId: "173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com",
            clientSecret: "OKXIYR14wBB_zumf30EC__iJ",
            refreshToken: "1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w",
            accessToken: accessToken
        },
    });

    const mailOptions = {
        from: '"Auth Admin" <nodejsa@gmail.com>', // sender address
        to: email, // list of receivers
        subject: "Account Verification", // Subject line
        generateTextFromHTML: true,
        html: output, // html body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error)
            return res.json({error: "Failure"});
        else
            return res.json({result: "Success. Mail sent!"});
    })
}

exports.activatePatientAccount = (req, res) => {
    const token = req.params.token;
    if (token){
        jwt.verify(token, JWT_KEY, (err, decodedToken) => {
            if (err) 
                return res.json({error: "Link Expired or Invalid Link! Please try again."});
            
            else {
                const { name, email, password } = decodedToken;
                Patient.findOne({ email: email })
                .then(user => {
                    if (user) 
                        return res.json({error: "User with the Email already registered!"});
                    else {
                        const patient = new Patient({
                            name,
                            email,
                            password
                        });

                        patient.save();
                        return res.status(200).json("Signup Successful. Please login"); 
                    }
                });
            }
        })
    }
    else {
        console.log("Account activation error!")
        return res.json({error: "Account activation failed!"});
    }
}

exports.patientSignin = (req,res) => {
    const {email, password} = req.body
    Patient.findOne({email}, (err,patient)=>{
        if(err || !patient)
            return res.status(401).json({error: "Email is not registered."})
    
        if(!patient.authenticate(password))
            return res.status(401).json({error: "Email and password do not match"});
            
        const token = jwt.sign({_id: patient._id},process.env.JWT_SECRET);
        res.cookie("t",token,{expire: new Date()+9999})
        const {_id,name,email} = patient
        return res.json({token,user: {_id,name,email}}); 
    })
}


exports.forgotPassword = (req, res) => {
    const { email } = req.body;

    Patient.findOne({ email: email })
    .then(user => {
        if (!user)
            return res.status(401).json({error: "Email is not registered."})
        else {
            const oauth2Client = new OAuth2(
                "173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com", // ClientID
                "OKXIYR14wBB_zumf30EC__iJ", // Client Secret
                "https://developers.google.com/oauthplayground" // Redirect URL
            );

            oauth2Client.setCredentials({
                refresh_token: "1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w"
            });
            const accessToken = oauth2Client.getAccessToken()

            const token = jwt.sign({ _id: user._id }, JWT_RESET_KEY, { expiresIn: '30m' });
            const CLIENT_URL = 'http://' + req.headers.host;
            const output = `<h2>Please click on below link to reset your account password</h2>
                            <p>${CLIENT_URL}/forgot/${token}</p>
                            <p><b>NOTE: </b> The activation link expires in 30 minutes.</p>`;
            
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: "OAuth2",
                    user: "nodejsa@gmail.com",
                    clientId: "173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com",
                    clientSecret: "OKXIYR14wBB_zumf30EC__iJ",
                    refreshToken: "1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w",
                    accessToken: accessToken
                },
            });

            const mailOptions = {
                from: '"Auth Admin" <nodejsa@gmail.com>', // sender address
                to: email, // list of receivers
                subject: "Account Password Reset: NodeJS Auth ✔", // Subject line
                html: output, // html body
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error)
                    return res.json({error: "Failure"});
                else 
                    return res.json({result: "Success. Mail sent!"});
            })
        }
    })
}

exports.gotoReset = (req, res) => {
    const { token } = req.params;

    if (token) {
        jwt.verify(token, JWT_RESET_KEY, (err, decodedToken) => {
            if (err)
                return res.status(401).json({error: "Link Expired or Invalid Link! Please try again."})
            else {
                const { _id } = decodedToken;
                Patient.findById(_id, (err, user) => {
                    if (err) 
                        return res.status(401).json({error: "Email is not registered."})
                    else
                        return res.json({result: "Please redirect to reset password!"});
                })
            }
        })
    }
    else
        return res.json({error: "Failure"});
}

exports.resetPassword = (req, res) => {
    const { password, _id } = req.body;
    
    const details = {
        password: password
    }

    Patient.findById({ _id: _id })
    .then( patient => {
        patient = lodash.extend(patient, details)
        patient.save( (err, result) => {
            if(err)
                return res.status(400).json({error: err});
            return res.json({message: "Upadted Successfully!"});
        })
    })
}

exports.needHelp = (req, res) => {
    const { name, email, phone, message } = req.body;
    //console.log(req.body.name,req.body.email, req.body.phone, req.body.message);
    const oauth2Client = new OAuth2(
        "173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com", // ClientID
        "OKXIYR14wBB_zumf30EC__iJ", // Client Secret
        "https://developers.google.com/oauthplayground" // Redirect URL
    );
    
    oauth2Client.setCredentials({
        refresh_token: "1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w"
    });
    const accessToken = oauth2Client.getAccessToken()
    
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: "OAuth2",
            user: "nodejsa@gmail.com",
            clientId: "173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com",
            clientSecret: "OKXIYR14wBB_zumf30EC__iJ",
            refreshToken: "1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w",
            accessToken: accessToken
        },
    });
    
    const mailOptions = {
        from: '" Need Help" <nodejsa@gmail.com>', // sender address
        to: 'kranthisai85@gmail.com', // list of receivers
        subject: "Message from "+req.body.name+" via NeedHelp", // Subject line
        text: "Phone : "+req.body.phone+" \nMessage : "+req.body.message, // html body
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
        if (error)
        return res.json({error: "Failure"});
        else 
        console.log('Email sent: ' + info.response);
        return res.json({result: "Success. Mail sent!"});
    })
    var data = {
        "name": name,
        "email": email,
        "phone": phone,
        "message": message
    }

 
}

exports.newsletter = (req,res) => {
    const { email } = req.body;
    var data = {
        "email": email,
    }
    const newsletter = new Newsletter(data);
    newsletter.save()
    .then(result => res.json({"message" : "You're sucessfully subscribed"}))
    .catch(err => res.json({"message" : "Please try again!!"}))
    
    // db.collection('newsletters').insertOne(data,(err,collection)=>{
    //     if(err){
    //         throw err;
    //     }
    //     console.log("Record inserted successfully");
    // })
} 

exports.signout = (req,res) => {
    res.clearCookie("t");
    return res.json({message: "Signed Out!"});
} 