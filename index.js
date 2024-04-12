const express = require("express");
// const detailedData = require("../data/GoalDetailsTestData.json");
const app = express();
const router = express.Router();
const { connect, model } = require("mongoose");
const serverless = require("serverless-http");
const bodyparser = require("body-parser");
const jsonParser = bodyparser.json(); //used for accessing body of the req in post request.
const uri =
  "mongodb+srv://SouravSinha:SouravSinha@atlascluster.hwl00ku.mongodb.net/Ambitions?retryWrites=true&w=majority&appName=AtlasCluster";

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

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  next();
});

app.get("/", (req, res) => {
  res.status(200).send("Hello world");
});

app.get("/ambitionsData", async (req, res) => {
  try {
    const resData = await User.find();
    res.status(200).json({ data: resData });
  } catch (error) {
    res.status(400).send("Error occured! " + error);
  }
});

app.post("/addAmbition", jsonParser, async (req, res) => {
  let data = await User.find({ goalType: req.body.goalType });
  data[0]?.values?.push(req.body);
  await User.findOneAndUpdate({ goalType: req.body.goalType }, data[0]);
  const newDetailData = new detailedDataDoc({
    ...req.body,
    Mutualfunds: [],
    Stocks: [],
  });
  await newDetailData.save();
  res.status(200).send(req.body);
});

app.post("/updateAmbition", jsonParser, async (req, res) => {
  const prevGoalType = req.body.prevGoalType;
  const currGoalType = req.body.goalType;

  if (prevGoalType === currGoalType) {
    const resData = await User.find({ goalType: prevGoalType });
    const values = resData && resData[0]?.values;

    values.find((ele) => {
      if (ele.goalId == req.body.goalId) {
        ele.cardHeading = req.body.cardHeading;
        ele.totalAmount = req.body.totalAmount;
        ele.maturityDate = req.body.maturityDate;
        return ele;
      }
    });
    await User.findOneAndUpdate({ goalType: prevGoalType }, { values: values });
  } 
  else {
    const response = await User.find({ goalType: currGoalType });
    const values = response[0]?.values;
    values.push({
      goalId: req.body.goalId,
      goalType: currGoalType,
      cardHeading: req.body.cardHeading,
      amount: req.body.amount,
      totalAmount: req.body.totalAmount,
      daystoGo: req.body.daystoGo,
      maturityDate: req.body.maturityDate,
    });
    await User.findOneAndUpdate({ goalType: currGoalType }, { values: values });

    const resp = await User.find({goalType: prevGoalType});
    updatedValues = resp[0].values.filter((ele) => ele.goalId !== req.body.goalId)
    await User.findOneAndUpdate({goalType: prevGoalType}, {values: updatedValues})
  }

  //To Update AmbitionDetailedData document.
  await detailedDataDoc.findOneAndUpdate(
    { goalId: req.body.goalId },
    {
      cardHeading: req.body.cardHeading,
      totalAmount: req.body.totalAmount,
      goalType: currGoalType,
      maturityDate: req.body.maturityDate,
    }
  );
  res.status(200).send({ message: "Updated Successfully!" });
});

app.delete("/deleteAmbition", jsonParser, async (req, res) => {
  const data = await User.find();
  let id, resData;
  data.map((ele) => {
    return ele.values.map((val, index) => {
      if (
        val.goalId == req.body.goalId &&
        val.cardHeading == req.body.cardHeading
      ) {
        id = ele._id.toString();
        ele.values.splice(index, 1);
        resData = ele;
      } else {
        return val;
      }
    });
  });
  try {
    await User.findByIdAndUpdate(id, resData);
    await detailedDataDoc.findOneAndDelete({ goalId: req.body.goalId });
    res.status(200).send({ message: "Deleted Successfully!" });
  } catch (error) {
    res.status(400).send(error);
  }
});

app.get("/ambitionsDetailedData", async (req, res) => {
  try {
    const data = await detailedDataDoc.find();
    res.status(200).json({ data: data });
  } catch (error) {
    res.status(400).send("Error occured!" + error);
  }
});

app.get("/insert", async (req, res) => {
  const val = {
    goalId: "304",
    cardHeading: "Mercedes G Wagon",
    amount: 0,
    totalAmount: 70000,
    daystoGo: 38,
    maturityDate: "May 03, 2026",
    goalType: "LifeStyle",
    Mutualfunds: [],
    Stocks: [],
  };
  const data = new detailedDataDoc(val);
  await data.save();
  res.status(200).send({ message: "Inserted Succesfully!" });
});


const PORT = process.env.port || 3000
app.listen(PORT, () => {
  console.log("Running on port" + PORT);
});

app.use("/.netlify/functions/index", router);
module.exports.handler = serverless(app);
