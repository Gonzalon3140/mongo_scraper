// Dependencies
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

// Port Setup
const PORT = process.env.PORT || 3000;

// Initialize Express
const app = express();

app.use(express.static("public"));

// Form Submit
app.use(bodyParser.urlencoded({
    extended: true
}));

// Handlebars
const exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({
    defaultLayout: "main"
}));
app.set("view engine", "handlebars");

// Controllers
const ApiRouter = require("./config/routes.js");
app.use(ApiRouter);
// Connect to the Mongo DB
const MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://localhost/mongoScraper";

mongoose.Promise = Promise;
mongoose.connect(
    MONGODB_URI, {
        useNewUrlParser: true
    }
);

// Server Start
app.listen(PORT, function () {
    console.log("This application is running on port: http://localhost:" + PORT);
});