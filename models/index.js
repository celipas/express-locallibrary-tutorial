var mongoose = require('mongoose');

var Book = require('./book');
var Author = require('./author');
var Genre = require('./genre');
var BookInstance = require('./bookinstance');
const url =
  'mongodb://chris123:chris123@cluster0-shard-00-00.2wpaq.mongodb.net:27017,cluster0-shard-00-01.2wpaq.mongodb.net:27017,cluster0-shard-00-02.2wpaq.mongodb.net:27017/local_library?ssl=true&replicaSet=atlas-su4ih8-shard-0&authSource=admin&retryWrites=true&w=majority';

const connectDb = () => {
  return mongoose.connect(
    url,
    { useUnifiedTopology: true }
  );
};

exports.connectDb = connectDb;
exports.models = { Book, Author, Genre, BookInstance };
