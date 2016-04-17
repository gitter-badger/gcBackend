"use strict";

const Promise = require("bluebird");
const spawn = require('child_process').spawn;
const Express = require("express");
const bodyParser = require("body-parser");
const os = require("os");

const servers = require("./servers.json");
const config = require("./config.json");
let app = Express();

app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", config.access.acao);
  res.header("Access-Control-Allow-Headers", config.access.acah);
  next();
});


function execute(command,args){
    return new Promise((resolve,reject)=>{
	let prog = spawn(command,args,{
          "detached":true
        });
        let output = '';
        let error = '';

        prog.stdout.on('data',(data)=>{
            output += data;
        });

        prog.on('close',(data)=>{
            console.log(data);
            
            if(error)
                reject(error);

            resolve(output);
            
        });

        prog.stderr.on('data',(data)=>{
            error += data;
        });

    })
    
};

function server_command(gameObject, command){
    let sudo = "sudo";
    let args = [];
    let baseCommand = gameObject.base_command.split(" ");
    let commandSplit = command.split(" ");

    args.push("-u");
    args.push(gameObject.user);
    args.push("-s");
    
    args.push(gameObject.location+"/"+baseCommand[0]);
    baseCommand.forEach((arr)=>{
        if(arr == baseCommand[0])
            return;
        args.push(arr);
    });

    args.push(commandSplit[0]);
    console.log("commandsplit0: "+commandSplit);

    commandSplit.forEach((arr)=>{
        console.log(arr);
        if(arr == commandSplit[0])
            return;
        args.push(arr);
    });
    console.log(args);
	return execute(sudo,args);
}

app.post("/api/servers",(request,response)=>{

    if(!request.body.hasOwnProperty("id")||!request.body.hasOwnProperty("action")){
        response.send({
            "error":"request not found"
        });
        return;
    }

    const requestedServer = request.body.id;
    const action = request.body.action;

    if(!servers.hasOwnProperty(requestedServer)){
        response.send({
            "error":"game not found"
        });
        return;
    }

    if(!servers[requestedServer].commands.hasOwnProperty(action)){
        response.send({
            "error":"action not found"
        });
        return;
    }


    if(typeof servers[requestedServer].commands[action] === "object"){
        let promises = [];
        for(let k in servers[requestedServer].commands[action]){
            const command = servers[requestedServer].commands[action][k];
            console.log(command);
            promises.push(server_command(servers[requestedServer],command));
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
        const command = servers[requestedServer].commands[action];
        console.log(command);
        server_command(servers[requestedServer],command)
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

app.get("/api/library/:id",(request,response)=>{
    let id = request.params.id;
    if(!servers.hasOwnProperty(id)){
        console.log("bad request");
        response.send({
            "error":"id not found"
        });
        return;
    }

    let serverLib = JSON.parse(JSON.stringify(servers[id]));
    
   
    delete serverLib.location;
    delete serverLib.base_command;
    delete serverLib.user;
    let comArr = [];
    for(let command in serverLib.commands){
        comArr.push(command);
    }
    serverLib.commands = comArr; 
    
    response.send(serverLib);
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
    let serverLib = JSON.parse(JSON.stringify(servers));
    for(let id in serverLib){
        delete serverLib[id].location;
        delete serverLib[id].base_command;
        delete serverLib[id].user;
        let comArr = [];
        for(let command in serverLib[id].commands){
            comArr.push(command);
        }
        serverLib[id].commands = comArr; 
    }
    response.send(serverLib);
});


app.listen(config.network.port,console.log("started on port 8080"));
