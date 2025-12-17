const Africastalking = require('africastalking');

const africastalking = Africastalking({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME
});

const sms = africastalking.SMS;

const sendSMS = async (to, message) => {
  try {
    const response = await sms.send({
      to,
      message,
      from: 'InsureApp'
    });
    console.log('SMS sent:', response);
  } catch (err) {
    console.error('SMS failed:', err);
  }
};

module.exports = sendSMS;
