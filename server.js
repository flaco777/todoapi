//cd c:\users\jared\dropbox (personal)\programming\_node\todo-api

var express = require('express');
var bodyParser = require("body-parser");
var _ = require("underscore");
var db = require('./db.js');
var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextID = 1;

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('Todo API Root');
});

// GET /todos?completed=T/F&q=term
app.get('/todos', function(req, res) {
	var query = req.query;
	var where = {};

	if (query.hasOwnProperty('completed') && query.completed === 'true') {
		where.completed = true;
	} else if (query.hasOwnProperty('completed') && query.completed === 'false') {
		where.completed = false;
	}

	if (query.hasOwnProperty('q') && query.q.length > 0) {
		where.description = {
			$like: '%' + query.q + '%'
		};
	}

	db.todo.findAll({
		where: where
	}).then(function(todos) {
		res.json(todos);
	}, function(e) {
		res.status(500).send();
	});
});

// GET /todos/:id
app.get('/todos/:id', function(req, res) {
	var todoID = parseInt(req.params.id, 10);

	db.todo.findById(todoID).then(function(todo) {
		if (!!todo) {
			res.json(todo.toJSON());
		} else {
			res.status(404).send();
		}
	}).catch(function(e) {
		res.status(500).send();
	})
});


//POST /todos
app.post("/todos", function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');

	db.todo.create(body).then(function(todo) {
		res.json(todo.toJSON());
	}).catch(function(e) {
		res.status(400).json(e);
	})
});


//DELETE /todos/:id
app.delete("/todos/:id", function(req, res) {
	var todoID = parseInt(req.params.id, 10);

	db.todo.destroy({
		where: {
			id: todoID
		}
	}).then(function(rowsDeleted) {
		if (rowsDeleted === 0) {
			res.status(404).json({
				"error": "No todo found with that ID."
			});
		} else {
			res.status(204).send();
		}
	}, function() {
		res.status(500).send();
	})
});

// My way, a little more verbose than instructor.

// 	db.todo.findById(todoID).then(function(todo) {
// 		if (!!todo) {
// 			deleted = db.todo.findById(todoID)
// 			todo.destroy({
// 				where: {
// 					id: todoID
// 				}
// 			}).then(function(deleted) {
// 				res.status(200).send('The following todo item has been deleted:\n' + JSON.stringify(deleted))
// 			})
// 		} else {
// 			res.status(404).json({
// 				"error": "no todo found with that ID."
// 			})
// 		}
// 	});
// });

//PUT /todos/:id
app.put("/todos/:id", function(req, res) {
	var todoID = parseInt(req.params.id, 10);
	var body = _.pick(req.body, 'description', 'completed');
	var attributes = {};

	if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
		attributes.completed = body.completed;
	}

	if (body.hasOwnProperty('description') && _.isString(body.description)) {
		attributes.description = body.description;
	}


	db.todo.findById(todoID).then(function(todo) {
		if (todo) {
			todo.update(attributes).then(function(todo) {
				res.json(todo.toJSON());
			}, function(e) {
				res.status(400).json(e);
			});
		} else {
			res.status(404).send();
		}
	}, function() {
		res.status(500).send();
	})
});

app.post('/users', function(req, res) {
	var body = _.pick(req.body, 'email', 'password');

	db.user.create(body).then(function(user) {
		res.json(user.toJSON());
	}, function(e) {
		res.status(400).json(e);
	})
});

//Sync all changes to DB
db.sequelize.sync().then(function() {
	app.listen(PORT, function() {
		console.log("Express listening on port " + PORT + "!");
	});
})