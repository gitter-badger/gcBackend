"use strict";

const Promise = require("bluebird");
const exec = require('child_process').exec;
const Express = require("express");
const bodyParser = require("body-parser");

let games = require("./commands.json");
let app = Express();
app.use(bodyParser.json());
function execute(command){
    return new Promise((resolve,reject)=>{
        return exec(command, function(error, stdout, stderr){
            if(!error)
                resolve(stdout);
            if(error)
                reject(stderr);
        });
    })
    
};

function game_command(gameObject, command){
	let commandString = "sudo -u " + gameObject.user + " -s ";
    commandString += gameObject.location+gameObject.base_command + " " + command;
    console.log(commandString);
	return execute(commandString);
}

app.post("/api",(request,response)=>{

    if(!request.body.hasOwnProperty("game")||!request.body.hasOwnProperty("action")){
        response.send({
            "error":"request not found"
        });
        return;
    }

    const game = request.body.game;
    const action = request.body.action;

    if(!games.hasOwnProperty(game)){
        response.send({
            "error":"game not found"
        });
        return;
    }

    if(!games[game].commands.hasOwnProperty(action)){
        response.send({
            "error":"action not found"
        });
        return;
    }


    if(typeof games[game].commands[action] === "object"){
        let promises = [];
        for(let k in games[game].commands[action]){
            const command = games[game].commands[action][k];
            console.log(command);
            promises.push(game_command(games[game],command));
        }
        Promise.all(promises).then((output)=>{
            output.forEach((line)=>{
                console.log("Output from command: "+line);
            })
            response.send({
                "status":"success"
            });
        })
        .catch((e)=>{
            response.send({
                "status":"failed",
                "message":e
            });
        });
    }else{
        const command = games[game].commands[action];
            console.log(command);
            game_command(games[game],command)
            .then(()=>{
                response.send({
                    "status":"success"
                });
            })
            .catch((e)=>{
                    response.send({
                    "status":"failed",
                    "message":e
                });
            });
    }
    

    /*game_command(game,command)
    .then((output)=>{
        console.log(output);
    });*/



    
});


app.listen(8080,console.log("started on port 8080"));