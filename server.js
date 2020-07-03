/* eslint-disable */
var path = require('path');
var express = require('express');
var app = express();
var openBrowsers = require('open-browsers');

// log
const log4js = require('log4js')
log4js.addLayout(
    'json',
    config => logEvent => {
        logEvent.data = logEvent.data[0];
        return JSON.stringify(logEvent) + config.separator;
    }
)

const logConf = require('./conf/log.conf')
log4js.configure(logConf);
const logger = log4js.getLogger('chatLog');

// 开发环境热更新
if (process.env.NODE_ENV !== 'production') {
    var webpack = require('webpack')
    var config = require('./webpack.config')
    var compiler = webpack(config);

    app.use(
        require('webpack-dev-middleware')(compiler, {
            publicPath: config.output.publicPath
        })
    );
    app.use(
        require('webpack-hot-middleware')(compiler)
    );

    app.get('/', (req, res) => {
        const fileName = path.join(config.publicPath, 'index.html');
        compiler.outputFileSystem.readFile(fileName, (err, result) => {
            res.set('content-type', 'text/html');
            res.send(result);
            res.end();
        })
    })
} else {
    app.get('/', (req, res) => {
        res.sendFile(__dirname, 'dist/index.html');
    })
}


var server = require('http').createServer(app);
var io = require('socket.io')(server);

app.use(express.static(path.join(__dirname, '/')));

// 在线用户
var onlineUsers = {};
// 在线用户人数
var onlineCount = 0;

io.on('connection', socket => {
    // 监听客户端的登录
    socket.on('login', ({ uid, username }) => {
        // 用户id设置为socket id
        socket.id = uid;

        // 如果没有这个用户，那么在线人数+1，将其添加进在线用户
        if (!onlineUsers[uid]) {
            onlineUsers[uid] = username;
            onlineCount++;
        };
        // 向客户端发送登陆事件，同时发送在线用户、在线人数以及登陆用户
        io.emit('login', { onlineUsers, onlineCount, user: { uid, username } });
        logger.info({ socketId: socket.id, ip: socket.request.connection.remoteAddress, user: username, event: 'in', message: `${username}加入了群聊` });
        console.log(`${username}加入了群聊`);
    });

    // 监听客户端断开链接
    socket.on('disconnect', () => {
        // 如果有这个用户
        if (onlineUsers[socket.id]) {
            var _user = { uid: socket.id, username: onlineUsers[socket.id] };

            // 删掉这个用户，在线人数减1
            delete onlineUsers[socket.id];
            onlineCount--;

            // 向客户端发送登出事件，同时发送在线用户、在线人数以及登出用户
            io.emit('logout', { onlineUsers, onlineCount, user: _user });
            logger.info({ socketId: socket.id, ip: socket.request.connection.remoteAddress, user: _user.username, event: 'out', message: `${_user.username}退出了群聊` });
            console.log(`${_user.username}退出了群聊`);
        }
    });

    // 监听客户端发出的消息
    socket.on('message', res => {
        io.emit('message', res);
        logger.info({ socketId: socket.id, ip: socket.request.connection.remoteAddress, user: res.username, event: 'chat', message: `${res.username}说：${res.message}` });
        console.log(`${res.username}说：${res.message}`);
    })
});

server.listen(3000, err => {
    if (process.env.NODE_ENV !== 'production') {
        openBrowsers('http://localhost:3000');
    }
    console.log('Listening at *:3000');
})
