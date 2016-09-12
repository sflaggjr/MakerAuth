# Following commands should set up the proper enviornment for ubuntu 16.04 round abouts
# this script will need to be run as sudo

curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
apt-get install -y nodejs

apt-get install -y build-essential

npm install -g pm2
