const { Card } = require("./cardModel");
const express = require("express");
const auth = require("../../middlewares/authorization");
const router = express.Router();
const chalk = require("chalk");
const res = require("express/lib/response");
const { generateBizNum } = require("./services/generateBizNum");
const { validateCard } = require("./cardValidation");

/********** סעיף 7 **********/
router.get("/allCards", async (req, res) => {
  try {
    const cards = await Card.find();
    console.log(cards);
    return res.send(cards);
  } catch (error) {
    console.log(chalk.redBright(error.message));
    return res.status(500).send(error.message);
  }
});

/********** סעיף 8 **********/
/********** params **********/
router.get("/card/:id", async (req, res) => {
  try {
    const cardID = req.params.id;
    const card = await Card.findOne({ _id: cardID });
    //const _id = req.params.id;
    //const card = await Card.findOne({ _id });
    return res.send(card);
  } catch (error) {
    console.log(chalk.redBright(error.message));
    return res.status(500).send(error.message);
  }
});

/********** סעיף 8 **********/
/********* qparams **********/
//http://localhost:8181/api/cards/card?id=12312323
router.get("/card", async (req, res) => {
  try {
    const cardID = req.query.id;
    const card = await Card.findOne({ _id: cardID });
    //const _id = req.params.id;
    //const card = await Card.findOne({ _id });
    return res.send(card);
  } catch (error) {
    console.log(chalk.redBright(error.message));
    return res.status(500).send(error.message);
  }
});

/********** סעיף 9 **********/
router.get("/my-cards", auth, (req, res) => {
  let user = req.user;
  if (!user.biz) return res.status(403).json("Un authorize user!");

  Card.find({ userID: user._id })
    .then((cards) => res.json(cards))
    .catch((error) => res.status(500).send(error.message));
});

/********** סעיף 10 **********/
router.post("/", auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user.biz) {
      console.log(
        chalk.redBright("A non biz user attempted to create a card!")
      );
      return res.status(403).json("Un authorize user!");
    }

    let card = req.body;
    const { error } = validateCard(card);
    if (error) {
      console.log(chalk.redBright(error.details[0].message));
      return res.status(400).send(error.details[0].message);
    }

    const bizNumber = await generateBizNum();

    card = {
      name: card.name,
      description: card.description,
      phone: card.phone,
      image: card.image
        ? card.image
        : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
      userID: user._id,
      bizNumber,
    };

    card = new Card(card);
    await card.save();
    return res.send(card);
  } catch (error) {
    console.log(chalk.redBright(error.message));
    return res.status(500).send(error.message);
  }
});
/********** edit card **********/
router.put("/:id", auth, async (req, res) => {
  try {
    let user = req.user;
    if (!user.biz) {
      console.log(
        chalk.redBright("A non-business user attempted to create a card!")
      );
      return res.status(403).json("You are not authorize to edit card!");
    }

    let card = req.body;
    const { error } = validateCard(card);
    if (error) {
      const errorMessage = error.details[0].message;
      console.log(errorMessage);
      return res.status(400).send(errorMessage);
    }

    const filter = {
      _id: req.params.id,
      userID: user._id,
    };

    card = await Card.findOneAndUpdate(filter, card);
    if (!card) {
      console.log(chalk.redBright("No card with this ID in the database!"));
      return res.status(404).send("No card with this ID in the database!");
    }
    card = await Card.findById(card._id);
    return res.send(card);
  } catch (error) {
    console.log(chalk.redBright(error.message));
    return res.status(500).send(error.message);
  }
});

/********** delete card **********/
router.delete("/:id", auth, async (req, res) => {
  try {
    let user = req.user;
    if (!user.biz) {
      console.log(
        chalk.redBright("A non-business user attempted to create a card!")
      );
      return res.status(403).json("You are not authorize to edit card!");
    }
    const cardID = req.params.id;
    let card = await Card.findById(cardID);

    if (!user.admin || card.userID === user._id) {
      card = await Card.findOneAndRemove({ _id: cardID });
      return res.send(card);
    }
    console.log(chalk.redBright("Un authorized user!"));
    return res.status(403).send("You are noe authorize to delete cards");
  } catch (error) {
    console.log(chalk.redBright("Could not delete card:", error.message));
    return res.status(500).send(error.message);
  }
});

//////////////
router.patch("/:id", auth, async (req, res) => {
  try {
    let user = req.user;
    if (!user.biz) {
      console.log(
        chalk.redBright("A non-business user attempted to create a card!")
      );
      return res.status(403).json("You are not authorize to edit card!");
    }

    let card = req.body;
    const { error } = validateCard(card);
    if (error) {
      const errorMessage = error.details[0].message;
      console.log(errorMessage);
      return res.status(400).send(errorMessage);
    }

    const filter = {
      _id: req.params.id,
      userID: user._id,
    };

    card = await Card.findOneAndUpdate(filter, card);
    if (!card) {
      console.log(chalk.redBright("No card with this ID in the database!"));
      return res.status(404).send("No card with this ID in the database!");
    }
    card = await Card.findById(card._id);
    return res.send(card);
  } catch (error) {
    console.log(chalk.redBright(error.message));
    return res.status(500).send(error.message);
  }
});

module.exports = router;
