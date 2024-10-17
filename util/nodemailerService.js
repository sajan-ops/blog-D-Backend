const nodemailer = require("nodemailer");

exports.sendEmail = (to, user_id) => {
  try {
    let verification_link = `${process.env.email_verification_link}/${user_id}`;
    // Create a transporter using SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: "waqaskhanbughlani1124@gmail.com",
        pass: "rzsl akdl szae skeh",
      },
    });

    // Send mail with defined transport object
    transporter.sendMail({
      from: {
        name: "proBlogs.net",
        address: "We are proBlogs",
      },
      to, // list of receivers
      subject: "Email Confirmation!", // Subject line
      text: "My text", // plain text body
      html: ` <!DOCTYPE html>
      <html>
      <head>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f4;
                  margin: 0;
                  padding: 0;
              }
              .email-container {
                  background-color: #ffffff;
                  padding: 20px;
                  margin: 50px auto;
                  width: 100%;
                  max-width: 600px;
                  border-radius: 8px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
              .email-header {
                  text-align: center;
                  padding-bottom: 20px;
              }
              .email-body {
                  padding: 20px;
                  text-align: center;
              }
              .verify-button {
                  display: inline-block;
                  padding: 15px 25px;
                  background-color: #4CAF50;
                  color: white;
                  text-decoration: none;
                  border-radius: 5px;
                  font-weight: bold;
              }
              .email-footer {
                  text-align: center;
                  padding-top: 20px;
                  color: #777;
              }
          </style>
      </head>
      <body>
          <div class="email-container">
              <div class="email-header">
                  <h2>Please verify it's you</h2>
              </div>
              <div class="email-body">
                  <p>Click the button below to verify your email and complete your registration.</p>
                  <br/>
                  <a href="${verification_link}" class="verify-button" target="_blank">Verify Now</a>
              </div>
              <div class="email-footer">
                  <p>If you did not request this, please ignore this email.</p>
              </div>
          </div>
      </body>
      </html>`,
    });

    console.log("Email sent successfully");
    return "email sent";
  } catch (error) {
    console.error("Error sending email:", error);
    return "email failed";
  }
};
