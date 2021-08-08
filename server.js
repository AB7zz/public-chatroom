const path = require('path')
const http = require('http')
const express = require('express')

const app = express();
const server = http.createServer(app)
const socketio = require('socket.io')
const io = socketio(server)
const formatMessage = require('./utils/messages')
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users')

// Set static folder
app.use(express.static(path.join(__dirname, 'public')))

const botName = 'AB7Cord Bot'

// Run when a client connects
io.on('connection', socket => {

    socket.on('joinRoom', ({username, room}) => {
        const user = userJoin(socket.id, username, room)
        socket.join(user.room)

        //Welcome current user
        //What socket.emit does is, it only emits to the user
        socket.emit('message', formatMessage(botName, 'Welcome to AB7Cord!'))

        // Broadcast when a user connects
        //what broadcast.emit does it, it will emit to everyone except the user that the user has connected
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`))

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    })


    // Listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id)
        io.to(user.room).emit('message', formatMessage(user.username, msg))
    })

    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id)
        if(user) { 
            // what io.emit does it, it emits to everyone
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`))

            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            })
        }
    })

})

const PORT = 3000 || process.env.PORT

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))