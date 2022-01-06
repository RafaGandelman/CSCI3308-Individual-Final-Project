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

const dev_dbConfig = {
	host: 'db',
	port: 5432,
	database: process.env.POSTGRES_DB,
	user:  process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD
};

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

//app.listen(3000);
const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Express running → PORT ${server.address().port}`);
});