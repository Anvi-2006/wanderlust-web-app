

if(process.env.NODE_ENV!= "production"){
  require("dotenv").config();  
}
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8","1.1.1.1"]);


console.log(process.env.SECRET);

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodoverride = require("method-override");
const ejsmate = require("ejs-mate");
const ExpressError=require("./utils/expresserror.js");
const session=require("express-session");
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");

const listing=require("./routes/listing.js");
const review=require("./routes/review.js");
const userRouter=require("./routes/user.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
// const dbUrl=process.env.ATLASDB_URL;

main().then(() => {
    console.log("connected to db");

    app.listen(8080,()=>{
        console.log("server iss listening to port 8080");
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
app.engine('ejs', ejsmate);
app.use(express.static(path.join(__dirname, "/public")));

const sessionoptions={
    secret:"mysupersecretcode",
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now() + 7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true,
    }
};

// app.get("/", (req, res) => {
//     res.send("hi i am 8080");
// });

app.use(session(sessionoptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    next();
});

// app.get("/demouser",async(req,res)=>{
//     let fakeUser=new User({
//         email:"student@gmail.com",
//         username:-"student",
//     });

//     let registerUser=await User.register(fakeUser,"helloworld!");
//     res.send(registerUser);
// })

app.use("/listing",listing)
app.use("/listing/:id/review",review);
app.use("/",userRouter);


app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"page not found!"));
});

app.use((err, req, res, next)=> {
    let {status=500,message="something went wrong"}=err;
    // res.render("error.ejs")
    res.status(status).render("error.ejs",{message});
});

// app.listen(8080, () => {
//     console.log("server is listning to 8080");
// });
