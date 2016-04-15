"use strict";

const Promise = require("bluebird");
const spawn = require('child_process').spawn;
const Express = require("express");
const bodyParser = require("body-parser");
const os = require("os");

const games = require("./commands.json");
let app = Express();
app.use(bodyParser.json());
function execute(command,args){
    return new Promise((resolve,reject)=>{
        let prog = spawn(command,args);
        let output = '';
        let error = '';


        prog.stdout.on('data',(data)=>{
            output += data;
        });

        prog.on('close',(data)=>{
            if(error)
                reject(error);

            resolve(output);
            
        });

        prog.stderr.on('data',(data)=>{
            error += data;
        });

    })
    
};

function game_command(gameObject, command){
    let basecommand = "sudo";
    let args = [];

    args.push("-u");
    args.push(gameObject.user);
    args.push("-s");
    console.log(gameObject.base_command);
    console.log(gameObject.base_command.split(" "));
    let baseCommand = gameObject.base_command.split(" ");
    args.push(gameObject.location+"/"+baseCommand[0]);
    baseCommand.forEach((arr)=>{
        if(arr == baseCommand[0])
            return;
        args.push(arr);
    });
    args.push(command);

	let commandString = "sudo -u " + gameObject.user + " -s ";
    commandString += gameObject.location+"/"+gameObject.base_command + " " + command;
    console.log(args);
	return execute(basecommand,args);
}

app.post("/api/servers",(request,response)=>{

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
    
    
});

app.get("/api/sysload",(request,response)=>{
    let coreCount = os.cpus().length;
    let loadArr = [];

    os.loadavg().forEach((core)=>{
        loadArr.push(core/coreCount*100);
    });
    response.send({
        "1":loadArr[0],
        "5":loadArr[1],
        "15":loadArr[2]
    });

});

app.get("/api/library",(request,response)=>{
    let servers = games;
    for(let server in games){
        delete servers[server].location;
        delete servers[server].base_command;
        delete servers[server].user;
        let comArr = [];
        for(let command in servers[server].commands){
            comArr.push(command);
        }
        servers[server].commands = comArr; 
    }
    response.send(servers);
});


app.listen(8080,console.log("started on port 8080"));
