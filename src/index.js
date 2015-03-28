var fs = require('fs');
var collectors = require('./lib/collectors');
var generators = require('./lib/generators');
var exporters = require('./lib/exporters');
var stream = require('stream');
var combinedStream = require('combined-stream');
var Funil = require('funil');
var directories = require('./lib/directories');

module.exports = buster;

function buster(options) {

    var genStreams = [];

    var mainPathStream = generators.pathStream(options.list);
    mainPathStream.setMaxListeners(0);

    genStreams.push(mainPathStream);

    /// attach the collectors

    var collectorsFunil = new Funil();
    collectorsFunil.setMaxListeners(0);

    var tfactor;
    if (options.throttle) {
        tfactor = (options.throttle / options.methods.length) + 1;
    }

    options.methods.forEach(function(method) {
        switch (method) {
            case 'HEAD':
                var collectorHead = collectors.head(options.url,
                        tfactor,
                        options.extension);
                collectorHead.setMaxListeners(0);
                genStreams.forEach(function(genStream) {
                    genStream.pipe(collectorHead);
                });
                collectorsFunil.add(collectorHead);
                break;
            case 'GET':
                var collectorGet = collectors.get(options.url,
                        tfactor,
                        options.extension);
                collectorGet.setMaxListeners(0);
                genStreams.forEach(function(genStream) {
                    genStream.pipe(collectorGet);
                });
                collectorsFunil.add(collectorGet);
                break;
            case 'POST':
                var collectorPost = collectors.post(options.url,
                        tfactor,
                        options.extension);
                collectorPost.setMaxListeners(0);
                genStreams.forEach(function(genStream) {
                    genStream.pipe(collectorPost);
                });
                collectorsFunil.add(collectorPost);
                break;
            case 'PUT':
                var collectorPut = collectors.put(options.url,
                        tfactor,
                        options.extension);
                collectorPut.setMaxListeners(0);
                genStreams.forEach(function(genStream) {
                    genStream.pipe(collectorPut);
                });
                collectorsFunil.add(collectorPut);
                break;
            case 'DELETE':
                var collectorDel = collectors.del(options.url,
                        tfactor,
                        options.extension);
                collectorDel.setMaxListeners(0);
                genStreams.forEach(function(genStream) {
                    genStream.pipe(collectorDel);
                });
                collectorsFunil.add(collectorDel);
                break;
        }
    });

    /// pick here the right exportStream

    var exportStream;

    switch (options.export) {
        case 'txt':
            break;
        case 'xml':
            break;
        case 'csv':
            break;
        default:
            exportStream = exporters.toJSON;
            break;
    }

    exportStream.setMaxListeners(0);

    collectorsFunil
        //.pipe(process.stdout);
        .pipe(exportStream)
        .pipe(options.outStream);

    genStreams.forEach(function(s) {
        s.resume();
    });

}

/* options
 *
 * nRequests - number of requests in paralell
 * methods - array with selected methods ['HEAD','GET','POST','PUT','DELETE']
 * export - string with one of the following 'csv', 'json', 'txt', 'xml'
 * url - protocol+hostname (e.g http://daviddias.me)
 * list - path to the list that should be used, if none, then a fuzzer is used
 * out - path or writable stream of where the output should go
 */
