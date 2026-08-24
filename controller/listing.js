const Listing = require("../models/listing.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");


// ===============================
// MAPBOX CONFIGURATION
// ===============================

const mapToken = process.env.MAP_TOKEN?.trim();

if (!mapToken) {
    console.error("ERROR: MAP_TOKEN is missing!");
}

const geocodingClient = mbxGeocoding({
    accessToken: mapToken
});


// ===============================
// INDEX - SHOW ALL LISTINGS
// ===============================

module.exports.index = async (req, res) => {
    const allListing = await Listing.find({});
    res.render("listings/index", { allListing });
};


// ===============================
// NEW - RENDER NEW LISTING FORM
// ===============================

module.exports.rendernewform = async (req, res) => {
    res.render("listings/new");
};


// ===============================
// SHOW - SHOW ONE LISTING
// ===============================

module.exports.show = async (req, res, next) => {
    try {
        const { id } = req.params;

        const listing = await Listing.findById(id)
            .populate({
                path: "reviews",
                populate: {
                    path: "author"
                }
            })
            .populate("owner");

        if (!listing) {
            req.flash(
                "error",
                "Listing you requested for doesn't exist!"
            );

            return res.redirect("/listing");
        }

        res.render("listings/show", {
            listing,
            mapToken: process.env.MAP_TOKEN?.trim()
        });

    } catch (err) {
        next(err);
    }
};


// ===============================
// CREATE - CREATE NEW LISTING
// ===============================

module.exports.create = async (req, res, next) => {

    try {

        console.log("===== CREATE LISTING STARTED =====");

        console.log("Request body:", req.body);
        console.log("Uploaded file:", req.file);


        // -------------------------------
        // CHECK IMAGE
        // -------------------------------

        if (!req.file) {

            console.log("ERROR: No image file received");

            req.flash(
                "error",
                "Please upload an image"
            );

            return res.redirect("/listing/new");
        }


        console.log("Image URL:", req.file.path);
        console.log("Image filename:", req.file.filename);


        // -------------------------------
        // CHECK LOCATION
        // -------------------------------

        if (
            !req.body.listing ||
            !req.body.listing.location
        ) {

            console.log("ERROR: Location is missing");

            req.flash(
                "error",
                "Please enter a location"
            );

            return res.redirect("/listing/new");
        }


        // -------------------------------
        // MAPBOX GEOCODING
        // -------------------------------

        console.log(
            "Geocoding location:",
            req.body.listing.location
        );

        const response = await geocodingClient
            .forwardGeocode({
                query: req.body.listing.location,
                limit: 1
            })
            .send();


        console.log("Mapbox response received");


        // -------------------------------
        // CHECK MAPBOX RESULT
        // -------------------------------

        if (
            !response.body.features ||
            response.body.features.length === 0
        ) {

            console.log(
                "ERROR: Mapbox could not find location"
            );

            req.flash(
                "error",
                "Location could not be found"
            );

            return res.redirect("/listing/new");
        }


        // -------------------------------
        // CREATE LISTING
        // -------------------------------

        const listing = new Listing(
            req.body.listing
        );


        // Set owner

        listing.owner = req.user._id;


        // Set Cloudinary image

        listing.image = {
            url: req.file.path,
            filename: req.file.filename
        };


        // Set Mapbox geometry

        listing.geometry =
            response.body.features[0].geometry;


        console.log("Saving listing...");


        // -------------------------------
        // SAVE LISTING TO DATABASE
        // -------------------------------

        const savedListing = await listing.save();


        console.log(
            "LISTING SAVED:",
            savedListing
        );


        req.flash(
            "success",
            "New listing created"
        );


        res.redirect("/listing");


    } catch (err) {

        console.log(
            "===== CREATE LISTING ERROR ====="
        );

        console.error(err);

        next(err);
    }
};


// ===============================
// EDIT - RENDER EDIT FORM
// ===============================

module.exports.edit = async (req, res, next) => {

    try {

        const { id } = req.params;

        const listing = await Listing.findById(id)
            .populate("reviews");


        if (!listing) {

            req.flash(
                "error",
                "Listing doesn't exist"
            );

            return res.redirect("/listing");
        }


        let originalImageUrl =
            listing.image.url;


        originalImageUrl =
            originalImageUrl.replace(
                "/upload",
                "/upload/h_300,w_250"
            );


        res.render(
            "listings/edit",
            {
                listing,
                originalImageUrl
            }
        );

    } catch (err) {

        next(err);
    }
};


// ===============================
// UPDATE - UPDATE LISTING
// ===============================

module.exports.update = async (req, res, next) => {

    try {

        const { id } = req.params;


        const listing =
            await Listing.findByIdAndUpdate(
                id,
                {
                    ...req.body.listing
                },
                {
                    new: true
                }
            );


        if (!listing) {

            req.flash(
                "error",
                "Listing doesn't exist"
            );

            return res.redirect("/listing");
        }


        // -------------------------------
        // UPDATE IMAGE IF NEW IMAGE EXISTS
        // -------------------------------

        if (typeof req.file !== "undefined") {

            const url = req.file.path;
            const filename = req.file.filename;


            listing.image = {
                url,
                filename
            };


            await listing.save();
        }


        req.flash(
            "success",
            "Listing Updated"
        );


        res.redirect(
            `/listing/${id}`
        );

    } catch (err) {

        next(err);
    }
};


// ===============================
// DELETE - DELETE LISTING
// ===============================

module.exports.delete = async (req, res, next) => {

    try {

        const { id } = req.params;


        const deletedListing =
            await Listing.findByIdAndDelete(id);


        console.log(
            "Deleted listing:",
            deletedListing
        );


        req.flash(
            "success",
            "Listing Deleted"
        );


        res.redirect("/listing");

    } catch (err) {

        next(err);
    }
};


// ===============================
// SEARCH - SEARCH LISTINGS
// ===============================

module.exports.search = async (req, res, next) => {

    try {

        const { query } = req.query;


        const allListing =
            await Listing.find({
                $or: [
                    {
                        title: {
                            $regex: query,
                            $options: "i"
                        }
                    },
                    {
                        location: {
                            $regex: query,
                            $options: "i"
                        }
                    },
                    {
                        country: {
                            $regex: query,
                            $options: "i"
                        }
                    }
                ]
            });


        res.render(
            "listings/index",
            {
                allListing
            }
        );

    } catch (err) {

        next(err);
    }
};