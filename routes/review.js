const express=require("express");
const router=express.Router({mergeParams: true});
const wrapAsync=require("../utils/wrapasync.js");
const ExpressError=require("../utils/expresserror.js");
const Review=require("../models/review.js");
const Listing = require("../models/listing.js");
const {validateReview,isLoggedIn, isReviewAuthor}=require("../middleware.js");
const { postreview } = require("../controller/review.js");
const reviewcontroller=require("../controller/review.js");


// post review route
router.post("/",isLoggedIn,validateReview,wrapAsync(reviewcontroller.postreview));

// delete review route
router.delete("/:reviewId",isLoggedIn,isReviewAuthor,wrapAsync(reviewcontroller.delete));

module.exports=router;