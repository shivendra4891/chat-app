const socket = io()


// Elements
const $messageForm= document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')


//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const {username, room} = Qs.parse(location.search,{ ignoreQueryPrefix : true})

// auto scroll
const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (msg) => {
    const html = Mustache.render(messageTemplate,{
        message:msg.text,
        timeStamp:moment(msg.createdAt).format('h:mm:ss a'),
        username: msg.username
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})


socket.on('locationMessage', (locMsg)=>{
    const locationHTML = Mustache.render(locationTemplate,{
        location:locMsg.url,
        locTimeStamp:moment(locMsg.createdAt).format('h:mm:ss a'),
        username:locMsg.username
    })
    $messages.insertAdjacentHTML('beforeend',locationHTML)
    autoScroll()
})

socket.on('roomData', ({room, users})=>{
  const html = Mustache.render(sidebarTemplate,{
      room,
      users
  })
  document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled','disabled')

    const msg = e.target.elements.message.value

    socket.emit('sendMessage', msg, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value=''
        $messageFormInput.focus()

        if (error) {
            return alert(error)
        }
        console.log('Message was delivered')
    })
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser');
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (error) => {
            $sendLocationButton.removeAttribute('disabled')
            if (error) {
                return console.log(error)
            }
            console.log('Location sent')
        })
    })
})

socket.emit('join',{ username, room},(error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})