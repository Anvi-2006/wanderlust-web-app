const express=require("express");
const router=express.Router();
const wrapAsync=require("../utils/wrapasync.js");
const Listing = require("../models/listing.js");
const Review=require("../models/review.js");
const {isLoggedIn, isOwner, validatelisting} = require("../middleware.js");

const listingcontroller=require("../controller/listing.js");
const multer=require("multer");
const {storage}=require("../cloudConfig.js")
const upload=multer({storage})


router
    .route("/")
    .get(wrapAsync(listingcontroller.index))
    .post(isLoggedIn,upload.single('listing[image]'), validatelisting, wrapAsync (listingcontroller.create));
    

router.get("/search",wrapAsync(listingcontroller.search));

// new route
router.get("/new",isLoggedIn, wrapAsync(listingcontroller.rendernewform));



router
    .route("/:id")
    .get(wrapAsync(listingcontroller.show))
    .put(isLoggedIn,isOwner,upload.single("listing[image]"),validatelisting,wrapAsync(listingcontroller.update))
    .delete(isLoggedIn,isOwner, wrapAsync(listingcontroller.delete ));



// edit
router.get("/:id/edit",isLoggedIn,isOwner, wrapAsync(listingcontroller.edit ));

module.exports=router;