const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));



mongoose.connect("mongodb://0.0.0.0:27017/todolistDB");

const itemsSchema = new mongoose.Schema({
    name: String
});
const Item = mongoose.model("item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todoList!"
});
const item2 = new Item({
    name: "Hit the + button to add a new item."
});
const item3 = new Item({
    name: "<-- Hit this to delete an item."
});
const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
    name : String,
    items : [itemsSchema]
});
const List = mongoose.model("List", listSchema); 

app.get("/", function (req, res) {
    let today = new Date();
    let options = {
        weekday : "long",
        day : "numeric",
        month : "long"
    };
    let day = today.toLocaleDateString("en-US", options);

    Item.find().then(function (items) {

        if (items.length == 0) {
            Item.insertMany(defaultItems).then(function(){
                console.log("Data Inserted")        //success
            }).catch(function(err){                 //failure
                console.log(err)
            });
            res.redirect("/");
        }
        else{
            res.render("list", { ListTitle: day, newListItems: items });     //new concept
        }
    });
});

app.get("/:customListName",function(req,res){
   const customListName = _.capitalize(req.params.customListName);
   List.findOne({name:customListName}).then(function(foundList){
    if(!foundList){
        // console.log("Doesn't Exits");
        const list = new List({
            name : customListName,
            items : defaultItems 
        });
        list.save();
        res.redirect("/"+customListName);
    }
    else {
        // console.log("Exists!");
        res.render("list", {ListTitle:foundList.name,newListItems:foundList.items});
    }
   });
});

app.post("/", function (req, res) {
    let itemName = req.body.newItem;
    const listName = req.body.list;

    const newtask = new Item({
        name : itemName
    });
    
    let today = new Date();
    let options = {
        weekday : "long",
        day : "numeric",
        month : "long"
    };
    let day = today.toLocaleDateString("en-US", options);

    if(day == listName)          // if on the home route
    {
        newtask.save();           //mongoose shortcut
        res.redirect("/");
    }
    else
    {
        List.findOne({name:listName}).then(function(foundList){
            foundList.items.push(newtask);
            foundList.save();
            res.redirect("/"+listName);
        }).catch(function(err){
            console.log("UNSUCCESSFUL");
        });
    } 
});


app.post("/delete", function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    let today = new Date();
    let options = {
        weekday : "long",
        day : "numeric",
        month : "long"
    };
    let day = today.toLocaleDateString("en-US", options);

    if(day==listName)
    {
        Item.deleteOne({_id:checkedItemId}).then(function(){
            console.log("Deleted item with id :"+checkedItemId);
            res.redirect("/");
        });
    }
    else{
        List.findOneAndUpdate({name: listName}, {$pull : {items:{_id : checkedItemId}}}).then(function(foundList){
            console.log("Deleted an item!");
            res.redirect("/"+listName);
        });
    }

});


// app.get("/work", function (req, res) {
//     res.render("list", { ListTitle: "Work List", newListItems: workItems });
// });


app.listen(3000, function () {
    console.log("Server is started on port 3000");
});