# Description:
#   Track birthdays for users
#
# Dependencies:
#   "moment": "^2.20.1"
#   "node-schedule": "^1.3.0"
#
# Commands:
#   set birthday @username mm/dd - Set a date of birth for a user. Date format is customizable with an ENV variable.
#   hubot list birthdays - List all known birthdays
#
# Notes:
#   Birthday greeting messages based on Steffen Opel's
#   https://github.com/github/hubot-scripts/blob/master/src/scripts/birthday.coffee
#   Updated to allow any valid date format, according to the moment library
#
# Author:
#   Phill Farrugia <me@phillfarrugia.com>
#   MinnPost <tech@minnpost.com>

schedule = require('node-schedule')
moment = require('moment')

date_format = process.env.BIRTHDAY_DATE_FORMAT || "MM/DD"
daily_post_room = process.env.BIRTHDAY_DAILY_POST_ROOM || "#general"

module.exports = (robot) ->

  regex = /^(set birthday) (?:@?([\w .\-]+)\?*) (.*)/i

  # runs a cron job every day at 9:30 am
  dailyBirthdayCheck = schedule.scheduleJob process.env.BIRTHDAY_CRON_STRING, ->
    console.log "checking today's birthdays..."
    birthdayUsers = findUsersBornOnDate(moment(), robot.brain.data.users)

    if birthdayUsers.length is 1
      # send message for one users birthday
      msg = "Today is <@#{birthdayUsers[0].name}>'s birthday!"
      msg += "\n#{quote()}"
      robot.messageRoom daily_post_room, msg
    else if birthdayUsers.length > 1
      # send message for multiple users birthdays
      msg = "Today is "
      for user, idx in birthdayUsers
        msg += "<@#{user.name}>'s#{if idx != (birthdayUsers.length - 1) then " and " else ""}"
      msg += " birthday!"
      msg += "\n#{quote()}"
      robot.messageRoom daily_post_room, msg

  robot.respond /check birthdays/i, (msg) ->
    birthdayUsers = findUsersBornOnDate(moment(), robot.brain.data.users)

    if birthdayUsers.length is 1
      # send message for one users birthday
      msg = "Today is <@#{birthdayUsers[0].name}>'s birthday!"
      msg += "\n#{quote()}"
      robot.messageRoom daily_post_room, msg
    else if birthdayUsers.length > 1
      # send message for multiple users birthdays
      msg = "Today is "
      for user, idx in birthdayUsers
        msg += "<@#{user.name}>'s#{if idx != (birthdayUsers.length - 1) then " and " else ""}"
      msg += " birthday!"
      msg += "\n#{quote()}"
      robot.messageRoom daily_post_room, msg
    else
      msg = "Nobody has a birthday today"
      robot.messageRoom daily_post_room, msg

  robot.hear regex, (msg) ->
    name = msg.match[2]
    date = msg.match[3]

    check_date = moment(date, date_format, true)
    unless check_date.isValid()
      msg.send "This date doesn't appear to be a valid birthdate for #{name}. A valid date format is #{date_format}."
      return
      
    users = robot.brain.usersForFuzzyName(name)
    if users.length is 1
      user = users[0]
      date_formatted = moment(date, date_format);
      date_unix = date_formatted.unix();
      user.date_of_birth = date_unix
      msg.send "#{name} is now born on #{moment.unix(user.date_of_birth).format(date_format)}"
    else if users.length > 1
      msg.send getAmbiguousUserText users
    else
      msg.send "#{name}? Never heard of 'em"

  robot.respond /list birthdays/i, (msg) ->
    users = robot.brain.data.users
    if users.length is 0
      msg.send "I don't know anyone's birthday"
    else
      message = ""
      for k of (users or {})
        user = users[k]
        if isValidBirthdate user.date_of_birth
          message += "#{user.name} was born on #{moment.unix(user.date_of_birth).format(date_format)}\n"
      msg.send message

  getAmbiguousUserText = (users) ->
    "Be more specific, I know #{users.length} people named like that: #{(user.name for user in users).join(", ")}"

  # returns `array` of users born on a given date
  findUsersBornOnDate = (date, users) ->
    matches = []
    for k of (users or {})
      user = users[k]
      if isValidBirthdate user.date_of_birth
        if equalDates date, moment.unix(user.date_of_birth)
          matches.push user
    return matches

  # returns `true` is date string is a valid date
  isValidBirthdate = (date) ->
    if date
      if moment(date).isValid
        return true
    return false

  # returns `true` if two dates have the same month and day of month
  equalDates = (dayA, dayB) ->
    return (dayA.month() is dayB.month()) && (dayA.date() is dayB.date())

  quotes = [
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
  ]

  quote = (name) ->
    quotes[(Math.random() * quotes.length) >> 0]
