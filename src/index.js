const express = require('express')
const http= require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {getUserInRoom,getUser,removeUser,addUser} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const pathDirectory = path.join(__dirname,'../public')

app.use(express.static(pathDirectory))


io.on('connection',(socket)=>{
    console.log('New Websocket Connection')
    
    socket.on('join', (options, callback)=>{
        const {error, user} = addUser({ id: socket.id, ...options})

        if(error){
            return callback(error) 
        }
        socket.join(user.room)

        socket.emit('message', generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`))

        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUserInRoom(user.room)
        })

        // callback function to acknowledge the user is added properly
        callback()
    })

    socket.on('sendMessage',(msg, callback)=>{
        const filter = new Filter()
        const user = getUser(socket.id)
        if(!user) {
            return callback({error:'Error in getting user info'})
        }

        if(filter.isProfane(msg)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message',generateMessage(user.username, msg))
        callback()
    })

    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUserInRoom(user.room)
            })
        }
    })

    socket.on('sendLocation',(coords, callback)=>{
        const user = getUser(socket.id)
        if(!user) {
            return callback({error:'Error in getting user info'})
        }
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username, coords))
        callback()
    })
  
})

server.listen(port, ()=>{
    console.log(`Server is started....${port}`)
})
