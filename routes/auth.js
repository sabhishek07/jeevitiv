const express = require('express');
const { patientSignup, activatePatientAccount, gotoReset, forgotPassword, resetPassword, patientSignin, signout, needHelp, newsletter } = require('../controllers/auth');
const router= express.Router();


router.post('/patientSignup', patientSignup);
router.get('/activateUser/:token', activatePatientAccount);
router.post('/patientSignin', patientSignin);
router.post('/forgot', forgotPassword);
router.get('/forgot/:token', gotoReset);
router.post('/reset/:id', resetPassword);
router.post('/needHelp', needHelp);
router.post('/newsletter', newsletter)

// router.post('/doctorSignup', doctorSignup);
// router.post('/doctorSignin',  doctorSignin);
router.get('/signout', signout);


module.exports = router;