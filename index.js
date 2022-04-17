const fs = require('fs');
const  readline = require('readline');
const http = require('http');

const file = 'C:\\Users\\xiul2\\Downloads\\go-cqhttp_windows_amd64\\logs\\2022-04-17.log';
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
            console.log(sender['nickname']+"在群"+group_id+"发送了一条消息");
            send(group_id,user_id);
        });
    });
}
function send(group_id,user_id) {
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