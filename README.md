# GC-Panel

##This project aims to be a backend for a Gameserver Webinterface. Frontend will follow.

###Install
1. git clone
2. npm install
3. create/edit the commands.json file. Should be self explanatory enough for now
4. edit sudoer file in /etc/sudoers like this
```bash
webinterface ALL=(ts3) NOPASSWD: /bin/bash
```
* webinterface is the user which is running the webinterface
* ts3 is the user you want to run a server as. In this case, the webinterface starts a TeamSpeak3 Server with the ts3 user without having to enter a password

##Starting
```bash
node index.js
```
##API POST
http://localhost:8080/api/servers
```javascript
{
  "game":"test01",
  "action":"start"
}
```

* *test01* is the json object for the TeamSpeak3 Server.
* *start* is the command that is found in the test01 json object.

If an action need to execute more than one command just put then in an array.

The response is pretty simple and self explanatory.
If everything works, it returns success. If something f***ed up, it returns an error message.

##API GET
http://localhost:8080/api/library

```javascript
{
  "test01": {
    "game": "Test Server",
    "commands": [
      "start",
      "stop",
      "restart"
    ]
  }
}
```
Pretty self explanatory

* test01 is server id (Like minecraft_server_1)
* game: is the game name (Like Minecraft)
* commands is an array out of all commands available

http://localhost:8080/api/sysload

returns:
```javascript
{
  "1":"10",
  "5":"11",
  "15":"12"
}
```
* Key = Minutes
* Value = Average load in these last minutes

##To-Do
* load port from config file
* get system load over API
* get all games/servers available over API
