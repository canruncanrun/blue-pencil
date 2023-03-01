const express = require("express");
const app = express();
app.use(express.static("www"));
var db = require("../db.json")
const server = app.listen(3000, function () {
    console.log("服务器启动成功");
});

function ran() {
    let a = Math.floor(Math.random() * db.length)
    return db[a]
}

 let wrod =  ran()
// 请求 WebSocket 模块
const WebSocket = require("ws")
// 创建 WebSocket 服务对象
const websocket = new WebSocket.Server({
    server: server
})

// 定义一个数组保存所有链接到服务器的用户
let userList = [];
var playerTopList = []
var time = 10
var nownaem = ''
// 监听客户端程序链接事件
// connection：当有新用户链接到服务器websocket时触发这个监听
// 回调函数参数：ws表示客户端的websocket对象，req表示请求对象
websocket.on("connection", (ws, req) => {
    // console.log(req.connection.remoteAddress);
    let ip = req.connection.remoteAddress
    ws.ip = ip
    // console.log(req.url);
    let nickname = decodeURI(req.url.substring(1))
    ws.nickname = nickname
    ws.num=0
    if (userList.length === 0) {
        ws.vip = true
    } else {
        ws.vip = false
    }

    // 通知除自己外的其他人：谁进入了聊天室
    userList.forEach(item => {
        let data = {
            nickname: nickname,
        }
        item.send(JSON.stringify(data))
    })

    // 把自己也加入到列表
    userList.push(ws)

    // 通知所有人目前聊天室在线人数
    userList.forEach(item => {
        let data = {
            type: "welcome",
            content: `欢迎来到${nickname}画我猜，目前在线人数：${userList.length}人`
        }
        item.send(JSON.stringify(data))
    })
    wanjiadadui()
    function wanjiadadui() {
        userList.forEach(item => {
            var nameList = userList.map((item) => {
                return { name:item.nickname , num :item.num }
            })
            console.log(nameList);
            let data = {
                nameList,
                type: "playerList"
            }
            item.send(JSON.stringify(data))
        })
    }
    // 监听客服端发过来的消息
    ws.on("message", data => {
        let dataObj = JSON.parse(data);
        // 防止跨网站攻击
        if (dataObj.data) {
            dataObj.data = dataObj.data.replace(/</g, "&lt;")
            dataObj.data = dataObj.data.replace(/>/g, "&gt;")
        }
        switch (dataObj.type) {
            case "group":
                console.log(111);
                console.log(wrod);
                console.log(dataObj.data);
                if (wrod.word == dataObj.data) {
                    console.log(wrod);
                    console.log(222);
                    console.log(ws.num);
                    ws.num +=1
                    console.log(ws.num);
                    wanjiadadui()
                }
                userList.forEach(item => {
                    let data = {
                        type: "group",
                        content: dataObj.data,
                        nickname: ws.nickname,
                        ip: ws.ip,
                      
                    }
                    item.send(JSON.stringify(data))
                })
                break;
            // 鼠标按下
            case "down":

                userList.forEach(item => {
                    let data = {
                        type: 'down',
                        moveTo: dataObj.moveTo,
                        colors: dataObj.colors,
                        lineWidth: dataObj.lineWidth


                    }
                    item.send(JSON.stringify(data))
                })
                break;
            case "move":

                userList.forEach(item => {
                    let data = {
                        type: 'move',
                        lineTo: dataObj.lineTo,

                    }
                    item.send(JSON.stringify(data))
                })
                break;
            case "clearRect":

                userList.forEach(item => {
                    let data = {
                        type: 'clearRect',
                    }
                    item.send(JSON.stringify(data))
                })
                break;
            case "eraser":
                userList.forEach(item => {
                    let data = {
                        type: 'eraser',
                        lineTo: dataObj.lineTo,
                        lineWidth: dataObj.lineWidth
                    }
                    item.send(JSON.stringify(data))
                })
                break;
            
            case "playerTop":
                // 把名字加到数组

                if (playerTopList.indexOf(dataObj.name) == -1) {
                    playerTopList.push(dataObj.name)

                }
                // 给所有的发列表 时间 名字
                // 给数组第一个发送 关键词

                // if (playerTopList.length <=1) {
                playeruser(dataObj.name)
                function playeruser(name) {
                    if (playerTopList.indexOf(name) == 0) {
                        nownaem = name
                        var set = setInterval(() => {
                            let data = {
                                name: name,
                                type: 'playerTop',
                                playerTopList,
                                time: time--
                            }
                            userList.forEach(item => {
                                item.send(JSON.stringify(data))
                            })
                            if (time == 0) {
                                clearInterval(set)
                                let user = userList.find(item => item.nickname === playerTopList[0])
                                if (user) {
                                    let data1 = {
                                        type: "isplayerTop",

                                        isplayerTop: false,

                                    }
                                    user.send(JSON.stringify(data1))
                                }
                                playerTopList.splice(0, 1)
                                playeruser(playerTopList[0])
                                time = 10
                            }
                        }, 1000)
                        let user = userList.find(item => item.nickname === playerTopList[0])
                        if (user) {
                            let data1 = {
                                type: "isplayerTop",
                                isplayerTop: true,
                                wrod,
                            }
                            
                            let t = setTimeout(() => {
                                user.send(JSON.stringify(data1))
                                clearTimeout(t)
                            },1000)
                            

                        }
                    } else {
                        // 给不是滴一个进来的发消息
                        userList.forEach(item => {
                            let data = {
                                name: nownaem,
                                type: 'playerTop2',
                                playerTopList,
                                time
                            }
                            item.send(JSON.stringify(data))
                        })
                    }
                }

                break;
            default:
                break;
        }
    })

    // 关闭链接
    ws.on("close", () => {
        // 1.退出聊天室
        let index = userList.indexOf(ws)
        if (index >= 0) {
            userList.splice(index, 1)

        }
        userList.forEach(item => {
            let data = {
                type: "in-out",

                content: nickname + '退出聊天室'
            }
            item.send(JSON.stringify(data))
            
        })
        let delindex = playerTopList.indexOf(nickname)
        if (delindex >= 0) {
            playerTopList.splice(index, 1)
            userList.forEach(item => {
                let data = {
                    type: 'playerTop',
                    playerTopList
                }
                item.send(JSON.stringify(data))
            })
        }

        wanjiadadui()


    })
})


// XSS：HTML是一种超文本标记语言，通过将一些字符特殊地对待来区别文本和标记，例如，小于符号（<）被看作是HTML标签的开始，<title>与</title>之间的字符是页面的标题等等。当动态页面中插入的内容含有这些特殊字符（如<）时，用户浏览器会将其误认为是插入了HTML标签，当这些HTML标签引入了一段JavaScript脚本时，这些脚本程序就将会在用户浏览器中执行。所以，当这些特殊字符不能被动态页面检查或检查出现失误时，就将会产生XSS漏洞。