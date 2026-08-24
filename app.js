if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodoverride = require("method-override");
const ejsmate = require("ejs-mate");
const ExpressError = require("./utils/expresserror.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listing = require("./routes/listing.js");
const review = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const MONGO_URL = process.env.MONGO_URL;

main()
    .then(() => {
        console.log("connected to db");

        const PORT = process.env.PORT || 8080;

        app.listen(PORT, () => {
            console.log(`server is listening on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.log("database connection error");
        console.log(err);
    });

async function main() {
    await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodoverride("_method"));

app.engine("ejs", ejsmate);

app.use(express.static(path.join(__dirname, "/public")));

const sessionoptions = {
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.use(session(sessionoptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// ===============================
// ROUTES
// ===============================

// Listings
app.use("/listing", listing);

// Reviews
app.use("/listing/:id/review", review);

// Users / Login / Signup
app.use("/", userRouter);

// Homepage
app.get("/", (req, res) => {
    res.redirect("/listing");
});

// ===============================
// 404 ERROR HANDLER
// ===============================

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "page not found!"));
});

// ===============================
// ERROR HANDLER
// ===============================

app.use((err, req, res, next) => {
    console.error("========== ERROR ==========");
    console.error(err);
    console.error("===========================");

    let {
        status = 500,
        message = "something went wrong",
    } = err;

    res.status(status).render("error.ejs", { message });
});