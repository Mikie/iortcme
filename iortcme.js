var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var sha256 = require("sha256");
var usercount = 0;
var players = {};
app.get('/', function(req, res){
  res.sendFile(__dirname + '/static/index.html');
});
function distance(x1, y1, x2, y2) {
    const xDist = x2 - x1;
    const yDist = y2 - y1;

    return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
}

io.on('connection', function(socket){
    
    usercount++;
    console.log(`a user connected- user count is ${usercount}`);
    players[socket.client.id] = {x:0,y:0,size:50};
    socket.emit("special status",require("./specialstatus"));
    socket.emit("player move",{playerid:socket.client.id,x:0,y:0});
    io.emit("player size",{playerid:socket.client.id,size:50});

    // send client all player data as its a new client and is dumb.
    Object.keys(players).forEach(function(curr) {
        if (curr == socket.client.id) return;
        socket.emit("player move", {playerid:curr,x:players[curr].x,y:players[curr].y});
        socket.emit("player size", {playerid:curr,size:players[curr].size});
    });
    socket.on("player move",function(location){
        if (players[socket.client.id].dead) return;
        if (!location.x || !location.y) return;
        location.playerid = socket.client.id;
        let p = players[socket.client.id];
        p.x = location.x;
        p.y = location.y;
        Object.keys(players).forEach(function(plol) {
            if (plol == socket.client.id) return;
            let target = players[plol];
            let killer = players[socket.client.id];
            if (distance(killer.x,killer.y,target.x,target.y)-30 <= players[socket.client.id].size) {
                target.x=0;
                target.y=0;
                io.emit("player move",{x:target.x,y:target.y,playerid:plol});
                killer.size+=target.size;
                target.size=50;
                io.emit("player size",{playerid:socket.client.id,size:killer.size});
                console.log("a player died.");
                let targetsocket = io.sockets.connected[plol];
                targetsocket.emit("you died");
            targetsocket.emit("special status","You died, but why are you trying to godmode??");
                target.dead = true;
                io.emit("delete player",targetsocket.id);
                delete players[targetsocket.id];
            } 
        
        });
        io.emit("player move",location);
    });

    socket.on('disconnect', function(){
        usercount--;
      console.log(`user disconnected- user count is ${usercount}`);
      delete players[socket.id];
      io.emit("delete player",socket.id);
    });
  });
http.listen(8080, function(){
  console.log('listening on *:8080');
});
    