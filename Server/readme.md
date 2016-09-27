To setup the dependencies required for accessBot, ensure you cd to ./Server/ and run the following script:
sudo./setup.sh 

To run the server, environment variables are needed!

Here is a small shell script that sets up said variables

    #!/bin/bash

    # script for starting our accessBot
    clear
    PORT="3000"
    export PORT

    SESSION_SECRET="putyoursupperawesomesecretrighthere"
    export SESSION_SECRET

    MONGODB_URI="mongodb://localhost/makerauth"
    export MONGODB_URI
    
    #password for root, make live one something better than this
    MASTER_PASS="monkey"
    export MASTER_PASS

    echo "Starting the accessBot!"
    # nodemon accessBot.js # reloads server on source change -> sudo npm install -g nodemon
    node accessBot.js
    
    OUR_FRONT_DOOR="nameofthemaindoorlandlordwouldcomein"
    export OUR_FRONT_DOOR

"nano start.sh" in ./Server/ folder, add above code with your own parameters, ctrl-x to save, and "chmod +x start.sh"

To start the server run ./start.sh
