# Ferry checker

Checks a rest api for ferry openings for the ferry to Tasmania.

# Setup

## prerequisites
Install simple push on your phone (available for both android and ios): http://simplepush.io

Checkout this repo on preferably a computer that runs 24/7 and has a internet connection;

```sh
git clone https://github.com/marcodejongh/ferry-checker.git
```

Cd into it

Make sure you use the right node version, possibly with nvm

```sh
nvm install
```

Any node version support modules should work.

Install dependencies:
```
yarn
```


## Config faff
Now get the request payload for the my booking update screen of the booking you're after.
Go to the following URL updating XXXXX & YYYYY with your booking info
https://www.spiritoftasmania.com.au/my-booking#?booking=XXXXX&lastname=YYYYY&step=ReturnFare&version=2

In there click "change" for the direction you want to notifications for.

Once the page is loaded open chrome devtools by pressing: Option + ⌘ + J (on macOS), or Shift + CTRL + J (on Windows/Linux) 
In the devtools open the network tab. 
Now switch the view to the next month and back to the month you want.
This should have created 2 requests to `/prices`, click the last one.
There click payload and in the payload view click "view source"
Copy paste the JSON in there into `.ferrycheckerrequestrc.json` of your ferry-checker checkout.

Now open `.ferrycheckerrc.yml` and update the `desiredDates` config to have the dates you are looking for.
And also update `simplePushKey` to the key in the simple push app on your phone

## Testing
After setting up all the config run the script to test it:

```sh
node index.mjs
```

## Add it to crontab
If this didn't catastrophically fail, you're good to go. Now add it to your crontab:

```sh
crontab -e
```

For example to run every 5 minutes:

```
*/5 * * * * node ~/ferrychecker/checkferries-node.mjs
```

Make sure to update `~/ferrychecker` to the path appropiate for your computer/server


Done

# Running it in an AWS Lambda

Would probably be pretty easy to achieve, just needs a rollup config for creating a single handler file and probably the cosmic config stuff should be changed to regular imports so the config files end up being bundled too
