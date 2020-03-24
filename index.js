const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const path = require('path');

const BingParser = require('./core/BingParser');
const Storage = require('./core/Storage');

const Archiver = require('./core/Archiver');

const config = require('./config');

const sockets = {};

const bingParser = new BingParser(config.dataURL);
const storage = new Storage(path.join(__dirname, config.dbFile));

const archiver = new Archiver(bingParser, storage, (areaID, record) => {
    Object.keys(sockets).forEach(socketID => {
        if (sockets[socketID].indexOf(areaID) > -1) io.to(socketID).emit('update', {
            id: areaID,
            record
        });
    });
});

setInterval(() => archiver.run(), 60 * 60 * 1000);
archiver.run();

function getBreadcrumbs(areaId, initial = true) {
    const area = storage.getArea(areaId);
    const bcPath = [ { id: areaId, displayName: area.displayName } ];

    if (area && area.parentId) {
        bcPath.unshift(...getBreadcrumbs(area.parentId, false));
    }

    if (initial) {
        return {
            path: bcPath,
            siblings: area.areas.map(subAreaId => storage.getArea(subAreaId)).map(subArea => ({ id: subArea.id, displayName: subArea.displayName}))
        };
    } else {
        return bcPath;
    }
}

app.get('/data/:area', (req, res) => {
    if (!req.params.area) return res.sendStatus(404);
    const area = storage.hasArea(req.params.area);

    if (!area) return res.sendStatus(404);

    res.send({
        breadcrumbs: getBreadcrumbs(area.parentId),
        area
    });
});

io.on('connection', socket => {
    socket.on('all', () => {
        socket.emit('all', storage.getAreas().map(area => area.id));
    });

    socket.on('areas', () => {
        if (socket.id in sockets) socket.emit('areas', sockets[socket.id]);
    });

    socket.on('add', areas => {
        if (!Array.isArray(areas)) return;

        if (!(socket.id in sockets)) sockets[socket.id] = [];
        
        sockets[socket.id].push(...areas.filter(area => storage.hasArea(area)));

        socket.emit('areas', sockets[socket.id]);
    });

    socket.on('remove', areas => {
        if (!Array.isArray(areas)) return;

        if (!(socket.id in sockets)) return;

        areas.forEach(area => {
            const areaIndex = sockets[socket.id].indexOf(area);
            if (areaIndex > -1) sockets[socket.id].splice(areaIndex, 1);
        });

        socket.emit('areas', sockets[socket.id]);
    });

    socket.on('disconnect', () => {
        delete sockets[socket.id];
    });
});

server.listen(2020, () => console.log('Listening.'));