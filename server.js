var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/unit18Populater", {
    useNewUrlParser: true
});

// Routes

// A GET route for scraping the echoJS website
app.get("/scrape", function (req, res) {
    // First, we grab the body of the html with axios
    axios.get("https://www.nytimes.com/").then(function (response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);
        var articles = [];
        // Now, we grab every h2 within an article tag, and do the following:
        $("div.css-1100km").each(function (i, element) {
            var head = $(this)
                .find("h2")
                .text()
                .trim();


            // Grab the URL of the article
            var url = $(this)
                .find("a")
                .attr("href");


            // Then we grab any children with the class of summary and then grab it's inner text
            // We store this to the sum variable. This is the article summary
            var sum = $(this)
                .find("p")
                .text()
                .trim();


            // So long as our headline and sum and url aren't empty or undefined, do the following
            if (head && sum && url) {
                // This section uses regular expressions and the trim function to tidy our headlines and summaries
                // We're removing extra lines, extra spacing, extra tabs, etc.. to increase to typographical cleanliness.
                var headNeat = head.replace(/(\r\n|\n|\r|\t|\s+)/gm, " ").trim();
                var sumNeat = sum.replace(/(\r\n|\n|\r|\t|\s+)/gm, " ").trim();


                // Initialize an object we will push to the articles array


                var dataToAdd = {
                    headline: headNeat,
                    summary: sumNeat,
                    url: "https://www.nytimes.com" + url

                };


                articles.push(dataToAdd);
            }



        });
        console.log(articles);

        for (let i = 0; i < articles.length; i++) {

            db.Article.create(articles[i])

                .then(function (dbArticle) {
                    // View the added result in the console
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    // If an error occurred, log it
                    console.log(err);
                });
        }
        // Send a message to the client
        res.send("Scrape Complete");
    });
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
    console.log("articles hit")
    // Find all Notes
    db.Article.find({})
        .then(function (dbArticle) {
            console.log(dbArticle)
            // If all Notes are successfully found, send them back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurs, send the error back to the client
            res.json(err);
        });
    // TODO: Finish the route so it grabs all of the articles
});


// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {

    db.Article.findOne({
            _id: req.params.id
        })
        .populate('notes')
        .then(function (result) {
            res.json(result)
        })



    // TODO
    // ====
    // Finish the route so it finds one article using the req.params.id,
    // and run the populate method with "note",
    // then responds with the article with the note included
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {

    db.Note.create(req.body).then(
        function (note) {
            return db.Article.findOneAndUpdate({
                _id: req.params.id
            }, {
                note: note._id
            }, {
                new: true
            })
        }.then(function (something) {
            res.json(something)
        })
    );
    // TODO
    // ====
    // save the new note that gets posted to the Notes collection
    // then find an article from the req.params.id
    // and update it's "note" property with the _id of the new note
});

// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});