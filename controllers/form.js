"use strict";
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp-relay.sendinblue.com",
      port: 587,
      auth: {
        user: "harshittomer4@gmail.com",
        pass: "6ncVqs5tAUNzKjCh",
      }
});
    
exports.contactForm = (req, res) => {
    const { email, name, message } = req.body;
    

    const emailData = {
        to: process.env.EMAIL_TO,
        from: email,
        subject: `Contact form - ${process.env.APP_NAME}`,
        text: `Email received from contact from \n Sender name: ${name} \n Sender email: ${email} \n Sender message: ${message}`,
        html: `
            <h4>Email received from contact form:</h4>
            <p>Sender name: ${name}</p>
            <p>Sender email: ${email}</p>
            <p>Sender message: ${message}</p>
            <hr />
            <p>This email may contain sensetive information</p>
            <p>https://devsblogs.com</p>
            
        `};

    transporter.sendMail(emailData)
    .then(sent => {
        return res.json({
            success:true
        })
    })
};


exports.contactBlogAuthorForm = (req, res) => {
    const { authorEmail, email, name, message } = req.body;

    let maillist = [authorEmail, process.env.EMAIL_TO];

    const emailData = {
        to: maillist,
        from: email,
        subject: `Someone messaged you from ${process.env.APP_NAME}`,
        text: `Email received from contact from \n Sender name: ${name} \n Sender email: ${email} \n Sender message: ${message}`,
        html: `
            <h4>Message received from:</h4>
            <p>name: ${name}</p>
            <p>Email: ${email}</p>
            <p>Message: ${message}</p>
            <hr />
            <p>This email may contain sensetive information</p>
            <p>https://devsblogs.com</p>
        `
    };
    
    transporter.sendMail(emailData)
    .then(sent => {
        return res.json({
            success:true
        })
    })
};

exports.contactAny = (req, res) => {
    const { toemail,subject, email, name, message } = req.body;

    

    const emailData = {
        to: toemail,
        from: email,
        subject: subject,
        text: message
        // html: `
        //     <h4>Message received from:</h4>
        //     <p>name: ${name}</p>
        //     <p>Email: ${email}</p>
        //     <p>Message: ${message}</p>
        //     <hr />
        //     <p>This email may contain sensetive information</p>
        //     <p>https://devsblogs.com</p>
        // `
    };
    
    transporter.sendMail(emailData)
    .then(sent => {
        return res.json({
            success:true
        })
    })
};

