@ECHO OFF
::
CLS
SET port=3000
SET SESSION_SECRET=putyoursupperawesomesecretrighthere
SET MONGODB_URI=mongodb://localhost/makerauth/
SET MASTER_PASS=monkey
ECHO accessBot Started
node accessBot.js
SET OUR_FRONT_DOOR=frontdoor
