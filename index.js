#!/usr/bin/env node

var net = require('net')
var websocket = require('websocket-stream')
var pump = require('pump')
var port=process.env.PORT||443
var to=process.env.TO
try{
  to=JSON.parse(to)
}catch(err){
  to=null
}
port=port/1
if(!to || isNaN(port)){
  console.log("need env TO and PORT")
  process.exit(2)
}
websocket.createServer({port: port}, handle)

function handle (stream) {
  pump(stream, net.connect(to), stream)
}
