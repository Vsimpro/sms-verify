const path       = require('path');
const cors       = require('cors')
const express    = require("express");
const bodyParser = require('body-parser');
const dotenv     = require("dotenv");
dotenv.config()

// Global Variables
const auth = Buffer.from(process.env.AUTH).toString("base64");

var app = express()
var port = 3210

app.options('*', cors()) 
app.use(express.json({type: '*/*'}))

var users = [{
    "name"      : "example",
    "number"    : "0400500418",
    "verified"  : false,
    "code"      : 000000
}]

function send_sms(receiver, code) {
    let data = {
        from:    "elks",
        to:       receiver,
        message: `Your authentication code is ${code}`,
    }
    
    data = new URLSearchParams(data);
    data = data.toString();

    fetch("https://api.46elks.com/a1/sms", {
        method: "post",
        body: data,
        headers: {"Authorization": "Basic "  + auth}
    })
    .then(res => res.json)
    .then(json => console.log(json))
    .catch(err => console.log(err))
}

function generate_code() {
    return parseInt(Math.random() * (111110 - 11111) + 11111)
}

app.get('/', (req, res) => {
    console.log( "> GET /" )
    res.sendFile(path.join(__dirname, '/html/index.html'));
})

app.post('/check', (req, res) => {
    console.log( "> GET /check" )

    var user = req.body["name"]
    var stored_user = {}
    for (let i = 0; i < users.length; i++) {
        if ( user == users[ i ][ "name" ] ) {
            stored_user = users[ i ]
            break;
        } 
    }

    if ((stored_user == undefined) || (stored_user == null) || (stored_user == {}) ) {
        stored_user["verified"] = false;
    }

    res.send(`${stored_user["verified"]}`)
})

app.post('/verify', (req, res) => {
    console.log( "> GET /verify" )

    var data = req.body;
    var stored_user = {}

    try {
        var user = data["name"]
        for (var i = 0; i < users.length; i++) {
            if ( user != users[ i ][ "name" ] ) {
                continue;
            } 

            stored_user = users[ i ]
            console.log( "+ matching user found" )

            if (data["code"] == stored_user["code"]) {
                console.log( "+ user verified" )
                users[ i ][ "verified" ] == true;
            }

            break;
        }
    } catch (e) {
        console.log("! issue " + e )
        res.send("error")
    }
    res.send("ok")
})

app.post('/create', (req, res) => {
    console.log( "> GET /create" )
    var new_user = {};
    var data = req.body;

    try {

        new_user["name"]     = data["name"];
        new_user["number"]   = data["number"]; 
        new_user["verified"] = false;
        new_user["code"]     = generate_code()

        console.log( `+ new user ${new_user["name"]} created` )

        send_sms( new_user["number"], new_user["code"] )
        console.log( "+ verification sent" )

        users.push( new_user )

    } catch (e) {
        console.log( "! issue " + e)
        res.send("error")
    }
    res.send("ok")
})

app.listen(port, () => {
    console.log( "+ server on http://localhost:" + port )
})
