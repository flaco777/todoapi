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

// GET /todos?completed=false&q=work
app.get('/todos', function(req, res) {
	var queryParams = req.query;
	var filteredTodos = todos;

	if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'true') {
		filteredTodos = _.where(filteredTodos, {
			completed: true
		});
	} else if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'false') {
		filteredTodos = _.where(filteredTodos, {
			completed: false
		});
	}

	if (queryParams.hasOwnProperty('q') && queryParams.q.length > 0) {
		filteredTodos = _.filter(filteredTodos, function(x) {
			return (x.description.toLowerCase().indexOf(queryParams.q.toLowerCase()) !== -1)
		});
		//res.json(_.indexOf(filteredTodos.description, queryParams.q) !== -1);
	}

	res.json(filteredTodos);
});

// GET /todos/:id
app.get('/todos/:id', function(req, res) {
	var todoID = parseInt(req.params.id, 10);
	var matchedTodo = _.findWhere(todos, {
		id: todoID
	});
	if (matchedTodo) {
		res.json(matchedTodo);
	} else {
		res.status(404).send();
	}
});


//POST /todos
app.post("/todos", function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');

	db.todo.create({
		body.completed
	}).then (function (todo) {
		res.status(200).send(toJSON(todo));
	}).catch (function (e){
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
	var matchedTodo = _.findWhere(todos, {
		id: todoID
	});

	if (!matchedTodo) {
		res.status(404).json({
			"error": "no todo found with that ID."
		})
	} else {
		todos = _.without(todos, matchedTodo)
		res.status(200).send("The following todo item has been deleted:\n" + JSON.stringify(matchedTodo));
	}
});

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

db.sequelize.sync().then(function() {
	app.listen(PORT, function() {
		console.log("Express listening on port " + PORT + "!");
	});
})