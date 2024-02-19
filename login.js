const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const secretKey = "yourSecretKey";
const Schema = mongoose.Schema;
const { Timestamp } = require('mongodb');
const { ObjectId } = require('mongodb');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;
const uri = "mongodb+srv://avinash:avinash@cluster0.rlhitli.mongodb.net/";
app.use(bodyParser.json());
 

//----------------- Connect to MongoDB Atlas--------------------
mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "registration_db", // Specify the database name
  })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("Error connecting to MongoDB Atlas:", err));
 
  

//------------------- All schemas ------------------------------

// Define Trainer schema
const trainerSchema = new mongoose.Schema({
  username: { type: String, required: true,unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true,unique: true },
  contactNumber: { type: String, required: true },
  skills: { type: String, required: true },
  city: { type: String, required: true },
  chargePerDay: { type: String, required: true },
  trainerType: { type: String, default: "full-time" },
  openToTravel: { type: String ,default:"Yes"},
  deliveryMode: { type: String,default: "Offline"},
  clients: { type: String,default: "" },
  Resume: { type: String,default: "" },
  linkedInUrl: { type: String,default: "" },
  role: { type: String, default: "trainer" },
});
 


// Define Company schema
const companySchema = new mongoose.Schema({
  uniqueId: { type: String, required: true },
  companyName: { type: String, required: true },
  location: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  domain: { type: String, required: true },
  role: { type: String, default: "company" },
});
 

// Business Request schema
const businessRequestSchema = new mongoose.Schema({
  uniqueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company", // Reference to the 'Company' collection
    required: true,
  },
  batchName: { type: String, required: true },
  technology: { type: String, required: true },
  numberOfTrainees: { type: Number, required: true },
  durationOfTraining: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  trainingBudget: { type: Number, required: true },
});


//Purchase Order Schema
const purchaseOrdersSchema = new mongoose.Schema({
  businessRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company", // Assuming the reference is to the Company collection
    required: true,
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Trainer",
    required: true,
  },
  trainerEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: Boolean, required: true },
  endDate: { type: Date, required: true },
  startDate: { type: Date, required: true },
});

const businessInvoiceSchema = new mongoose.Schema({
  poId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PurchaseOrder",
    required: true,
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  companyName: { type: String, required: true },
  amount: { type: Number, required: true },
  batches: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  technologies: { type: String, required: true },
  paymentStatus: { type: Boolean, required: true, default: false },
  businessEmail: { type: String, required: true },
});

const trainerInvoiceSchema = new mongoose.Schema({
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Trainer",
    required: true,
  },
  poId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PurchaseOrder",
    required: true,
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  amount: { type: String, required: true },
  contactNumber: { type: String, required: true },
  raiseStatus: { type: Boolean, required: true, default: true },
  paymentStatus: { type: Boolean, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
});


// Define the feedback schema
const feedbackSchema = new mongoose.Schema({
  company_id: String,
  trainer_name: String,
  trainer_id: String,
  stars: Number,
  feedback_description: String,
});


//current training schema
const invoiceSchema = new mongoose.Schema({
  poId: String,
  businessId: String,
  companyName: String,
  amount: Number,
  batches: String,
  startDate: Date,
  endDate: Date,
  technologies: String,
  paymentStatus: Boolean,
  businessEmail: String,
});
 


// Create the model
const Trainer = mongoose.model("Trainer", trainerSchema);
const Company = mongoose.model("Company", companySchema);
const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrdersSchema);
const TrainerInvoice = mongoose.model("TrainerInvoice", trainerInvoiceSchema);
const BusinessRequest = mongoose.model('BusinessRequest', businessRequestSchema);
const Feedback = mongoose.model("Feedback", feedbackSchema);
const BusinessInvoice = mongoose.model("BusinessInvoice", businessInvoiceSchema); 
const Invoice = mongoose.model('businessinvoices', invoiceSchema);  
 

app.use(cors());
app.use(express.json());

// JWT Authentication 
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
 
  if (authHeader) {
    const token = authHeader.split(" ")[1]; // Bearer <token>
 
    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        console.error("JWT Verification Error:", err); // Log verification errors
        return res.sendStatus(403); // Forbidden
      }
 
      console.log("Decoded Token:", user); // Log decoded user information
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401); // Unauthorized
  }
};
 
const authorizeRole = (roles) => (req, res, next) => {
  if (roles.includes(req.user.role)) {
    next();
  } else {
    res.sendStatus(403); // Forbidden
  }
};
 

// --------------------- Trainers ------------------------------------------

// Trainer registration endpoint
app.post("/trainers", async (req, res) => {
  try {
    const {
      username,
      password,
      name,
      email,
      contactNumber,
      skills,
      city,
      chargePerDay,
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newTrainer = new Trainer({
      username,
      password: hashedPassword,
      name,
      email,
      contactNumber,
      skills,
      city,
      chargePerDay,
    });

    await newTrainer.save();
    res.status(201).json({ message: "Trainer registered successfully" });
  } catch (error) {
    console.error("Error registering trainer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Find trainer by username endpoint
app.get("/trainers/:email", async (req, res) => {
  const { email } = req.params;
  // console.log(username)
  try {
    // Find the trainer by username
    const trainer = await Trainer.findOne({ email });
    if (!trainer) {
      return res.status(404).json({ message: "Trainer not found" });
    }

    res.status(200).json(trainer);
  } catch (error) {
    console.error("Error finding trainer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Update trainer by username endpoint
app.put("/trainers/:email", async (req, res) => {
  const { email: updatedEmail } = req.params; // Rename 'email' to 'updatedEmail'

  try {
    // Find the trainer by email
    let trainer = await Trainer.findOne({ email: updatedEmail });
    if (!trainer) {
      return res.status(404).json({ message: "Trainer not found" });
    }

    // Update trainer fields
    const {
      password,
      name,
      email,
      contactNumber,
      skills,
      city,
      chargePerDay,
      trainerType,
      openToTravel,
      deliveryMode,
      clients,
      Resume,
      linkedInUrl
    } = req.body;

    if (password) {
      trainer.password = password;
    }
    if (name) {
      trainer.name = name;
    }
    if (email) {
      trainer.email = email;
    }
    if (contactNumber) {
      trainer.contactNumber = contactNumber;
    }
    if (skills) {
      trainer.skills = skills;
    }
    if (city) {
      trainer.city = city;
    }
    if (chargePerDay) {
      trainer.chargePerDay = chargePerDay;
    }
    if (trainerType !== undefined) {
      trainer.trainerType = trainerType;
    }
    if (openToTravel !== undefined) {
      trainer.openToTravel = openToTravel;
    }
    if (deliveryMode !== undefined) {
      trainer.deliveryMode = deliveryMode;
    }
    if (clients) {
      trainer.clients = clients;
    }
    if (Resume) {
      trainer.Resume = Resume;
    }
    if (linkedInUrl) {
      trainer.linkedInUrl = linkedInUrl;
    }

    // Save the updated trainer
    trainer = await trainer.save();

    res.status(200).json({ message: "Trainer updated successfully", trainer });
  } catch (error) {
    console.error("Error updating trainer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

 
//get all the details of PO for a particular trainer id
app.get('/purchase-orders/:email', async (req, res) => {
  const { email } = req.params;
 
  try {
    const purchaseOrders = await PurchaseOrder.find({ trainerEmail: email });
    res.json(purchaseOrders);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
 
// fetched trainer accepted tarinings i.e feching my training for particular trainer
app.get('/training-orders/:email', async (req, res) => {
  const { email } = req.params;
 
  try {
    const purchaseOrders = await PurchaseOrder.find({ trainerEmail: email, status: true });
    res.json(purchaseOrders);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
 
// PUT route to accept a purchase order
app.put('/purchase-orders/:id/accept', async (req, res) => {
  const { id } = req.params;
 
  try {
    const updatedOrder = await PurchaseOrder.findByIdAndUpdate(id, { status: true }, { new: true });
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
 
// PUT route to reject a purchase order
app.put('/purchase-orders/:id/reject', async (req, res) => {
  const { id } = req.params;
 
  try {
    const deletedOrder = await PurchaseOrder.findByIdAndDelete(id);
    if (!deletedOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    res.json({ message: 'Purchase order rejected and deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
 
 
// PUT route to raise an invoice for a purchase order 

app.put('/raise-invoice/:id', async (req, res) => {
  const purchaseOrderId = req.params.id;
 
  try {
    // Fetch the purchase order from the database
    const purchaseOrder = await PurchaseOrder.findById(purchaseOrderId);
    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found.' });
    }
 
    // Fetch the trainer details from the database using the trainer's email from the purchase order
    const trainer = await Trainer.findOne({ email: purchaseOrder.trainerEmail });
    if (!trainer) {
      return res.status(404).json({ error: 'Trainer not found.' });
    }
 
    // Create a new TrainerInvoice document
    const newInvoice = new TrainerInvoice({
      trainerId: trainer._id,
      poId: purchaseOrder._id,
      businessId: purchaseOrder.businessRequestId,
      name: trainer.name,
      email: trainer.email,
      amount: purchaseOrder.amount,
      contactNumber: trainer.contactNumber,
      raiseStatus:true,
      paymentStatus: false, // Set paymentStatus to false initially
      startDate: purchaseOrder.startDate,
      endDate: purchaseOrder.endDate,
    });
 
    // Save the new invoice to the database
    await newInvoice.save();
 
    res.status(200).json({ message: 'Invoice raised successfully.' });
  } catch (error) {
    console.error('Error raising invoice:', error);
    res.status(500).json({ error: 'An error occurred while raising the invoice.' });
  }
});
 
// GET Trainer Invoice by email
app.get('/invoices/:email', async (req, res) => {
  try {
    const trainerInvoices = await TrainerInvoice.find({ email: req.params.email });
    if (!trainerInvoices || trainerInvoices.length === 0) {
      return res.status(404).json({ message: 'Trainer invoices not found' });
    }
    res.json(trainerInvoices);
  } catch (error) {
    console.error('Error fetching trainer invoices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
 
// GET invoice details by ID
app.get('/invoices/:id/download', async (req, res) => {
  try {
    const trainingId = req.params.id;
    const training = await TrainerInvoice.findById(trainingId);
    if (!training) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(training);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
 
//Api for deleting a trainer account
app.delete('/trainer/:email', async (req, res) => {
  const email = req.params.email;
 
  try {
    // Find the trainer by ID
    const trainer = await Trainer.findOne({ email });
 
    if (!trainer) {
      return res.status(404).json({ error: 'Trainer not found' });
    }
 
    // Perform additional checks if needed (e.g., ensure the request is coming from the authenticated trainer)
 
    // Delete the trainer
    await trainer.deleteOne();
 
    res.json({ message: 'Trainer account deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}); 


// To get the count of purchase order
app.get('/purchase-orders/count/:trainerEmail', async (req, res) => {
  const trainerEmail = req.params.trainerEmail;
 
  try {
    const count = await PurchaseOrder.countDocuments({ trainerEmail });
    res.json({ count });
  } catch (error) {
    console.error('Error retrieving count of purchase orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
 
//To get the total count of total trainer orders
app.get('/total-trainers/:trainerEmail', async (req, res) => {
  const trainerEmail = req.params.trainerEmail;
 
  try {
    const count = await PurchaseOrder.countDocuments({ trainerEmail, status: true });
    res.json({ count });
  } catch (error) {
    console.error('Error retrieving count of trainers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
 // Current trainngs dashboard
 app.get('/current-trainings/:trainerEmail', async (req, res) => {
  const trainerEmail = req.params.trainerEmail;
 
  try {
    const currentDate = new Date(); // Get the current date
    const currentTrainings = await PurchaseOrder.find({
      trainerEmail,
      startDate: { $lte: currentDate }, // Start date should be less than or equal to current date
      endDate: { $gte: currentDate } // End date should be greater than or equal to current date
    });
    res.json({ currentTrainings });
  } catch (error) {
    console.error('Error retrieving current trainings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//------------------------------- Company ---------------------------------- 
 
// Company registration endpoint
app.post("/companies", async (req, res) => {
  try {
    const { email } = req.body;
 
    // Check if email already exists
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return res.status(400).json({ message: "Email already exists" });
    }
 
    // If email doesn't exist, proceed with registration
    const { uniqueId, companyName, location, phone, password, domain } =
      req.body;
 
    const hashedPassword = await bcrypt.hash(password, 10);
 
    const newCompany = new Company({
      uniqueId,
      companyName,
      location,
      phone,
      email,
      password: hashedPassword,
      domain,
    });
 
    await newCompany.save();
    res.status(201).json({ message: "Company registered successfully" });
  } catch (error) {
    console.error("Error registering company:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Business request for trainer
app.post('/businessrequest', authenticateJWT, async (req, res) => {
  try {
    console.log(req);
    // Extract the company's uniqueId from the authenticated user
    const companyDocument = await Company.findById(req.user.id);
    const companyUniqueId = companyDocument._id ;
   
 
    // Ensure that the authenticated user is a company and has a uniqueId
    if (!companyUniqueId) {
      return res.status(400).json({ error: 'Company uniqueId is required.' });
    }
 
    // Create a new business request with the company's uniqueId
    const newBusinessRequest = await BusinessRequest.create({
      ...req.body,
      uniqueId: companyUniqueId,
    });
 
    console.log('Business Request Data inserted successfully:', newBusinessRequest);
 
    return res.status(200).json({ message: 'Business Request Data submitted successfully' });
  } catch (error) {
    console.error('Error inserting data into MongoDB:', error);
    console.log(req.uniqueId);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Find company by username endpoint
app.get("/companies/:email", async (req, res) => {
  const { email } = req.params;
  // console.log(username)
  try {
    // Find the company by username
    const company = await Company.findOne({ email });
    if (!company) {
      return res.status(404).json({ message: "company not found" });
    }
 
    res.status(200).json(company);
  } catch (error) {
    console.error("Error finding trainer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Update company by username endpoint
app.put("/companies/:email", async (req, res) => {
  const { email: updatedEmail } = req.params; // Rename 'email' to 'updatedEmail'
 
  try {
    // Find the company by email
    let company = await Company.findOne({ email: updatedEmail });
    if (!company) {
      return res.status(404).json({ message: "company not found" });
    }
 
    // Update company fields
    const {
      password,
      companyName,
      email,
      location,
      phone,
      domain
    } = req.body;
 
    if (password) {
      company.password = password;
    }
    if (companyName) {
      company.companyName = companyName;
    }
    if (email) {
      company.email = email;
    }
    if (location) {
      company.location = location;
    }
    if (phone) {
      company.phone = phone;
    }
    if (domain) {
      company.domain = domain;
    }
  
    // Save the updated company
    company = await company.save();
 
    res.status(200).json({ message: "Trainer updated successfully", company });
  } catch (error) {
    console.error("Error updating trainer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Endpoint to submit feedback form
app.post("/feedback", async (req, res) => {
  const feedbackData = req.body;
 
  try {
    const newFeedback = new Feedback(feedbackData);
    await newFeedback.save();
 
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});


// Endpoint to check if an email exists
app.get("/check-email", async (req, res) => {
  const { email } = req.query;
 
  try {
    // Check if the email already exists in either Trainer or Company collection
    const trainerExists = await Trainer.exists({ email });
    const companyExists = await Company.exists({ email });
 
    // If email exists in either collection, return true; otherwise, return false
    const emailExists = trainerExists || companyExists;
   
    res.json({ exists: emailExists });
  } catch (error) {
    console.error("Error checking email existence:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



// Get all business invoices for a particular business (by email)
app.get('/businessinvoices/:businessEmail', async (req, res) => {
  const { businessEmail } = req.params;
 
  try {
    const businessInvoices = await BusinessInvoice.find({ businessEmail });
    res.json(businessInvoices);
  } catch (error) {
    console.error('Error fetching business invoices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


 
// Update paymentStatus based on business email
app.put('/businessinvoices/:id/accept', async (req, res) => {
  const { id } = req.params;
 
  try {
    console.log('Accepting invoice. ID:', id);
 
    const updatedInvoice = await BusinessInvoice.findByIdAndUpdate(id, { paymentStatus: true }, { new: true });
    if (!updatedInvoice) {
      console.log('Invoice not found');
      return res.status(404).json({ message: 'Business invoice not found' });
    }
 
    console.log('Invoice accepted successfully:', updatedInvoice);
    res.json(updatedInvoice);
  } catch (error) {
    console.error('Error updating business invoice:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//current training
app.get('/finalinvoices/:businessEmail', async (req, res) => {
  try {
    const {businessEmail} = req.params;
    const invoices = await Invoice.find({ businessEmail });
    res.json(invoices);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// ---------------------------- Admin ----------------------------------

//login logic
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
 
  try {
    // Check if the provided credentials are for the admin
    if (email == "admin@gmail.com" && password == "admin") {
      // Generate token for admin as well
      const token = jwt.sign({ email, role: "admin" }, secretKey, {
        expiresIn: "1h",
      });
      return res.status(200).json({ role: "admin", token }); // Return admin role and token
    }
 
    // Proceed with regular user login for trainer or company
    let user = await Trainer.findOne({ email });
    let role = "trainer";
 
    if (!user) {
      user = await Company.findOne({ email });
      role = "company";
    }
 
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
 
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
      // Generate token with addiional uniqueId for company users
      const tokenPayload = {email: user.email, role, id:user._id};


      const token = jwt.sign(tokenPayload, secretKey, {
        expiresIn: "1h",
      });

      res.status(200).json({ role, token }); // Send the token to the client
    } else {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
 

// Modify the admin-dashboard route to apply authentication middleware
app.get(
  "/admin-dashboard",
  authenticateJWT, // Apply authentication middleware
  authorizeRole(["admin"]), // Apply authorization middleware
  (req, res) => {
    // Admin dashboard code
    res.send("Welcome to the Admin Dashboard");
  }
);

app.get(
  "/trainer-dashboard",
  authenticateJWT,
  authorizeRole(["trainer"]),
  (req, res) => {
    // Trainer dashboard code
    res.send("Welcome to the Trainer Dashboard");
  }
);

app.get(
  "/business-dashboard",
  authenticateJWT,
  authorizeRole(["company"]),
  (req, res) => {
    // Business dashboard code
    res.send("Welcome to the Business Dashboard");
  }
);

app.get("/admintrainers", async (req, res) => {
  try {
    const trainers = await Trainer.find();
    res.status(200).json(trainers);
  } catch (error) {
    console.error("Error fetching trainers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/admincompanies", async (req, res) => {
  try {
    const companies = await Company.find();
    res.status(200).json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update trainer by ID
app.put("/admintrainers/:id", async (req, res) => {
  const { id } = req.params; // Get the trainer ID from the URL params
  const updatedData = req.body; // Get the updated trainer data from the request body
  try {
    // Find the trainer by ID and update their details
    const updatedTrainer = await Trainer.findByIdAndUpdate(id, updatedData, {
      new: true,
    });
    if (!updatedTrainer) {
      return res.status(404).json({ message: "Trainer not found" });
    }
    res.status(200).json(updatedTrainer);
  } catch (error) {
    console.error("Error updating trainer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete trainer by ID
app.delete("/admintrainers/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await Trainer.findByIdAndDelete(id);
    res.status(200).json({ message: "Trainer deleted successfully" });
  } catch (error) {
    console.error("Error deleting trainer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Updating company details by ID
app.put("/admincompanies/:id", async (req, res) => {
  const companyId = req.params.id;
  const updatedCompanyData = req.body; // New data for the company

  try {
    // Find the company by ID and update its details
    const company = await Company.findByIdAndUpdate(
      companyId,
      updatedCompanyData,
      { new: true }
    );
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: "Error updating company details", error });
  }
});

// Deleting company details by ID
app.delete("/admincompanies/:id", async (req, res) => {
  const companyId = req.params.id;

  try {
    // Find the company by ID and delete it
    await Company.findByIdAndDelete(companyId);
    res.json({ message: "Company deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting company", error });
  }
});

//API to display all business requests
app.get("/adminbusinessrequests", async (req, res) => {
  try {
    const data = await BusinessRequest.aggregate([
      {
        $lookup: {
          from: "purchaseorders", // Collection name of purchase order
          localField: "_id",
          foreignField: "businessRequestId",
          as: "purchaseOrders",
        },
      },
      {
        $match: {
          purchaseOrders: { $size: 0 }, // Filter out business requests without linked purchase orders
        },
      },
    ]);
 
    res.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//API for fetching all business requests and inputing the trainer details
app.get("/adminpurchase-orders", async (req, res) => {
  try {
    // Fetch all purchase orders and populate the trainer and businessId fields
    const purchaseOrders = await PurchaseOrder.find()
      .populate({
        path: "trainer",
        select: "name", // Select the fields you want to populate from the Trainer collection
        model: "Trainer",
      })
      .populate({
        path: "businessRequestId",
        select: "companyName", // Select the fields you want to populate from the Company collection
        model: "Company",
      });

    res.status(200).json(purchaseOrders);
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/adminpurchase-orders", async (req, res) => {
  // Extract data from the request body
  const {
    businessRequestId,
    trainerEmail,
    amount,
    status,
    startDate,
    endDate,
  } = req.body;

  try {
    // Find the trainer based on the provided email
    const trainer = await Trainer.findOne({ email: trainerEmail });

    if (!trainer) {
      return res.status(404).json({ message: "Trainer not found" });
    }

    // Create a new PurchaseOrder instance with the trainer's ObjectId
    const newPurchaseOrder = new PurchaseOrder({
      businessRequestId,
      trainer: trainer._id, // Store the ObjectId of the trainer
      trainerEmail,
      amount,
      status,
      startDate,
      endDate,
    });

    // Save the new PurchaseOrder instance to the database
    const savedPurchaseOrder = await newPurchaseOrder.save();
    res.status(201).json(savedPurchaseOrder);
  } catch (error) {
    console.error("Error creating purchase order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// API to delete the business request
app.delete("/adminbusinessrequests/:id", async (req, res) => {
  const requestId = req.params.id;

  try {
    // Find the business request record by ID and delete it
    const deletedRequest = await BusinessRequest.findByIdAndDelete(requestId);

    if (!deletedRequest) {
      // If the record with the given ID is not found, return a 404 status
      return res.status(404).json({ message: "Business request not found" });
    }

    // If the record is successfully deleted, return a success message
    res.status(200).json({ message: "Business request deleted successfully" });
  } catch (error) {
    // If an error occurs during deletion, return a 500 status and error message
    console.error("Error deleting business request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//API for displaying purchase order details
app.get("/adminpurchase-orders-details", async (req, res) => {
  try {
    const purchaseOrdersDetails = await PurchaseOrder.aggregate([
      {
        $lookup: {
          from: "trainers",
          localField: "trainer",
          foreignField: "_id",
          as: "trainerDetails",
        },
      },
      {
        $unwind: "$trainerDetails",
      },
      {
        $lookup: {
          from: "businessrequests",
          localField: "businessRequestId",
          foreignField: "_id",
          as: "businessRequestDetails",
        },
      },
      {
        $unwind: "$businessRequestDetails",
      },
      {
        $lookup: {
          from: "companies",
          localField: "businessRequestDetails.uniqueId",
          foreignField: "_id",
          as: "companyDetails",
        },
      },
      {
        $unwind: "$companyDetails",
      },
      {
        $project: {
          trainerName: "$trainerDetails.name",
          trainerEmail: "$trainerDetails.email",
          skills: "$trainerDetails.skills",
          chargePerDay: "$trainerDetails.chargePerDay",
          companyName: "$companyDetails.companyName",
          location: "$companyDetails.location",
          companyEmail: "$companyDetails.email",
          companyPhone: "$companyDetails.phone",
        },
      },
    ]);

    if (!purchaseOrdersDetails) {
      return res.status(404).json({ message: "No purchase orders found" });
    }

    //console.log("Aggregated data:", purchaseOrdersDetails);
    res.status(200).json(purchaseOrdersDetails);
  } catch (error) {
    console.error("Error fetching purchase orders details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Assuming you have TrainerInvoice model defined and mongoose set up
app.get("/admintrainerinvoices", async (req, res) => {
  try {
    const trainerInvoices = await TrainerInvoice.find();
    res.json(trainerInvoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/adminbusinessinvoices", async (req, res) => {
  try {
    const {
      invoiceId,
      poId,
      businessId,
      totalAmount,
      batches,
      startDate,
      endDate,
      technologies,
      paymentStatus,
    } = req.body;

    await TrainerInvoice.updateMany(
      { _id: invoiceId },
      { $set: { paymentStatus: true } }
    );
    const purchaseOrder = await PurchaseOrder.findById(poId);
    const businessRequest = await BusinessRequest.findById(
      purchaseOrder.businessRequestId
    );
    const company = await Company.findById(businessRequest.uniqueId);

    const companyName = company.companyName;
    const amount = businessRequest.trainingBudget;
    const businessEmail = company.email;
    // Create a new business invoice
    const newInvoice = new BusinessInvoice({
      poId,
      businessId,
      companyName,
      amount,
      batches,
      startDate,
      endDate,
      technologies,
      paymentStatus,
      businessEmail,
    });
    console.log(newInvoice);

    // Save the new invoice to the database
    await newInvoice.save();

    res.status(201).json(newInvoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get("/adminTechnologySell", async (req, res) => {
  try {
    // Aggregate the count of each technology, using case-insensitive grouping
    const technologyData = await BusinessRequest.aggregate([
      {
        $group: {
          _id: { $toLower: { $ifNull: ["$technology", ""] } }, // Convert field values to lowercase, handling null values
          count: { $sum: 1 }, // Count occurrences of each unique value
        },
      },
      { $sort: { count: -1 } }, // Sort by count in descending order
    ]);

    // Transform the data into an array of objects with technology and count properties
    const formattedData = technologyData.map((item) => ({
      technology: item._id,
      count: item.count,
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching technology data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/adminbusinessrequestsGraph", async (req, res) => {
  try {
    // Fetch all business requests from the database
    const businessRequests = await BusinessRequest.find();

    // Group business requests by quarter
    const quarterlyRevenue = businessRequests.reduce((acc, request) => {
      const quarter = Math.floor((request.startDate.getMonth() + 3) / 3);
      acc[quarter - 1] = (acc[quarter - 1] || 0) + request.trainingBudget;
      return acc;
    }, Array(4).fill(0));

    res.json(quarterlyRevenue);
  } catch (error) {
    console.error("Error fetching quarterly revenue:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ----------------------------- Listening ----------------------------------------------

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
 