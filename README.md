# Fraud Detection for twitter
The purpose of this program is to detect fraud on twitter. It does this by targeting a specific companies handle (for example @sprint). It then will read any twitter user that complains to @sprint and begins monitoring for people responding to that tweet that are offering help. If they are not an official supported account then they are marked as fraudulent.

## How it works
#### 1) Find tweets complaining
- Twitter API to read tweets @handle
- Nodejs sentiment to determine if tweet is a complaint
- If tweet is a complaint store using MongoDB

#### 2) Find replies
- Use Twitter API to search the handle of the people who tweeted @handle
- Match in_reply_to_status_id_str to complaining tweet
- Determine if helpful
  - Note: Currently this simply searches through a list of monitored common words. in the future TF-IDF could be used monitoring the official account.
- Verify replying users account
- Store relevant info in MongoDB

#### 3) Display results
- Standard HTML, CSS, and JavaScript front extended
- PassportJS local login method
- Users stored in Nodejs
- Stylized datatables plugin to show tweet info

## Requirements
- In high volume case 2 twitter app keys are used, one for tweet gathering and one for reply searching.
- Nodejs
- MongoDB

## Setup
##### 1) Setup config file like follows
- server/config/authorization.json

```javascript
{
  "url":"mongodb://localhost:27017/DBNAME",
  "port":3000,
  "debug":false, //optional
  "CONSUMER_KEY1":"",
  "CONSUMER_SECRET1":"",
  "ACCESS_KEY1":"",
  "ACCESS_SECRET1":"",
  "CONSUMER_KEY2":"",
  "CONSUMER_SECRET2":"",
  "ACCESS_KEY2":"",
  "ACCESS_SECRET2":""
}
```
#### 2) Create MongoDB collections

```javascript
db.createCollection("tweets")
db.createCollection("constants")
db.createCollection("users")
```

#### 3) User collection in MongoDB

- Only required fields are uname and an md5 hashed password

```javascript
{uname:"criggs626",password:"ijhzgdfiuhasdoifjaosifgadsf"}
```
#### 3) Constants collection in MongoDB
- required for tracking searched tweets and verified handles

```javascript
{name:"lastID",value:"0"}
{name:"verifiedHandles",value:["handle",""]}
```