const Listing = require("../models/listing.js");
const mbxGeocoding=require('@mapbox/mapbox-sdk/services/geocoding')
const mapToken=process.env.MAP_TOKEN;
const geocodingClient=mbxGeocoding({accessToken:mapToken});

module.exports.index=async (req, res) => {
    const allListing = await Listing.find({});
    res.render("listings/index", { allListing });
};

module.exports.rendernewform=async (req, res) => {
    res.render("listings/new");
}

module.exports.show=async (req, res,next) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({path:"reviews",populate:{path:"author"},}).populate("owner");
    if(!listing){
        req.flash("error","Listing you requested for doesn't exist!");
        return res.redirect("/listing");
    }
    res.render("listings/show", { listing,mapToken:process.env.MAP_TOKEN });
};

module.exports.create=async (req, res,next) => {
        let response=await geocodingClient.forwardGeocode({
            query:req.body.listing.location,
            limit: 1,
        })
        .send();
    
    

        let url=req.file.path;
        let filename=req.file.filename;
        const listing = new Listing(req.body.listing);
        listing.owner=req.user._id;
        listing.image={url,filename};
        
        listing.geometry=response.body.features[0].geometry;
        
        let saveListing=await listing.save();
        console.log(saveListing)
        req.flash("success","new listing created");
        res.redirect("/listing");
    }


module.exports.edit=async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    if(!listing){
        req.flash("error","Listing doesn't exist");
        return res.redirect("/listing");
    }

    let originalImageUrl=listing.image.url;
    originalImageUrl=originalImageUrl.replace("/upload","/upload/h_300,w_250")
    res.render("listings/edit", { listing, originalImageUrl});
}

module.exports.update=async (req, res) => {
    let { id } = req.params;
    let listing=await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    
    if( typeof req.file !== "undefined"){
        let url=req.file.path;
        let filename=req.file.filename;
        listing.image={url,filename};
        await listing.save();
    }
    

    req.flash("success","Listing Updated");
    res.redirect(`/listing/${id}`);
};

module.exports.delete=async (req, res) => {
    let { id } = req.params;
    const deletelisting = await Listing.findByIdAndDelete(id);
    console.log(deletelisting);
    req.flash("success","Listing Deleted");
    res.redirect("/listing");
}

module.exports.search=async(req,res)=>{
    const { query }=req.query;

    const allListing=await Listing.find({
        $or: [
            {title: {$regex:query,$options:"i"}},
            {location: {$regex:query,$options:"i"}},
            {country: {$regex:query,$options:"i"}}
        ]
    });

    res.render("listings/index",{ allListing });
};