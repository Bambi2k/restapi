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

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "restapi",
});

app.get("/users", function (req, res) {
  decoded = verifyJWT(req.headers, "secret of secrets");
  if (decoded) {
    var sql = "SELECT id,name,username FROM users";
    con.query(sql, function (err, result, fields) {
      if (err) throw err;
      res.send(result);
    });
  } else {
    res.sendStatus(498);
  }
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
      delete req.body.password;
      res.send(req.body);
    });
  } else {
    res.sendStatus(422);
  }
});

/* app.put("/users/:id", function (req, res) {
  decoded = verifyJWT(req.headers, "secret of secrets");
  if (decoded) {
    if (
      req.body.username == undefined ||
      req.body.name == undefined ||
      req.body.password == undefined
    ) {
      console.log(
        "You need to change all variables (username,name,password) , if you wish to keep your old username/name/password write your old one."
      );
      res.sendStatus(400);
    } else {
      let sql = `UPDATE users
      SET username = '${req.body.username}', name = '${req.body.name}',
      password = '${hash(req.body.password)}' WHERE id = ${req.params.id}`;
      con.query(sql, function (err, result, fields) {
        if (err) throw err;
        //kod här för att hantera returnera data…
        var sql = "SELECT * FROM users WHERE id = " + req.params.id;
        con.query(sql, function (err, result, fields) {
          delete result[0].password;
          res.json(result);
        });
      });
    }
  } else {
    res.sendStatus(498);
  }
}); */

app.put("/users/:id", function (req, res) {
  //kod här för att hantera anrop…

  decoded = verifyJWT(req.headers, "secret of secrets");
  if (decoded) {
    if (
      req.body.username == undefined ||
      req.body.name == undefined ||
      req.body.password == undefined
    ) {
      console.log(
        "You need to change all variables (username,name,password) , if you wish to keep your old username/name/password write your old one."
      );
      res.sendStatus(400);
    } else {
      let sql = `UPDATE users
SET username = '${req.body.username}', name = '${
        req.body.name
      }' , password = '${hash(req.body.password)}'
      WHERE id = ${req.params.id}`;
      con.query(sql, function (err, result, fields) {
        if (err) throw err;
        //kod här för att hantera returnera data…
        var sql = "SELECT * FROM users WHERE id = " + req.params.id;
        con.query(sql, function (err, result, fields) {
          if (err) throw err;
          delete result[0].password;
          res.json(result);
        });
      });
    }
  } else {
    res.sendStatus(422);
  }
});

app.get("/users/:id", function (req, res) {
  decoded = verifyJWT(req.headers, "secret of secrets");
  if (decoded) {
    res.send("Token checks out!");
    var sql = "SELECT * FROM users WHERE id = " + req.params.id;
    con.query(sql, function (err, result, fields) {
      if (err) throw err;
      if (result.length === 0) {
        res.sendStatus(204);
      } else {
        console.log(result[0].password);
        delete result[0].password;
        res.json(result);
      }
    });
  } else {
    res.sendStatus(498);
  }
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
  decoded = verifyJWT(req.headers, "secret of secrets");
  if (decoded) {
    res.send("Token checks out!");
  } else {
    res.sendStatus(498);
  }
});

function verifyJWT(headers, secret) {
  let authHeader = headers["authorization"];
  if (authHeader === undefined) {
    return false;
  }
  let token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (err) {
    return false;
  }
}
