"use strict";
const nodemailer = require("nodemailer");
const fs = require("fs");
const chalk = require("chalk");
//const utils = require("./libs/utils");
//const lineByLine = require("n-readlines");
const logger = require("simple-node-logger").createSimpleLogger({
  timestampFormat: "YYYY-MM-DD HH:mm:ss.SSS",
});
const settings = require("./settings");
const _ = require("lodash");

class Emailer {
  constructor() {
    this.email_file_name = settings.from_email_txt;
    this.mail_sent_count = 0;
    this.failed_emails = [];
    this.total_email_count = 0;

    this.start_emailing = this._start_emailing;
  }

  async _show_status() {
    logger.info("\n\n------------------------------------------------------");
    logger.info(chalk`{bold [*] Report Status !}`);
    logger.info(chalk`{bold [*] Total Emails: ${this.total_email_count} !}`);
    logger.info(
      chalk`{bold [*] SuccessFull Emails: ${this.mail_sent_count}/${this.total_email_count} !}`
    );
    logger.info(
      chalk`{bold [*] Failed Emails: ${this.failed_emails.length}/${this.total_email_count} !}`
    );
    logger.info(chalk`{bold [*] Saving failed Emails to failed_logs.txt !}`);
    logger.info("------------------------------------------------------\n\n");
    fs.writeFileSync("failed_logs.txt", this.failed_emails.join("\n"));
    logger.info(chalk`{bold [*] Saved failed Emails Complete !}`);
    logger.info(chalk`{bold [*] Closing SMTP server !}`);
    await this.transport.close();
  }

  async _set_server() {
    let secure = true;
    if (settings.smtp_port == 587) {
      secure = false;
    }

    logger.info(chalk`{bold [*] Using SMTP to send emails !}`);
    this.transport = await nodemailer.createTransport({
      pool: true,
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: secure,
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_pass,
      },
      secureConnection: true,
    });

    await this.transport.verify();
  }

  async _start_emailing() {
    // reading emails.txt line by line
    let emails = fs
      .readFileSync(`./${settings.from_email_txt}`)
      .toString()
      .split("\n");

    const total_emails = emails.length;
    logger.info(chalk`{bold [*] Sending from ${total_emails} emails. !}`);

    emails = emails.slice(0, settings.stop);
    let final_emails = emails;

    let total_emails_to_process = final_emails.length;
    this.total_email_count = total_emails_to_process;
    for (let i = 0; i < final_emails.length; i++) {
      let email = final_emails[i];
      logger.info(
        chalk`{bold [*] Processing Email ${email} ${
          i + 1
        }/${total_emails_to_process}}`
      );

      try {
        await this._send_email({ email: email });
      } catch (e) {
        logger.info(e);
        this.failed_emails.push(email);
      }

      console.log("\n");
    }
  }

  async _send_email({ email }) {
    const username = settings.smtp_user;
    const domain = email.split("@")[1];

    logger.info(chalk`{bold [*] Username: ${username} !}`);
    logger.info(chalk`{bold [*] Domain: ${domain} !}`);

    const from_name = settings.from_name;
    const from_email = email;
    //condtion in if email is empty, process from file then split and use for loop
    // const from_email = await utils.replace_labels(settings.from_email, email);
    //    const to_email = settings.to_email;
    //     if (to_email === "") {
    // }
    const toEmails = fs
      .readFileSync(`./${settings.to_email_txt}`)
      .toString()
      .split("\n");
    const total_to_emails = toEmails.length;
    logger.info(chalk`{bold [*] Sending to ${total_to_emails} emails. !}`);
    // toEmails = toEmails.slice(0, settings.stop);
    //let final_emails = emails;
    let total_emails_to_process = total_to_emails;
    this.total_email_to_count = total_emails_to_process;

    let to_text = `${from_name} ${from_email}`;

    let subject = settings.email_subject;

    for (let i = 0; i < toEmails.length; i++) {
      const message = {
        from: email,
        to: toEmails[i],
        subject: subject,
        date: new Date(),
      };

      if (settings.header) {
        logger.info(
          chalk`{bold [*] Header to turned on in settings. Attaching header to mail !}`
        );
        message["headers"] = {
          "X-MS-Exchange-Organization-MessageDirectionality": "Originating",
          "X-MS-Exchange-Organization-AuthAs": "Internal",
          "X-MS-Exchange-Organization-AuthMechanism": "02",
          "X-MS-Exchange-Organization-AuthSource":
            "MWHPR22MB0014.namprd22.prod.outlook.com",
          "X-MS-Exchange-Organization-Network-Message-Id":
            "ffe8bf42-c85a-42c8-a084-08d75b722819",
          "X-MA4-NODE": "false",
        };
      } else {
        logger.info(
          chalk`{bold [*] Header Not  turned on in settings. Ignoring header to mail !}`
        );
      }

      if (settings.reply_to) {
        logger.info(
          chalk`{bold [*] Reply to turned in in settings. Replying to ${settings.reply_to_name} at email: ${settings.reply_to_email} !}`
        );
        message.replyTo = `"${settings.reply_to_name}" ${settings.reply_to_email}`;
      }
      let info = await this.transport.sendMail(message);
      logger.info(chalk`{bold [*] Message sent for ${email} !\n}`);
      this.mail_sent_count += 1;
      logger.info(
        chalk`{bold [->] ${this.mail_sent_count} Mails sent Successfully.!}`
      );
      if (settings.pause_email) {
        if (
          this.mail_sent_count % settings.pause_email_after == 0 &&
          this.mail_sent_count != 1
        ) {
          logger.info(
            chalk`{bold [->] ${this.mail_sent_count} Mails sent. Pausing for ${settings.pause_email_seconds} seconds.!}`
          );

          await utils.sleep(settings.pause_email_seconds * 1000);
        }
      }
    }

    if (settings.test_email) {
      if (
        this.mail_sent_count % settings.test_email_after == 0 &&
        this.mail_sent_count != 1
      ) {
        logger.info(
          chalk`{bold [->] ${this.mail_sent_count} Mails sent. Sending test Email to ${settings.test_email_destination}.!}`
        );
        message.to = settings.test_email_destination;
        const email = settings.test_email_destination;
        const from = await utils.replace_labels(
          settings.from_name + settings.from_email,
          email
        );
        message.from = from;
        message.html = await utils.replace_labels(htm_text, email);
        let info = await this.transport.sendMail(message);
        logger.info(chalk`{bold [*] Message sent for ${email} !}`);
        logger.info(chalk`{bold [->] Test email sent for ${email}.!}`);
      }
    }
  }
}
(async function () {
  logger.info(chalk`{bold [>] Starting Emailer !}`);
  logger.info(chalk`{bold [>] Initializing SMTP !}`);
  let emailer = await new Emailer();
  await emailer._set_server();
  await emailer.start_emailing();

  logger.info(chalk`{bold [>] RUN COMPLETE !}`);
  await emailer._show_status();
})();
