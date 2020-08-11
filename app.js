//jshint esversion : 6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
var username = config.username;
var pass = config.password;

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://" + username + ":" + pass + "@cluster0.codfr.mongodb.net/todolistDB", { useNewUrlParser: true });

const itemsSchema = {
    name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const todo1 = new Item({
    name: "Do work!",
});
const todo2 = new Item({
    name: "Do work2!",
});
const todo3 = new Item({
    name: "Do work3!",
});

const defaultArray = [todo1, todo2, todo3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

    Item.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultArray, function (err) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log("Successfully Added");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", { listTitle: "Today", newListItem: foundItems });
        }
    });

});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultArray
                });

                list.save();
                res.redirect("/" + customListName);
            } else {
                res.render("list", { listTitle: foundList.name, newListItem: foundList.items });
            }
        }
    });

});

app.post("/", function (req, res) {
    const item = new Item({
        name: req.body.addItem,
    });
    const listName = req.body.list;

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }


});

app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (err) {
                console.log(err);
            }
            else {
                console.log("Successfully Deleted");
            }
        });
        res.redirect("/");
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }

});


app.get("/about", function (req, res) {
    res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function () {
    console.log("Server has started successfully");
});