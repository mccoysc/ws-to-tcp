#!/usr/bin/env node

var net = require('net')
var websocket = require('websocket-stream')
var pump = require('pump')
var redis = require('redis');
var client = redis.createClient(process.env.REDISCLOUD_URL, {
  no_ready_check: true
});

client.asyncGet = function (key) {
  const _this = this
  return new Promise(function (res, rej) {
    _this.get(key, function (err, data) {
      if (err) return rej(err)
      return res(data)
    })
  })
}

client.asyncSet = function (key, value) {
  const _this = this
  return new Promise(function (res, rej) {
    _this.set(key, value, function (err, data) {
      if (err) return rej(err)
      return res(data)
    })
  })
}

var port = process.env.PORT || 443
var to = process.env.TO
try {
  to = JSON.parse(to)
} catch (err) {
  to = null
}
port = port / 1
if (isNaN(port)) {
  console.log("need env PORT")
  process.exit(2)
}
websocket.createServer({
  port: port
}, handle)

const qs = require("querystring")

async function handle(stream, request) {
  var url
  var netConnInfo
  if (request.url && request.url.length > 10) {
    if (request.url[0] === '/') {
      url = {
        search: request.url.substr(1)
      }
    } else if (request.url.toLowerCase().indexOf("http")) {
      url = new URL(request.url)
    }
  } else if (request.headers.netConnInfo) {
    url = request.headers.netConnInfo
    url = {
      search: url
    }
    if (url.search[0] !== "?") {
      url.search = "?" + url.search
    }
  } else {
    try {
      url = await client.asyncGet("netConnInfo")
      url = {
        search: url
      }
      if (url.search[0] !== "?") {
        url.search = "?" + url.search
      }
    } catch (error) {
      url = undefined
    }
  }
  try {
    if (url && url.search) {
      pump(stream, net.connect(qs.decode(url.search.substr(1))), stream)
    } else if (to) {
      pump(stream, net.connect(to), stream)
    } else {
      throw new Error("need target connection params,just like 'wss://1.1.1.1/port=443&host=2.2.2.2' to proxy to 2.2.2.2:443")
    }
  } catch (err) {
    console.log("handle stream request err:", JSON.stringify(err))
    stream ? stream.end(JSON.stringify(err)) : null
  }
}
