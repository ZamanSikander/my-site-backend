require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Debug environment variables
// console.log('SMTP_HOST:', process.env.SMTP_HOST);
// console.log('SMTP_PORT:', process.env.SMTP_PORT);
// console.log('SMTP_USER:', process.env.SMTP_USER);
// console.log('SMTP_HOST:', process.env.SMTP_HOST);
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  }
});

app.use(helmet());

const emailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });
  
  app.use('/send-email', emailLimiter);

app.post(
    '/send-email',
    [
      body('fullName').trim().notEmpty().withMessage('Full name is required'),
      body('email').isEmail().withMessage('Valid email is required'),
      body('message').trim().notEmpty().withMessage('Message is required')
    ],
    (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { fullName, email, message } = req.body;
  
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_TO,
        subject: 'New Message from Website',
        text: `Name: ${fullName}\nEmail: ${email}\nMessage: ${message}`
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ error: 'Failed to send email' });
        }
        res.status(200).json({ message: 'Email sent successfully' });
      });
    }
  );

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
