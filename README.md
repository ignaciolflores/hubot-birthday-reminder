# hubot-birthday-reminder

A hubot script to track birthdays

See [`src/birthday-reminder.coffee`](src/birthday-reminder.coffee) for full documentation.

## Installation

In hubot project repo, run:

`npm install hubot-birthday-reminder --save`

Then add **hubot-birthday-reminder** to your `external-scripts.json`:

```json
["hubot-birthday-reminder"]
```

## Configuration

1. The default date format is MM/DD. You can change this by supplying a `BIRTHDAY_DATE_FORMAT` environment variable.
2. Hubot will wish a happy birthday to a day's users if cron is able to run. You can set the frequency by supplying a `BIRTHDAY_CRON_STRING` environment variable with a cron setting in it. By default, Heroku appears to run on GMT. So for example, to run at 9:30am CST every day, you can add `0 13 * * *`.
3. The default Slack room where hubot will post its birthday wishes is #general. You can change this by supplying a `BIRTHDAY_DAILY_POST_ROOM` environment variable.

## Sample Interaction

```
user1>> set birthday user 07/24
hubot>> user is now born on 07/24
```

```
user1>> hubot list birthdays
hubot>> user was born on 07/24
```