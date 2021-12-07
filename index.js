const express = require("express");
const app = express();
const Blockchain = require("./models/blockchain");
const Block = require("./models/block");

const blockchain = new Blockchain();
app.use((req, res, next) => {
  next();
});

app.use(express.json());

app.get("/list-countries", (req, res) => {
  const countriesList = blockchain.chain;
  res.json({ countries: countriesList });
});

app.post("/create-country", async (req, res) => {
  const { name, population, capital, continent, walletAddress } = req.body;
  const block = new Block(
    JSON.stringify({
      countryInfo: { name, population, capital, continent },
      walletAddress,
    })
  );
  await blockchain._addBlock(block);
  res.json({
    message: `Country with a name of ${name} has been added to the blockchain`,
  });
});

app.post("/find-country-by-wallet-address", async (req, res) => {
  const { walletAddress } = req.body;
  const countriesFound = await blockchain._findCountriesByAddress(
    walletAddress
  );
  res.json({ countries: countriesFound });
});

app.post("/find-country-by-name", async (req, res) => {
  const { name } = req.body;
  const countriesFound = await blockchain._findCountryByName(name);
  res.json({ countries: countriesFound });
});

app.post("/submit-country", async (req, res) => {
  const { address, privateKey, country } = req.body;
  await blockchain._submitCountry(address, privateKey, country);
  res.json({ success: true });
});

app.get("/validate-chain", async (req, res) => {
  const validationResult = await blockchain._validateChain();
  res.json({ validationResult });
});

app.listen(8008, () => console.log(`Listening on Port 8008`));
