/***********************
  Load Components!

  Express      - A Node.js Framework
  Body-Parser  - A tool to help use parse the data in a post request
  Pg-Promise   - A database tool to help use connect to our PostgreSQL database
***********************/
var express = require('express'); //Ensure our express framework has been added
var app = express();
var bodyParser = require('body-parser'); //Ensure our body-parser tool has been added
app.use(bodyParser.json());              // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
const axios = require('axios');
const qs = require('query-string');

//Create Database Connection
var pgp = require('pg-promise')();

/**********************
  Database Connection information
  host: This defines the ip address of the server hosting our database.
		We'll be using `db` as this is the name of the postgres container in our
		docker-compose.yml file. Docker will translate this into the actual ip of the
		container for us (i.e. can't be access via the Internet).
  port: This defines what port we can expect to communicate to our database.  We'll use 5432 to talk with PostgreSQL
  database: This is the name of our specific database.  From our previous lab,
		we created the football_db database, which holds our football data tables
  user: This should be left as postgres, the default user account created when PostgreSQL was installed
  password: This the password for accessing the database. We set this in the
		docker-compose.yml for now, usually that'd be in a seperate file so you're not pushing your credentials to GitHub :).
**********************/
const dev_dbConfig = {
	host: 'db',
	port: 5432,
	database: process.env.POSTGRES_DB,
	user:  process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD
};

/** If we're running in production mode (on heroku), the we use DATABASE_URL
 * to connect to Heroku Postgres.
 */
const isProduction = process.env.NODE_ENV === 'production';
const dbConfig = isProduction ? process.env.DATABASE_URL : dev_dbConfig;

// Heroku Postgres patch for v10
// fixes: https://github.com/vitaly-t/pg-promise/issues/711
if (isProduction) {
  pgp.pg.defaults.ssl = {rejectUnauthorized: false};
}

const db = pgp(dbConfig);

// set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/'));//This line is necessary for us to use relative paths and access our resources directory

// login page
app.get('/', function(req, res) {
	res.render('pages/main',{
		my_title: "Main Page",
		artist: '',
		error: false,
		search:false,
		imageLink:'',
		bandName:'-',
		link:'#',
		year:'-',
		genre: '-',
		bio:'',
	});
});

app.get('/main', function(req,res){
	res.render('pages/main',{
		my_title:"Main Page",
		artist: '',
		error: false,
		search:false,
		imageLink:'',
		bandName:'-',
		link:'#',
		year:'-',
		genre:'-',
		bio:'',
	});
});

app.get('/reviews', function(req,res){
	var call = `SELECT * FROM reviews;`;
	db.task('get-everything', task=>{
		return task.batch([
			task.any(call)
		]);
	}).then(info => {
		res.render('pages/reviews',{
			my_title:"Reviews Page",
			data:info[0]
		})
	}).catch(error=>{
		request.flash('error', err);
		res.render('pages/reviews',{
			my_title:"Reviews Page",
			data:''
		})
	});
});

app.post('/displayReview',function(req,res){
	var name = req.body.name;
		var call = `SELECT * FROM reviews WHERE artist='${name}';`;
		db.task('get-everything', task=>{
			return task.batch([
				task.any(call)
			]);
		}).then(info =>{
			if(!info[0].length){
				var call = `SELECT * FROM reviews;`;
				db.task('get-everything', task=>{
					return task.batch([
						task.any(call)
					]);
				}).then(log => {
					res.render('pages/reviews',{
						my_title:"Reviews Page",
						data:log[0]
					})
				}).catch(error=>{
					request.flash('error', err);
					res.render('pages/reviews',{
						my_title:"Reviews Page",
						data:''
					})
				});
			}
			else{
				res.render('pages/reviews',{
					my_title:"reviews Page",
					data: info[0]
				})
			}
		}).catch(error=>{
			request.flash('error',err);
			res.render('pages/reviews',{
				my_title:"reviews Page",
				data: ''
			})
		});
});

app.post('/search',function(req,res){
	var artist = req.body.artist;
	/* res.render('pages/main',{
		my_title: "Main Page",
		error: false,
		search:true,
		imageLink:'-',
		bandName:req.body.artist,
		link:'',
		year:'-',
		genre:["Test","Indie","Good"],
		bio:'-',
	}); */
	if(artist){
		axios({
			url: `https://theaudiodb.com/api/v1/json/2/search.php?s=${artist}`,
			  method: 'GET',
			  dataType:'json',
			})
			.then(items =>{
				res.render('pages/main',{
					my_title:"Main Page",
					error:false,
					search:true,
					imageLink: items.data.artists[0].strArtistBanner,
					bandName: items.data.artists[0].strArtist,
					link: "https://"+items.data.artists[0].strWebsite,
					year: items.data.artists[0].intFormedYear,
					genre: items.data.artists[0].strGenre,
					bio: items.data.artists[0].strBiographyEN
				})
			})
			.catch(error =>{
				console.log(error);
				res.render('pages/main',{
					my_title:"Main Page",
					error:true,
					search:true,
					imageLink:'-',
					bandName: '-',
					link:'',
					year:'-',
					genre:'-',
					bio:'-',
				})
			});
	}
	else{
		res.render('pages/main',{
			my_title:"Main Page",
			error:true,
			search:true,
			imageLink:'-',
			bandName: '-',
			link:'',
			year:'-',
			genre:'-',
			bio:'-',
		});
	}
});

app.post('/addReview',function(req,res){
	var name = req.body.band;
	var review = req.body.addReview;
	var date = new Date().toISOString();
	date=date[0]+date[1]+date[2]+date[3]+date[5]+date[6]+date[8]+date[9];
	var insert = `INSERT INTO reviews(artist,review,review_date) VALUES('${name}','${review}','${date}');`;
	var call = `SELECT * FROM reviews;`;
	db.task('get-everything', task=>{
		return task.batch([
			task.any(insert),
			task.any(call)
		]);
	}).then(info => {
		res.render('pages/reviews',{
			my_title:"Reviews Page",
			data:info[1]
		})
	}).catch(error=>{
		request.flash('error', err);
		res.render('pages/reviews',{
			my_title:"Reviews Page",
			data:''
		})
	});
});

/*
var insert = `INSERT INTO reviews(artist,review,review_date) VALUES(${name},${review},${date});`;
	var call = `SELECT * FROM reviews;`;
	db.task('get-everything', task=>{
		return task.batch([
			task.any(insert),
			task.any(call)
		]);
	}).then(info => {
		res.render('pages/reviews',{
			my_title:"Reviews Page",
			data:info[0]
		})
	}).catch(error=>{
		request.flash('error', err);
		res.render('pages/reviews',{
			my_title:"Reviews Page",
			data:''
		})
	});
*/

/*
// registration page
app.get('/register', function(req, res) {
	res.render('pages/register',{
		my_title:"Registration Page"
	});
});
*/
/*Add your other get/post request handlers below here: */
/*
app.get('/home', function(req, res) {
	var query = 'select * from favorite_colors;';
	db.any(query)
		.then(function (rows) {
			res.render('pages/home',{
				my_title: "Home Page",
				data: rows,
				color: '',
				color_msg: ''
			})

		})
		.catch(function (err) {
			// display error message in case an error
			request.flash('error', err);
			response.render('pages/home', {
				title: 'Home Page',
				data: '',
				color: '',
				color_msg: ''
			})
		})
});

app.get('/home/pick_color', function(req, res) {
	var color_choice = req.query.color_selection;
	var color_options =  'select * from favorite_colors;';
	var color_message = "select color_msg from favorite_colors where hex_value = '" + color_choice + "';";
	db.task('get-everything', task => {
		return task.batch([
			task.any(color_options),
			task.any(color_message)
		]);
	})
		.then(info => {
			res.render('pages/home',{
				my_title: "Home Page",
				data: info[0],
				color: color_choice,
				color_msg: info[1][0].color_msg
			})
		})
		.catch(error => {
			// display error message in case an error
			request.flash('error', err);
			response.render('pages/home', {
				title: 'Home Page',
				data: '',
				color: '',
				color_msg: ''
			})
		});

});


app.post('/home/pick_color', function(req, res) {
	var color_hex = req.body.color_hex;
	var color_name = req.body.color_name;
	var color_message = req.body.color_message;
	var insert_statement = "INSERT INTO favorite_colors(hex_value, name, color_msg) VALUES('" + color_hex + "','" +
		color_name + "','" + color_message +"') ON CONFLICT DO NOTHING;";

	var color_select = 'select * from favorite_colors;';
	db.task('get-everything', task => {
				return task.batch([
					task.any(insert_statement),
					task.any(color_select)
				]);
			})
		.then(info => {
			res.render('pages/home',{
				my_title: "Home Page",
				data: info[1],
				color: color_hex,
				color_msg: color_message
			})
		})
		.catch(error => {
			// display error message in case an error
			request.flash('error', err);
			response.render('pages/home', {
				title: 'Home Page',
				data: '',
				color: '',
				color_msg: ''
			})
		});
});



app.post('/player_info/add_player',function(req,res){
	// {
	// 	player_name:"Text Value",
	// 	player_year: "Year",
	// 	player_major: "major",
	// 	player_passing_yards : 10,
	// 	player_rushing_yards : 10,
	//  player_receiving_yards : 10
	// }
	var name = req.body.player_name;
	var year = req.body.player_year;
	var major = req.body.player_major;
	var passing_yards = req.body.player_passing_yards;
	var rushing_yards = req.body.player_rushing_yards;
	var receiving_yards = req.body.player_receiving_yards;


	var insert_statement = "INSERT INTO football_players(name, year, major, passing_yards, rushing_yards, receiving_yards) VALUES('" + name + "','" +
	year + "','" + major + "','" + passing_yards+ "','" + rushing_yards + "','"+ receiving_yards + "') ON CONFLICT DO NOTHING;";

	var players = 'select * from football_players;';

	db.task('post-data', task => {
        return task.batch([
            task.any(insert_statement),
						task.any(players)
        ]);
    })
	.then(data => {
		res.render('pages/player_info',{
			my_title:"Player Info",
			players: data[1],
			playerinfo: '',
			games: ''
		})
	})
	.catch(err => {
		console.log('Uh Oh I made an oopsie');
		req.flash('error', err);
		res.render('pages/player_info',{
			my_title: "Player Info",
			players: '',
			playerinfo: '',
			games: ''
		})
	});

});

app.post('/player_info/add_game',function(req,res){
	// {
	// 	visitor_name:"Text Value",
	// 	home_score: 45,
	// 	visitor_score: 13,
	// 	game_date : "2020-06-04",
	// 	players : {1,4,5,7}
	// }
	var visitor_name = req.body.visitor_name;
	var home_score = req.body.home_score;
	var visitor_score = req.body.visitor_score;
	var game_date = req.body.game_date;
	var players = req.body.players;

	var insert_statement = "INSERT INTO football_games(visitor_name, home_score, visitor_score, game_date, players) VALUES('" + visitor_name + "','" +
	home_score + "','" + visitor_score + "','" + game_date+ "','" + players + "') ON CONFLICT DO NOTHING;";

	var players = 'select * from football_players;';

	db.task('post-game-data', task => {
        return task.batch([
            task.any(insert_statement),
						task.any(players)
        ]);
    })
	.then(data => {
		res.render('pages/player_info',{
			my_title:"Player Info",
			players: data[1],
			playerinfo: '',
			games: ''
		})
	})
	.catch(err => {
		console.log('Uh Oh I made an oopsie');
		req.flash('error', err);
		res.render('pages/player_info',{
			my_title: "Player Info",
			players: '',
			playerinfo: '',
			games: ''
		})
	});

});
/*
    /player_info/select_player - get request (player_id)
    This route will handle three queries and a work with a single parameter.
  Parameter:
    player_id - this will be a single number that refers to the football player's id.
  Queries:
    1. Retrieve the user id's & names of the football players (just like in /player_info)
    2. Retrieve the specific football player's informatioin from the football_players table
    3. Retrieve the total number of football games the player has played
*/
// player_info page 
/*
app.get('/player_info', function(req,res){
    var players = 'select * from football_players;';
    db.task('get-everything', task => {
        return task.batch([
            task.any(players)
        ]);
    })
        .then(data => {
            res.render('pages/player_info',{
                my_title:"Player Info",
                players: data[0],
                playerinfo: '',
                games: ''
            })
        })
        .catch(err => {
            console.log('Uh Oh I made an oopsie');
            req.flash('error', err);
            res.render('pages/player_info',{
                my_title: "Player Info",
                players: '',
                playerinfo: '',
                games: ''
            })
        });
});

app.get('/player_info/player', function(req,res){
    var players = 'select * from football_players;';
    var player_choice = req.query.player_choice;
    var games = 'select * from football_games where ' + player_choice + ' = any(players);';
    var player = "select * from football_players where id = '" + player_choice + "';";
    db.task('get-everything', task => {
        return task.batch([
            task.any(players),
            task.any(player),
            task.any(games)
        ]);
    })
        .then(data => {
            res.render('pages/player_info',{
                my_title:"Player Info",
                playerinfo: data[1][0],
                players: data[0],
                games: data[2]
            })
        })
        .catch(err => {
            console.log('Uh Oh spaghettio');
            req.flash('error', err);
            res.render('pages/player_info',{
                my_title: "Player Info",
                playerinfo: '',
                players: '',
                games: ''
            })
        });
});


app.get('/team_stats', function(req, res) {
    var footballGames = 'select * from football_games;';
    var Winning = 'select COUNT(*) from football_games where home_score > visitor_score;';
    var Loosing = 'select COUNT(*) from football_games where home_score < visitor_score;';
    db.task('get-everything', task => {
        return task.batch([
            task.any(footballGames),
            task.any(Winning),
            task.any(Loosing)
        ]);
    })
        .then(info => {

            for(var i=0; i<info[0].length; i++){
                if (info[0][i].home_score >  info[0][i].visitor_score) {
                    info[0][i]["winner"] = "CU_Boulder"
                }
                else {
                    info[0][i]["winner"] = info[0][i].visitor_name
                }
            }
            res.render('pages/team_stats',{
                my_title: "Team Stats",
                result: info[0],
                result_2: info[1],
                result_3: info[2]
            })
        })
        .catch(error => {
            req.flash('error', error);
            res.render('pages/team_stats', {
                my_title: 'Team Stats',
                result: '',
                result_2: '',
                result_3: ''
            })
        });

});

*/

//app.listen(3000);
const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Express running → PORT ${server.address().port}`);
});