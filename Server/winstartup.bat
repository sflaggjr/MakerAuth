::This script will setup the enviroment for the accessBot application
::Before running this script, please run winsetup.cmd to ensure that you have the proper node modules
::Please modify the SET values to the values related to your environment
@ECHO OFF
CLS
SET port=3000
SET SESSION_SECRET=putyoursupperawesomesecretrighthere
SET MONGODB_URI=mongodb://localhost/makerauth/
SET MASTER_PASS=monkey
ECHO accessBot Started
node accessBot.js
SET OUR_FRONT_DOOR=frontdoor
