const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const io = require('socket.io-client');

const socket = io('http://localhost:2020', {
    transports: ['websocket'],
    upgrade: false
});

rl.on('line', line => {
    const args = line.split(' ');
    const command = args.splice(0, 1)[0];

    if (command === 'add') {
        socket.emit('add', args);
    } else if (command === 'remove') {
        socket.emit('remove', args);
    } else if (command === 'all') {
        socket.emit('all');
    }else if (command === 'areas') {
        socket.emit('areas');
    } else if (command === 'disconnect') {
        socket.disconnect();
    }
});

socket.on('connect', () => {
    console.log('Connected to server.');
});

socket.on('all', (all) => {
    console.log(`Got all: ${all.join(', ')}`);
});

socket.on('areas', (areas) => {
    console.log(`Got areas: ${areas.join(', ')}`);
});

socket.on('update', update => console.log(update));

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});