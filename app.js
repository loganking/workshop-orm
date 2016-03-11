/**
 * A simple example of how to use Waterline v0.10 with Express
 */

var express = require('express'),
    _ = require('lodash'),
    app = express(),
    Waterline = require('waterline'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override');



// Instantiate a new instance of the ORM
var orm = new Waterline();


//////////////////////////////////////////////////////////////////
// WATERLINE CONFIG
//////////////////////////////////////////////////////////////////

// Require any waterline compatible adapters here
var diskAdapter = require('sails-disk'),
    postgresqlAdapter = require('sails-postgresql');


// Build A Config Object
var config = {

  // Setup Adapters
  // Creates named adapters that have been required
  adapters: {
    'default': diskAdapter,
    disk: diskAdapter,
    postgres: postgresqlAdapter
  },

  // Build Connections Config
  // Setup connections using the named adapter configs
  connections: {
    myLocalDisk: {
      adapter: 'disk'
    },

    myLocalPostgres: {
      adapter: 'postgres',
      host: 'localhost',
      database: 'waterline'
    }
  },

  defaults: {
    migrate: 'alter'
  }

};


//////////////////////////////////////////////////////////////////
// WATERLINE MODELS
//////////////////////////////////////////////////////////////////

var User = Waterline.Collection.extend({

  identity: 'user',
  connection: 'myLocalDisk',

  attributes: {
    first_name: 'string',
    last_name: 'string',

    pets: {
      collection: 'pet',
      via: 'owners',
      dominant: true
    }

  }

});

var Pet = Waterline.Collection.extend({

  identity: 'pet',
  connection: 'myLocalPostgres',

  attributes: {
    name: 'string',
    breed: 'string',

    owners: {
      collection: 'user',
      via: 'pets'
    }
  }

});


// Load the Models into the ORM
orm.loadCollection(User);
orm.loadCollection(Pet);



//////////////////////////////////////////////////////////////////
// EXPRESS SETUP
//////////////////////////////////////////////////////////////////


// Setup Express Application
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride());

// Build Express Routes (CRUD routes for /users)

app.get('/', function(req, res) {
  res.send('This app is just an api. Use postman to create, edit, and delete resources. Then view the JSON in the browser. See the route handlers in app.js to determine what you can do.');
});

app.get('/users', function(req, res) {
  app.models.user.find().populate('pets').exec(function(err, users) {
    if(err) return res.json({ err: err }, 500);
    res.json(users);
  });
});

app.post('/users', function(req, res) {
  app.models.user.create(req.body, function(err, user) {
    if(err) return res.json({ err: err }, 500);
    res.json(user);
  });
});

app.get('/users/:id', function(req, res) {
  app.models.user.findOne({ id: req.params.id }).populate('pets').exec(function(err, user) {
    if(err) return res.json({ err: err }, 500);
    res.json(user);
  });
});

app.delete('/users/:id', function(req, res) {
  app.models.user.destroy({ id: req.params.id }, function(err) {
    if(err) return res.json({ err: err }, 500);
    res.json({ status: 'ok' });
  });
});

app.put('/users/:id', function(req, res) {
  // Don't pass ID to update
  delete req.body.id;

  app.models.user.update({ id: req.params.id }, req.body, function(err, user) {
    if(err) return res.json({ err: err }, 500);
    res.json(user);
  });
});

// this route allows you to create pets for a specific user
app.post('/users/:id/pets', function(req, res) {
  app.models.user.findOne({ id: req.params.id }, function(err, user) {
    if(err) return res.json({ err: err }, 500);
    user.pets.add(req.body);
    user.save(function(err) {
      if(err) return res.json({ err: err }, 500);
      res.json(user);
    });
  });
});

// Build Express Routes (CRUD routes for /pets)

app.get('/pets', function(req, res) {
  app.models.pet.find().exec(function(err, pets) {
    if(err) return res.json({ err: err }, 500);
    res.json(pets);
  });
});

app.post('/pets', function(req, res) {
  app.models.pet.create(req.body, function(err, pet) {
    if(err) return res.json({ err: err }, 500);
    res.json(pet);
  });
});

app.get('/pets/:id', function(req, res) {
  app.models.pet.findOne({ id: req.params.id }, function(err, pet) {
    if(err) return res.json({ err: err }, 500);
    res.json(pet);
  });
});

app.delete('/pets/:id', function(req, res) {
  app.models.pet.destroy({ id: req.params.id }, function(err) {
    if(err) return res.json({ err: err }, 500);
    res.json({ status: 'ok' });
  });
});

app.put('/pets/:id', function(req, res) {
  // Don't pass ID to update
  delete req.body.id;

  app.models.pet.update({ id: req.params.id }, req.body, function(err, pet) {
    if(err) return res.json({ err: err }, 500);
    res.json(pet);
  });
});

// manually join existing pets
// this route won't work if you don't have two users (with ids 1 & 2) and two pets (with ids 1 & 2) in the system
app.get('/connect_pets', function(req, res) {
  app.models.user.findOne(1).exec(function(err, user){
    if(err) return res.json({ err: err }, 500);
    user.pets.add(1);
    user.pets.add(2);
    user.save(function(err) {
      if(err) return res.json({ err: err }, 500);
      app.models.user.findOne(2).exec(function(err, user){
        if(err) return res.json({ err: err }, 500);
        user.pets.add(2);
        user.save(function(err) {
          if(err) return res.json({ err: err }, 500);
          res.json({status:'success'}, 200);
        });
      });
    });
  });
});



//////////////////////////////////////////////////////////////////
// START WATERLINE
//////////////////////////////////////////////////////////////////

// Start Waterline passing adapters in
orm.initialize(config, function(err, models) {
  if(err) throw err;

  app.models = models.collections;
  app.connections = models.connections;

  // Start Server
  app.listen(3000);
  
  console.log("To see saved users, visit http://localhost:3000/users");
});

