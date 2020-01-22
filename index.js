#!/usr/bin/env node

var net = require('net')
var websocket = require('websocket-stream')
var pump = require('pump')
var port=process.env.PORT||443
var to=process.env.TO
if(!to){
  console.log("need env TO")
  process.exit(2)
}
websocket.createServer({port: port}, handle)

function handle (stream) {
  pump(stream, net.connect(to), stream)
}
