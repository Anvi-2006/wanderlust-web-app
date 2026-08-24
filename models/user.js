const { string } = require("joi");
const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const possportLocalMongoose=require("passport-local-mongoose");
const { default: passportLocalMongoose } = require("passport-local-mongoose");

const userSchema=new Schema({
    email:{
        type:String,
        require:true,
    }
})

userSchema.plugin(passportLocalMongoose);

module.exports=mongoose.model("User",userSchema);