const express = require("express");
const router = express.Router();
const db = require("../models");
const request = require("request");
const cheerio = require("cheerio");

router.get("/", (req, res) => {
    request("https://www.nytimes.com/section/us", (error, response, body) => { // body is being scraped

        if (!error && response.statusCode === 200) {
            const $ = cheerio.load(body); // web scraping

            // loop every article and save it into our Article collection/table
            $("article").each(function (i, element) {

                let result = {};

                result.title = $(element)
                    .children("div")
                    .children("h2")
                    .children("a")
                    .text()
                    .trim();
                result.link =
                    "https://nytimes.com" +
                    $(element)
                    .children("div")
                    .children("h2")
                    .children("a")
                    .attr("href");
                result.summary = $(element)
                    .children("div")
                    .children("p")
                    .text()
                    .trim();
                console.log(result);
                if (result.title && result.link && result.summary) {
                    db.Article.create(result, function (err, data) {
                        if (err) return 'hey stop !!!';
                        // saved!
                    })
                }

            })

            // after looping we now respond with the whole article collection
            db.Article.find({}, function (err, data) {
                if (err) {
                    res.json(err)
                }
                res.render("index", {
                    scrapedItems: data
                })
            })

        } else if (error || response.statusCode != 200) {
            res.send("Error: Unable to obtain new articles");
        }

    })
    // you need render back to homepage
});

// router.get("/", (req, res) => {
//     db.Article.find({})
//         .then(function (dbArticle) {
//             const retrievedArticles = dbArticle;
//             let hbsObject;
//             hbsObject = {
//                 articles: dbArticle
//             };
//             res.render("index", hbsObject);
//         })
//         .catch(function (err) {
//             console.log(err);
//             res.json(err);
//         });
// });

router.get("/saved", (req, res) => {
    db.Article.find({
            isSaved: true
        })
        .then(function (retrievedArticles) {
            let hbsObject;
            hbsObject = {
                articles: retrievedArticles
            };
            res.render("saved", hbsObject);
        })
        .catch(function (err) {
            res.json(err);
        });
});

router.get("/articles", function (req, res) {
    db.Article.find({})
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

router.put("/save/:id", function (req, res) {
    db.Article.findOneAndUpdate({
            _id: req.params.id
        }, {
            isSaved: true
        })
        .then(function (data) {
            res.json(data);
        })
        .catch(function (err) {
            res.json(err);
        });
});

router.put("/remove/:id", function (req, res) {
    db.Article.findOneAndUpdate({
            _id: req.params.id
        }, {
            isSaved: false
        })
        .then(function (data) {
            res.json(data);
        })
        .catch(function (err) {});
});

router.get("/articles/:id", function (req, res) {
    db.Article.find({
            _id: req.params.id
        })

        .populate({
            path: "note",
            model: "Note"
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

router.post("/note/:id", function (req, res) {
    console.log(req.body);
    db.Note.create(req.body)
        .then(function (dbNote) {
            return db.Article.findOneAndUpdate({
                _id: req.params.id
            }, {
                $push: {
                    note: dbNote._id
                }
            }, {
                new: true
            }).populate("note");
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

router.delete("/note/:id", function (req, res) {
    db.Note.findByIdAndRemove({
            _id: req.params.id
        })
        .then(function (dbNote) {
            return db.Article.findOneAndUpdate({
                note: req.params.id
            }, {
                $pullAll: [{
                    note: req.params.id
                }]
            });
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

module.exports = router;