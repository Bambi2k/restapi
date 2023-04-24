let mysql = require("mysql");
const express = require("express");
const app = express();
const port = 3000;
const crypto = require("crypto"); //använder NodeJS inbyggda krypteringsfunktioner.
const jwt = require("jsonwebtoken");

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("<h1>inshallah välkommen till API (som är min)<h1>");
});

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "restapi",
});

app.get("/users", function (req, res) {
  //kod här för att hantera anrop…
  var sql = "SELECT * FROM users";
  con.query(sql, function (err, result, fields) {
    if (err) throw err;
    res.send(result);
  });
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});

app.post("/users", function (req, res) {
  const username = req.body.username;
  const name = req.body.name;
  const password = hash(req.body.password);
  if (req.body.name && req.body.username && req.body.password) {
    var sql = `INSERT INTO users (username, name, password) VALUES('${username}','${name}', '${password}')`;
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("1 record inserted");
      console.log(result);
      res.send(req.body);
    });
  } else {
    res.sendStatus(422);
  }
});

app.put("/users/:id", function (req, res) {
  //kod här för att hantera anrop…
  let sql = `UPDATE users 
  SET username = '${req.body.username}', name = '${req.body.name}')
  WHERE id = ${req.params.id}`;
  con.query(sql, function (err, result, fields) {
    if (err) throw err;
    res.json(result);
  });
});

app.get("/users/:id", function (req, res) {
  //kod här för att hantera anrop…
  var sql = "SELECT * FROM users WHERE id = " + req.params.id;
  con.query(sql, function (err, result, fields) {
    if (err) throw err;
    res.json(result);
  });
});

function hash(data) {
  const hash = crypto.createHash("sha256");
  hash.update(data);
  return hash.digest("hex");
}

app.post("/login", function (req, res) {
  let sql = `SELECT * FROM users WHERE username='${req.body.username}'`;
  con.query(sql, function (err, result, fields) {
    if (err) throw err;
    let passwordHash = hash(req.body.password);
    console.log(passwordHash);
    if (passwordHash === result[0].password) {
      let user = result[0];
      console.log(user);
      let payload = {
        sub: user.id, //sub är obligatorisk
        name: user.name, //Valbar
      };
      let token = jwt.sign(payload, "secret of secrets", { expiresIn: "2h" });
      res.send(token);
    } else {
      res.sendStatus(401);
    }
  });
});

app.get("/auth-test", function (req, res) {
  let authHeader = req.headers["authorization"];
  if (authHeader === undefined) {
    res.sendStatus(498);
  }
  let token = authHeader.slice(7); // tar bort "BEARER " från headern.
  console.log("Token present");
});
