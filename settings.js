const options = {
  // SMTP  section details START
  smtp_host: "smtp server required", //smtp server here
  smtp_port: 587, // smtp port
  smtp_user: "your_smtp_username",
  smtp_pass: "your_smtp_password",

  use_smtp: 1, //if this is zero it will not use the smtp details above but send email using localhost
  // SMTP  section END

  //sender INFO START. Please we are reading all email from text files. So, make sure you fill up text file with emails in each lines
  from_email_txt: `fromEmails.txt`, // email text file FromEmail.txt
  //sender INFO START
  to_email_txt: "toEmails.txt",

  //email Subject
  email_subject: " Subject Here ", //

  encrypt_html: 0, //  turn on off html encryption for email body
  Encryption_html_Type: 1,
  // 1 = js unescape encrypt
  // 2 = js base64 encrypt

  // TEST SECTION START
  test_email: 1,
  test_email_after: 100,
  test_email_destination: "test@admin.com",

  // TEST SECTION END

  //Reply section start
  reply_to: 0,
  reply_to_email: "test@admin.com",
  reply_to_name: "your name",
  //Reply section end

  // STOP AFTER
  stop: 99999999999,
};

module.exports = options;
