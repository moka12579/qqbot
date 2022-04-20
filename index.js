const fs = require('fs');
const  readline = require('readline');
const http = require('http');
var sqlite3 = require('sqlite3')
const sqlitePath = './db/brush.db';
const decodeImage = require('jimp').read;
const qrcodeReader = require('qrcode-reader');
const https = require("https");


const db = new sqlite3.Database(sqlitePath, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
});
let arrs = [];
let count=0;

const file = 'C:\\Users\\xiul2\\Downloads\\go-cqhttp_windows_amd64\\logs\\2022-04-20.log';
fs.watchFile(file, {interval:100},(curr, prev) => {
    console.log("文件发生变化");

    readFiles();
});
function readFiles() {
    let log = fs.readFileSync(file, {
        encoding: 'utf-8'
    });
    let read = readline.createInterface({
        input: fs.createReadStream(file)
    });
    let arr=[]
    read.on('line', (line) => {
        arr.push(line);
    });
    read.on('close', () => {
        // console.log(arr[arr.length-1]);
        handle(arr[arr.length-1]);
    });
}
function handle(msg) {
    // console.log(msg);
    if (msg.indexOf("收到群 ") != -1){
        let arr = msg.split(" ");
        let length = arr.length;
        let MSG = arr[length-2];
        let msgId = MSG.split("(")[1].split(")")[0]
        find(msgId);
    }
}
function find(msgId) {
    http.get('http://127.0.0.1:8001/get_msg?message_id='+msgId, (res) => {
        let chunks = [];
        res.on('data', (chunk) => {
            chunks.push(chunk);
        });
        res.on('end', () => {
            let body = Buffer.concat(chunks);
            let message=body.toString();
            let data=JSON.parse(message)['data']
            let group_id=data['group_id']
            let sender=data['sender']
            let user_id=sender['user_id']
            let msg=data['message']
            if (arrs.length === 5) {
                arrs.shift();
            }
            let obj = {
                group_id: group_id,
                user_id: user_id,
                msg: msg
            }
            arrs.push(obj)
            arrs.map((item) => {
                if (item.group_id === group_id && item.user_id === user_id && item.msg === msg) {
                    count++;
                } else {
                    count=0;
                }
                if (count == 5) {
                    count=0;
                    sendMsg(group_id,user_id,"疑似刷屏，请检查")
                }
            })
            imgHandle(msg)

            // send(group_id,user_id);
        });
    });
}
function sendAt(group_id,user_id) {
    let msg = '[CQ:at,qq='+user_id+']';
    http.get('http://127.0.0.1:8001/send_group_msg?group_id='+group_id+'&message='+msg, (res) => {
        let chunks = [];
        res.on('data', (chunk) => {
            chunks.push(chunk);
        });
        res.on('end', () => {
            let body = Buffer.concat(chunks);
            let message=body.toString();
            let data=JSON.parse(message)['data']
            let msgId=data['message_id']
            console.log("发送成功，消息ID为"+msgId);
        });
    });
}
function sendMsg(group_id,user_id,message) {
    let msg = '[CQ:at,qq='+user_id+']';
    http.get('http://127.0.0.1:8001/send_group_msg?group_id='+group_id+'&message='+msg+message, (res) => {
        let chunks = [];
        res.on('data', (chunk) => {
            chunks.push(chunk);
        });
        res.on('end', () => {
            let body = Buffer.concat(chunks);
            let message=body.toString();
            let data=JSON.parse(message)['data']
            let msgId=data['message_id']
            console.log("发送成功，消息ID为"+msgId);
        });
    });
}
function imgHandle(msg) {
    console.log(msg)
    if (msg.indexOf("[CQ:image") != -1) {
        let subType=msg.split("subType=")[1].split("]")[0]
        if (subType == 0) {
            let imgUrl = msg.split("url=")[1].split(",")[0];
            let imgName = msg.split("file=")[1].split(",")[0];
            console.log(imgUrl);
            console.log(imgName);
// 用http的get方法来发送请求
            https.get(imgUrl, (response) => {
                //data 存储图片数据，是二进制流
                var data = "";
                // 一定要设置encode，否则即使在pic/downImg/中有1.jpg,也是无法显示的
                response.setEncoding("binary")
                // 当数据到达时会触发data事件
                response.on('data', function (chunk) {
                    data += chunk;
                });
                // 当数据接收完毕之后，会触发end事件
                response.on("end", function () {
                    //写入文件
                    fs.writeFile('./img/'+imgName, data, 'binary', (err) => {
                        if (err) {
                            console.log('写入文件错误')
                        } else {
                            console.log('写入文件成功')
                        }
                    })
                });
            }).on("error", function () {
                console.log('读取错误')
            });
        }
    }
}
function qrDecode(data,callback){
    decodeImage(data,function(err,image){
        if(err){
            callback(false);
            return;
        }
        let decodeQR = new qrcodeReader();
        decodeQR.callback = function(errorWhenDecodeQR, result) {
            if (errorWhenDecodeQR) {
                callback(false);
                return;
            }
            if (!result){
                callback(false);
                return;
            }else{
                callback(result.result)
            }
        };
        decodeQR.decode(image.bitmap);
    });
}