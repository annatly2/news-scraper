var express = require ("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

//scraping tools
var axios = require("axios");
var cheerio = require("cheerio");
var request = require ("request");

var db = require("./models");

var PORT = process.env.PORT || 3000;

var app = express();

app.use(logger("dev"));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static("public"));

mongoose.Promise = Promise;
mongoose.connect("mongodb://localhost/news", {
  useMongoClient: true
});

app.get("/scrape", function(req,res){

  axios.get("http://www.nytimes.com").then(
    function(response){
      var $ = cheerio.load(response.data);

      $(".theme-summary").each(function(i, element){
        var result = {};

        // console.log($(this).html());

        result.title = $(this)
        .children(".story-heading")
        .text();
        result.link = $(this)
        .children(".story-heading")
        .children("a")
        .attr("href");
        result.summary = $(this)
        .children(".summary")
        .text();
        // console.log(result);

        if(result.title && result.link && result.summary){
          db.Article
          .create(result)
          .then(function(dbArticle){

            // console.log(result);
            try {
              res.send("success!");
            } catch (error) {
              
            }
          })
          .catch(function(err){
            
            try {
              res.json(err);
            } catch (error) {
              
            }
          });
        }

      });
    });
});

app.get("/articles", function(req,res){

  db.Article
  .find({})
  .then(function(dbArticle){
    res.json(dbArticle);
  })
  .catch(function(err){
    res.json(err);
  });
});

app.get("/articles/:id", function(req,res){
  db.Article
    .findOne({_id: req.params.id})
    .populate("comment")
    .then(function(dbArticle){
      res.json(dbArticle);
    })
    .catch(function(err){
      res.json(err);
    });
});

app.post("/articles/:id", function(req,res){
  db.Comment
  .create(req.body)
  .then(function(dbComment){
    return db.Article.findOneAndUpdate({_id: req.params.id}, {comment: dbComment._id}, {new: true});
  })
  .then(function(dbArticle){
    res.json(dbArticle);
  })
  .catch(function(err){
    res.json(err);
  });
});

app.listen(PORT,function(){
  console.log("App running on port " + PORT);
});