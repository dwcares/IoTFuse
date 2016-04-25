var express = require('express');
var app = express();
app.use(express.static('public'));
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var spark = require('spark');
var lastPublish;
var lastTemp;
var tempSensorDevice;

app.get('/', function(req, res) {
 res.sendFile(__dirname + '/public/index.html');
});

http.listen(port, function() {
    console.log('listening on *: ' + port);   
});

io.on('error' , function(e) {
    console.log(e);
})

spark.on('login', function() {
    
    spark.getDevice(process.env.ParticleDeviceIdPhoton, function(err, device) {
        if (err) {
            console.log("Error getting device: " + err);
            return;
        }
        
        tempSensorDevice = device;
        console.log("Device connected: "  + device.connected);
        
        forceRefresh();
    });
    
    io.on('connection', function(socket){
        console.log('a user connected');
        socket.on('tryrefresh', forceRefresh);
        
        publish();  
    });
    
    spark.getEventStream('tempf', process.env.ParticleDeviceIdPhoton, function(msg) {
        if (msg) {
            console.log("Event: " +msg.name +":" + msg.data);
            
            lastTemp = msg.data;
            lastPublish = Date.now();
            
            publish();
        }   
    });
    
    function forceRefresh () {
            if (!tempSensorDevice) return;
                
            tempSensorDevice.getVariable('tempf', function(err, data) {
                if (err) {
                    console.log("Error getting temp: " + err);
                    return;
                }
    
                console.log("Current temp: " + data.result);
                lastTemp = data.result;
                lastPublish = Date.now();
                
                publish();
            });
    }
    
    function publish() {
        
        if (lastTemp) {
            io.emit('tempf',  {tempf: lastTemp, updated: lastPublish});    
        }
    }
});

spark.login({ accessToken: process.env.ParticleAccessToken });
