const express = require('express')
// const detailedData = require("../data/GoalDetailsTestData.json");
const app = express();
const router = express.Router();

const { connect, model } =  require("mongoose");
const serverless = require('serverless-http')

const uri = "mongodb+srv://SouravSinha:SouravSinha@atlascluster.hwl00ku.mongodb.net/Ambitions?retryWrites=true&w=majority&appName=AtlasCluster";

connect(uri)
  .then(() => console.log("DB Connected"))
  .catch((error) => console.log("No Connection " + error));

// const schema = new mongoose.Schema({
//   goalTypeId: String,
//   goalType: String,
//   values: String
// });

// User model
const User = model("ambitionsdata", {
  goalTypeId: String,
  goalType: String,
  values: [
    {
      goalId: String,
      cardHeading: String,
      amount: Number,
      totalAmount: Number,
      daystoGo: Number,
      maturityDate: String,
    },
  ],
});

const detailedDataDoc = model("ambitionsdetaileddata", {
      goalId: String,
      cardHeading: String,
      amount: Number,
      totalAmount: Number,
      daystoGo: Number,
      maturityDate: String,
      goalType: String,
      Mutualfunds: [],
      Stocks: [],
});

router.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

router.get('/', (req, res) => {
  res.status(200).send("Hello world")
})

router.get("/ambitionsData", async (req, res) => {
  try {
    const resData = await User.find();
    console.log(resData);
    res.status(200).json({ data: resData });
  } catch (error) {
    res.status(400).send("Error occured! " + error);
  }
});


router.get("/ambitionsDetailedData", async (req, res) => {
  try {
    const data = await detailedDataDoc.find()
    console.log(data);
    res.status(200).json({data: data});
  } catch (error) {
    res.status(400).send("Error occured!" + error);
  }
});

router.get("/insert", async (req, res) => {
  const val = {
    "goalId": "304",
    "cardHeading": "Mercedes G Wagon",
    "amount": 0,
    "totalAmount": 70000,
    "daystoGo": 38,
    "maturityDate": "May 03, 2026",
    "goalType": "Gadgets",
    "Mutualfunds": [],
    "Stocks": []
  }
  const data = new detailedDataDoc(val);
  await data.save();
  res.status(200).send({ message: "Inserted Succesfully!" });
});

app.listen(3000, () => {
  console.log("Running on port 3000");
});


app.use('/.netlify/functions/index', router);
module.exports.handler = serverless(app)