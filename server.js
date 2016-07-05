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
	res.send('Hi babe, welcome to my webpage');
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


	// if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0) {
	// 	return res.status(400).send();
	// }

	// body.description = body.description.trim();
	// // set body.description to the trimmed value


	// body.id = todoNextID++;
	// todos.push(body);
	// res.json(todos);
});


//DELETE /todos/:id
app.delete("/todos/:id", function(req, res) {
	var todoID = parseInt(req.params.id, 10);

	db.todo.findById(todoID).then(function(todo) {
		if (!!todo) {
			deleted = db.todo.findById(todoID)
			todo.destroy({
				where: {
					id: todoID
				}
			}).then(function(deleted) {
				res.status(200).send('The following todo item has been deleted:\n' + JSON.stringify(deleted))
			})
		} else {
			res.status(404).json({
				"error": "no todo found with that ID."
			})
		}
	});
});



// var matchedTodo = _.findWhere(todos, {
// 	id: todoID
// });

// if (!matchedTodo) {
// 	res.status(404).json({
// 		"error": "no todo found with that ID."
// 	})
// } else {
// 	todos = _.without(todos, matchedTodo)
// 	res.status(200).send("The following todo item has been deleted:\n" + JSON.stringify(matchedTodo));
// }


//PUT /todos/:id
app.put("/todos/:id", function(req, res) {
	var todoID = parseInt(req.params.id, 10);
	var matchedTodo = _.findWhere(todos, {
		id: todoID
	});
	var body = _.pick(req.body, 'description', 'completed');
	var validAttributes = {};

	if (!matchedTodo) {
		return res.status(404).send();
	}

	if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
		validAttributes.completed = body.completed;
	} else if (body.hasOwnProperty("completed")) {
		return res.status(400).send();
	}

	if (body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0) {
		validAttributes.description = body.description;
	} else if (body.hasOwnProperty("description")) {
		return res.status(400).send();
	}

	// HERE
	_.extend(matchedTodo, validAttributes);
	res.json(matchedTodo);

});

//Sync all changes to DB
db.sequelize.sync().then(function() {
	app.listen(PORT, function() {
		console.log("Express listening on port " + PORT + "!");
	});
})