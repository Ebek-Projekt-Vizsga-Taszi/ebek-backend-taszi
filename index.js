const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json())

app.use("/felhasznalok", require('./routes/userRoutes'));

app.listen(8000, () => {
    console.log("Fut a szerver")
});

app.get("/", (req, res) => {
    res.json({message: "Ebosszeiro projekt"});
});