const mongo = require('mongodb').MongoClient;
const io = require('socket.io').listen(5000).sockets;

// Connect to mongo
mongo.connect('mongodb+srv://DBUser:andygabriel@cluster0.yfoo5.mongodb.net/chat-real-t', function(err, client){
    if(err){
        throw err;
    }

    console.log('MongoDB connected...');

    // Connect to Socket.io
    io.on('connection', function(socket){
        let chat = client.db('chat-real-t').collection('chats');

        // Create function to send status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        // Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }

            // Emit the messages
            socket.emit('text-event', res);
        });

        // Handle input events
        socket.on('send-message', function(data){
            let name = data.name;
            let message = data.message;

            // Check for name and message
            if(name == '' || message == ''){
                // Send error status
                sendStatus('Please enter a name and message');
            } else {
                // Insert message
                chat.insert({name: name, message: message}, function(){
                    socket.emit('text-event', [data]);
                    socket.broadcast.emit('text-event', [data]);

                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });

        // Handle clear
        socket.on('clear', function(data){
            // Remove all chats from collection
            chat.remove({}, function(){
                // Emit cleared
                socket.emit('cleared');
            });
        });
    });
});



