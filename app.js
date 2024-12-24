const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = 3000;

// Configure session
app.use(
  session({
    secret: "secureAppSecret",
    resave: false,
    saveUninitialized: true,
  })
);

// Middleware
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// Storage for files
const upload = multer({
  dest: path.join(__dirname, "public/uploads"),
});

// Session storage for products
let products = [];
let isAdminLoggedIn = false;

// Authentication Middleware
function requireAuth(req, res, next) {
  if (isAdminLoggedIn) {
    next();
  } else {
    res.redirect(
      `/login?error=${urlencodeURIComponent("please login to continue")}`
    );
  }
}

// Routes
app.get("/", (req, res) => {
  res.render("index", { products, isAdminLoggedIn });
});

app.get("/add", requireAuth, (req, res) => {
  res.render("addProduct");
});

app.post(
  "/add",
  requireAuth,
  upload.fields([{ name: "picture" }, { name: "brochure" }]),
  (req, res) => {
    const { name, price, availability } = req.body;
    const picture = req.files.picture ? req.files.picture[0].filename : null;
    const brochure = req.files.brochure ? req.files.brochure[0].filename : null;

    products.push({
      id: products.length + 1,
      name,
      price,
      availability,
      picture,
      brochure,
    });

    res.redirect("/");
  }
);

app.get("/edit/:id", requireAuth, (req, res) => {
  const product = products.find((p) => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).send("Product not found");
  res.render("editProduct", { product });
});

app.post(
  "/edit/:id",
  requireAuth,
  upload.fields([{ name: "picture" }, { name: "brochure" }]),
  (req, res) => {
    const { name, price, availability } = req.body;
    const product = products.find((p) => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).send("Product not found");

    product.name = name;
    product.price = price;
    product.availability = availability;
    product.picture = req.files.picture
      ? req.files.picture[0].filename
      : product.picture;
    product.brochure = req.files.brochure
      ? req.files.brochure[0].filename
      : product.brochure;

    res.redirect("/");
  }
);

app.post("/delete/:id", requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  products = products.filter((p) => p.id !== id);
  res.json({ success: true });
});

app.get("/login", (req, res) => {
  const error = req.query.error;
  res.render("login", { error });
});


app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "test" && password === "test") {
    isAdminLoggedIn = true;
    res.redirect("/");
  } else {
    res.redirect("/login?error=Invalid credentials");
  }
});

app.get("/logout", (req, res) => {
  isAdminLoggedIn = false;
  res.redirect("/");
});

// Start server
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
