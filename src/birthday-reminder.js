// Description:
//   Track birthdays for users
//
// Dependencies:
//   "moment": "^2.20.1"
//   "node-schedule": "^1.3.0"
//
// Commands:
//   set birthday @username mm/dd - Set a date of birth for a user. Date format is customizable with an ENV variable.
//   hubot list birthdays - List all known birthdays
//
// Notes:
//   Birthday greeting messages based on Steffen Opel's
//   https://github.com/github/hubot-scripts/blob/master/src/scripts/birthday.coffee
//   Updated to allow any valid date format, according to the moment library
//
// Author:
//   Phill Farrugia <me@phillfarrugia.com>
//   MinnPost <tech@minnpost.com>

const schedule = require('node-schedule');
const moment = require('moment');

const date_format = process.env.BIRTHDAY_DATE_FORMAT || "MM/DD";
const daily_post_room = process.env.BIRTHDAY_DAILY_POST_ROOM || "#general";

module.exports = function(robot) {

  // runs a cron job every day at 9:30 am
  let quote;
  const dailyBirthdayCheck = schedule.scheduleJob(process.env.BIRTHDAY_CRON_STRING, function() {
    let msg;
    console.log("checking today's birthdays...");
    const birthdayUsers = findUsersBornOnDate(moment(), robot.brain.data.users);

    if (birthdayUsers.length === 1) {
      // send message for one users birthday
      msg = `Today is <@${birthdayUsers[0].name}>'s birthday!`;
      msg += `\n${quote()}`;
      return robot.messageRoom(daily_post_room, msg);
    } else if (birthdayUsers.length > 1) {
      // send message for multiple users birthdays
      msg = "Today is ";
      for (let idx = 0; idx < birthdayUsers.length; idx++) {
        var user = birthdayUsers[idx];
        msg += `<@${user.name}>'s${idx !== (birthdayUsers.length - 1) ? " and " : ""}`;
      }
      msg += " birthday!";
      msg += `\n${quote()}`;
      return robot.messageRoom(daily_post_room, msg);
    }
  });

  robot.respond(/check birthdays/i, function(msg) {
    const birthdayUsers = findUsersBornOnDate(moment(), robot.brain.data.users);

    if (birthdayUsers.length === 1) {
      // send message for one users birthday
      msg = `Today is <@${birthdayUsers[0].name}>'s birthday!`;
      msg += `\n${quote()}`;
      return robot.messageRoom(daily_post_room, msg);
    } else if (birthdayUsers.length > 1) {
      // send message for multiple users birthdays
      msg = "Today is ";
      for (let idx = 0; idx < birthdayUsers.length; idx++) {
        var user = birthdayUsers[idx];
        msg += `<@${user.name}>'s${idx !== (birthdayUsers.length - 1) ? " and " : ""}`;
      }
      msg += " birthday!";
      msg += `\n${quote()}`;
      return robot.messageRoom(daily_post_room, msg);
    } else {
      msg = "Nobody has a birthday today";
      return robot.messageRoom(daily_post_room, msg);
    }
  });

  robot.hear(/(set birthday) (?:@?([\w .\-]+)\?*) (.*)/i, function(msg) {
    const name = msg.match[2];
    const date = msg.match[3];

    const check_date = moment(date, date_format, true);
    if (!check_date.isValid()) {
      msg.send(`This date doesn't appear to be a valid birthdate for ${name}. A valid date format is ${date_format}.`);
      return;
    }
      
    const users = robot.brain.usersForFuzzyName(name);
    if (users.length === 1) {
      const user = users[0];
      const date_formatted = moment(date, date_format);
      const date_unix = date_formatted.unix();
      user.date_of_birth = date_unix;
      return msg.send(`${name} is now born on ${moment.unix(user.date_of_birth).format(date_format)}`);
    } else if (users.length > 1) {
      return msg.send(getAmbiguousUserText(users));
    } else {
      return msg.send(`${name}? Never heard of 'em`);
    }
  });

  robot.hear(/(remove birthday) (?:@?([\w .\-]+)\?*)\b/i, function(msg) {
    const name = msg.match[2];

    const users = robot.brain.usersForFuzzyName(name);
    if (users.length === 1) {
      const user = users[0];
      user.date_of_birth = null;
      return msg.send(`${name} is now a forever alone outsider.`);
    } else if (users.length > 1) {
      return msg.send(getAmbiguousUserText(users));
    } else {
      return msg.send(`${name}? Never heard of 'em`);
    }
  });

  robot.respond(/list birthdays/i, function(msg) {
    const {
      users
    } = robot.brain.data;
    if (users.length === 0) {
      return msg.send("I don't know anyone's birthday");
    } else {
      let message = "";
      for (var k in (users || {})) {
        var user = users[k];
        if (isValidBirthdate(user.date_of_birth)) {
          message += `${user.name} was born on ${moment.unix(user.date_of_birth).format(date_format)}\n`;
        }
      }
      return msg.send(message);
    }
  });

  var getAmbiguousUserText = users => `Be more specific, I know ${users.length} people named like that: ${(Array.from(users).map((user) => user.name)).join(", ")}`;

  // returns `array` of users born on a given date
  var findUsersBornOnDate = function(date, users) {
    const matches = [];
    for (var k in (users || {})) {
      var user = users[k];
      if (isValidBirthdate(user.date_of_birth)) {
        if (equalDates(date, moment.unix(user.date_of_birth))) {
          matches.push(user);
        }
      }
    }
    return matches;
  };

  // returns `true` is date string is a valid date
  var isValidBirthdate = function(date) {
    if (date) {
      if (moment(date).isValid) {
        return true;
      }
    }
    return false;
  };

  // returns `true` if two dates have the same month and day of month
  var equalDates = (dayA, dayB) => (dayA.month() === dayB.month()) && (dayA.date() === dayB.date());

  const quotes = [
      "Hoping that your day will be as special as you are.",
      "Count your life by smiles, not tears. Count your age by friends, not years.",
      "May the years continue to be good to you. Happy Birthday!",
      "You're not getting older, you're getting better.",
      "May this year bring with it all the success and fulfillment your heart desires.",
      "Wishing you all the great things in life, hope this day will bring you an extra share of all that makes you happiest.",
      "Happy Birthday, and may all the wishes and dreams you dream today turn to reality.",
      "May this day bring to you all things that make you smile. Happy Birthday!",
      "Your best years are still ahead of you.",
      "Birthdays are filled with yesterday's memories, today's joys, and tomorrow's dreams.",
      "Hoping that your day will be as special as you are.",
      "You'll always be forever young.",
      "Happy Birthday, you're not getting older, you're just a little closer to death.",
      "Birthdays are good for you. Statistics show that people who have the most live the longest!",
      "I'm so glad you were born, because you brighten my life and fill it with joy.",
      "Always remember: growing old is mandatory, growing up is optional.",
      "Better to be over the hill than buried under it.",
      "You always have such fun birthdays, you should have one every year.",
      "Happy birthday to you, a person who is smart, good looking, and funny and reminds me a lot of myself.",
      "We know we're getting old when the only thing we want for our birthday is not to be reminded of it.",
      "Happy Birthday on your very special day, I hope that you don't die before you eat your cake."
  ];

  return quote = name => quotes[(Math.random() * quotes.length) >> 0];
};
