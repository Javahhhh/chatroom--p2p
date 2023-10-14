var app = require('express')()
var server = require('http').Server(app)
var io = require('socket.io')(server)

let users =[]
const userIdMap = new Map();
let messages = [];
server.listen(3000,() =>{
    console.log('服务器启动成功')
})

// 把public设置为公共的资源目录
app.use(require('express').static('public'))

app.get('/', function(req, res) {
    res.redirect('/index.html')
})


io.on('connection', function(socket) {
    // 注册登录事件
    socket.on('login',data =>{
        //判断，如果data在users中存在，说明该用户已经登录了，不允许登录
        //如果data在users中不存在，说明用户没有登录，允许用户登录

        // let user = { name: data.username, avatar: data.avatar, unreadMessage: '' };
        let user = users.find(item =>item.username=== data.username)
        if (user){
            //表示用户存在,登录失败，服务器需要给当前用户响应,告诉登陆 失败
            socket.emit('loginError',{msg:'登录失败'})
            console.log('登录失败')
        } else {
            //表示用户不存在，登录成功。
            users.push(data)
            //告诉用户，登录成功
            socket.emit('loginSuccess',data)
            // console.log('登录成功')

            //告诉所有用户，有新用户加入到聊天室广播消息。
            //socket.emit:告诉当前用户
            //IO.emit:广播事件
            io.emit('addUser',data)
                //告诉所有用户，目前聊天室有多少人
            io.emit('userList',users)
            userIdMap.set(data.username, socket.id);
            console.log(data.username, socket.id);


            //把登录成功的用户名和头像存储起来
            socket.username =data.username
            socket.avatar = data .avatar
        }
    })

    //用户断开连接
    //监听用户断开连接
    socket.on('disconnect',()=>{
        //把当前用户的信息从users中删除
     let idx = users.findIndex(item => item.username === socket.username)
        //删除掉断开连接的这个人
        users.splice(idx,1)
        //1.告诉所有人。有人离开了聊天室
        io.emit('delUser',{
            username:socket.username,
            avatar:socket.avatar
        })
        //2.告诉所有人，userList发生更新
        io.emit('userList',users)
    })



    //接收图片信息
    socket.on('sendImage',data =>{
        console.log()
        //广播给所有用户
        socket.emit('receiveImage',data)
    })


    //将username转为ID
    socket.on('sendusername', data => {
        const username = data.username;
            // 拿回你的ID
        for (const [name,id] of userIdMap) {
            if (name==username){
                console.log(id,name);
                chatid=id;
            }
        }
        socket.emit('getID', {chatid: chatid });
    });
    //发送消息的
    socket.on('message', data => {
        const chatid = data.chatid;

        console.log("选择聊天对象是：" + chatid);
        console.log("点击者是：" + data.username);

        socket.to(chatid).emit('Chatmessage', data);
    });

   //同时打开点击那个人的窗口--可以打开别人的窗口
    socket.on('sameopen',data =>{
        const  Bname = data.Bname;
        const  Aname = data.Aname;

        for (const [name,id] of userIdMap) {
            if (name==Aname){
                chatid=id;
            }
        }
        socket.to(chatid).emit('opening',{ Bname})
    })

   socket.on('nicesend',data =>{
       const Bname =data.Bname;
       for (const [name,id] of userIdMap) {
           if (name==Bname){
               chatid=id;
           }
       }
       socket.to(chatid).emit('Othermessage',data )
   })


});




