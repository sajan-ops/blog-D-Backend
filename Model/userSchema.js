const mongoose = require("mongoose");
// Define the User schema
const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  moneySpent: { type: String, default: 0 },
  remainingGames: { type: String, default: 0 },
  status: { type: String }, // login or logout; status will be offline or online
  currentPackage: { type: [String], default: ["free"] }, // Corrected syntax
  myHostGames: [
    { type: mongoose.mongoose.Schema.Types.ObjectId, ref: "MyGame" },
  ],

  freePackage: [
    { type: mongoose.mongoose.Schema.Types.ObjectId, ref: "FreePackage" },
  ],
  premiumPackage: [
    { type: mongoose.mongoose.Schema.Types.ObjectId, ref: "PremiumPackage" },
  ],
  elitePackage: [
    { type: mongoose.mongoose.Schema.Types.ObjectId, ref: "ElitePackage" },
  ],
  diamondPackage: [
    { type: mongoose.mongoose.Schema.Types.ObjectId, ref: "DiamondPackage" },
  ],
  paymentInfo: [
    { type: mongoose.mongoose.Schema.Types.ObjectId, ref: "PaymentInfo" },
  ],
});

// Define schemas with multiple references to the User schema
const BasicPackageSchema = new mongoose.Schema({
  name: String,
  title: { type: String, default: "Basic Package" },
  description: {
    type: String,
    default: "Advanced features with basic support.",
  },
  price: { type: Number, default: 1 },
  features: { type: [String], default: ["Basic support", "Basic access"] },
  img: { type: String, default: "package1.png" }, // Default image path
  text: { type: String, default: "Basic features" }, // Default text
});

const FreePackageSchema = new mongoose.Schema({
  name: String,
  title: { type: String, default: "Free Package" },
  description: { type: String, default: "Basic features available for free." },
  features: { type: [String], default: ["Basic support", "Limited access"] },
  img: { type: String, default: "package1.png" }, // Default image path
  text: { type: String, default: "Free features" }, // Default text
});

const PremiumPackageSchema = new mongoose.Schema({
  name: String,
  title: { type: String, default: "Premium Package" },
  description: {
    type: String,
    default: "Advanced features with premium support.",
  },
  price: { type: Number, default: 3 },
  features: { type: [String], default: ["Premium support", "Extended access"] },
  img: { type: String, default: "package2.png" }, // Default image path
  text: { type: String, default: "Premium features" }, // Default text
});

const ElitePackageSchema = new mongoose.Schema({
  name: String,
  title: { type: String, default: "Elite Package" },
  description: { type: String, default: "All features with priority support." },
  price: { type: Number, default: 5 },
  features: { type: [String], default: ["Priority support", "Full access"] },
  additionalBenefits: { type: [String], default: ["Extra content"] },
  img: { type: String, default: "package3.png" }, // Default image path
  text: { type: String, default: "Elite features" }, // Default text
});

const DiamondPackageSchema = new mongoose.Schema({
  name: String,
  title: { type: String, default: "Diamond Package" },
  description: {
    type: String,
    default: "All features with exclusive content and support.",
  },
  price: { type: Number, default: 10 },
  features: {
    type: [String],
    default: ["Exclusive support", "Exclusive content", "Full access"],
  },
  exclusiveContent: { type: [String], default: ["VIP content"] },
  img: { type: String, default: "package4.png" }, // Default image path
  text: { type: String, default: "Diamond features" }, // Default text
});

const CategorySchema = new mongoose.Schema({
  name: String,
  image: String,
  questions: [
    { type: mongoose.mongoose.Schema.Types.ObjectId, ref: "Question" },
  ],
  // Additional fields specific to Category
});

const QuestionSchema = new mongoose.Schema({
  points: String,
  question: String,
  answer: String,
  hint: String,
  rightanswer: String,
  wronganswer: String,
  image: String,
  document: String,
  // Additional fields specific to Question
});

const MyGamesSchema = new mongoose.Schema({
  GameName: String,
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
  // Additional fields specific to GameName
});

const TeamSchema = new mongoose.Schema({
  name: String,
  score: { type: Number, default: 0 },
  usedAxiliaryMeans: {
    type: Object,
    default: {
      women: false,
      light: false,
      rating: false,
      hand: false,
    },
  },
  answers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Answer" }],
});

// Schema for Answer
const AnswerSchema = mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  answered: { type: Boolean, default: false },
  gameid: { type: String },
});

const PaymentInfoSchema = new mongoose.Schema({
  users: [{ type: mongoose.mongoose.Schema.Types.ObjectId, ref: "User" }],
  // Additional fields specific to PaymentInfo
});
const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
// Create models for each schema
const User = mongoose.model("User", UserSchema);
const FreePackage = mongoose.model("FreePackage", FreePackageSchema);
const BasicPackage = mongoose.model("BasicPackage", BasicPackageSchema);
const PremiumPackage = mongoose.model("PremiumPackage", PremiumPackageSchema);
const ElitePackage = mongoose.model("ElitePackage", ElitePackageSchema);
const DiamondPackage = mongoose.model("DiamondPackage", DiamondPackageSchema);
const Category = mongoose.model("Category", CategorySchema);
const Question = mongoose.model("Question", QuestionSchema);
const CreateGame = mongoose.model("MyGame", MyGamesSchema);
const Team = mongoose.model("Team", TeamSchema);
const Answer = mongoose.model("Answer", AnswerSchema);

const PaymentInfo = mongoose.model("PaymentInfo", PaymentInfoSchema);
const Admin = mongoose.model("AdminSchema", AdminSchema);

// Export models
module.exports = {
  User,
  FreePackage,
  BasicPackage,
  PremiumPackage,
  ElitePackage,
  DiamondPackage,
  Category,
  Question,
  CreateGame,
  Team,
  PaymentInfo,
  Question,
  Category,
  Answer,
  Admin,
};
