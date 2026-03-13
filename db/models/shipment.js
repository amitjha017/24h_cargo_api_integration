import mongoose from "mongoose";
const Schema = mongoose.Schema;

const shipmentSchema = new Schema(
  {
    origin: {
      originCountryId: { type: Schema.Types.ObjectId, ref: "Country" },
      countryId: { type: Schema.Types.ObjectId, ref: "Country" },
      countryShortName: { type: String },
      countryCode: { type: String },
      countryName: { type: String },
      numericCode: { type: String },
      currency: { type: String },
      currencySymbol: { type: String },
      phone: { type: String },
    },
    destination: {
      destinationCountryId: { type: Schema.Types.ObjectId, ref: "Country" },
      data: {},
      fullAddress: { type: String },
      countryId: { type: Schema.Types.ObjectId, ref: "Country" },
      countryShortName: { type: String },
      countryCode: { type: String },
      countryName: { type: String },
      stateId: { type: Schema.Types.ObjectId, ref: "State" },
      stateName: { type: String },
      cityId: { type: Schema.Types.ObjectId, ref: "City" },
      cityName: { type: String },
      numericCode: { type: String },
      currency: { type: String },
      currencySymbol: { type: String },
      phone: { type: String },
    },
    warehouseId: { type: Schema.Types.ObjectId, required: true, ref: "Origin" },
    warehouse: {
      warehouseId: { type: Schema.Types.ObjectId, ref: "Origin" },
      name: { type: String },
      phone: { type: String },
      email: { type: String },
      cityId: { type: Schema.Types.ObjectId, ref: "City" },
      cityName: { type: String },
      stateId: { type: Schema.Types.ObjectId, ref: "State" },
      stateName: { type: String },
      countryId: { type: Schema.Types.ObjectId, ref: "Country" },
      countryName: { type: String },
    },
    rateDetails: {},
    senderDetails: {
      senderId: { type: Schema.Types.ObjectId, ref: "Customer" },
      firstName: { type: String },
      lastName: { type: String },
      email: { type: String },
      phone: { type: String },
      fullAddress: { type: String },
      address: { type: String },
      documentType: { type: String },
      apartment: { type: String },
      area: { type: String },
      landmark: { type: String },
      countryId: { type: Schema.Types.ObjectId, ref: "Country" },
      stateId: { type: Schema.Types.ObjectId, ref: "State" },
      cityId: { type: Schema.Types.ObjectId, ref: "City" },
      postalCode: { type: String },
    },
    recieptentDetails: {
      recipientId: { type: Schema.Types.ObjectId, ref: "Customer" },
      firstName: { type: String },
      lastName: { type: String },
      email: { type: String },
      phone: { type: String },
      fullAddress: { type: String },
      address: { type: String },
      documentType: { type: String },
      apartment: { type: String },
      area: { type: String },
      landmark: { type: String },
      countryId: { type: Schema.Types.ObjectId, ref: "Country" },
      stateId: { type: Schema.Types.ObjectId, ref: "State" },
      cityId: { type: Schema.Types.ObjectId, ref: "City" },
      postalCode: { type: String },
    },
    desiredValueCurrency: { type: Schema.Types.ObjectId, ref: "Currency" },
    declaredValue: { type: String },
    shipmentStage: { type: String, enum: ["level0", "level1", "level2", "level3"] },
    descriptionOfGoods: { type: String },
    extraCharge: {
      description: { type: String },
      value: { type: String },
    },
    isInsurance: { type: String, enum: ["Yes", "No"] },
    discount: {
      description: { type: String },
      value: { type: String },
    },
    packageIds: [{ type: Schema.Types.ObjectId, ref: "Package" }],
    shipmentStatus: {
      currentStatus: {
        type: String,
        enum: [
          "created", "inoriginwarehouse", "withagent", "unpaid", "paid",
          "pickup", "onhold", "intransit", "incustoms", "indestinationwarehouse",
          "indeliveryprocess", "cancel", "delivered", "return",
        ],
      },
      status: [
        {
          name: { type: String },
          dateTime: { type: String },
          user: {},
          location: { type: String },
          type: { type: String, enum: ["internel", "externel"] },
          comment: { type: String },
          from: { type: String },
          to: { type: String },
        },
      ],
    },
    shipmentId: { type: String, unique: true },
    payment: [
      {
        mode: { type: String },
        paidStatus: { type: String },
        trackingId: { type: String },
        comment: { type: String },
        createdAt: { type: Date },
      },
    ],
    shippingDetails: {
      insuranceCharges: { type: String },
      shipmentCharges: { type: String },
      extraCharge: { type: String },
      discount: { type: String },
      total: { type: String },
    },
    shipmentDetailsCharges: {},
    name: { type: String },
    isMultiPackage: { type: Boolean },
    isFastPackage: { type: Boolean },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    lockerId: { type: Schema.Types.ObjectId, ref: "Locker" },
    receiveDate: { type: String },
    specialInstructions: { type: String },
    servicePrice: { type: String },
    paymentMethod: { type: String },
    carrierTypeId: { type: Schema.Types.ObjectId, ref: "carriertype" },
    packageTypeId: { type: Schema.Types.ObjectId, ref: "packagetype" },
    packageTypeName: { type: String },
    trackingId: { type: String },
    description: { type: String },
    shipmentCode: { type: String },
    pkgValue: { type: Number },
    length: { type: Number },
    breadth: { type: Number },
    height: { type: Number },
    weight: { type: Number },
    currency: { type: String },
    unitOfweight: { type: String },
    unitOfMeasurement: { type: String },
    pcs: { type: Number },
    vol: { type: Number },
    chargebleWeight: { type: Number },
    packageImage: { type: String },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    agencyId: { type: Schema.Types.ObjectId, ref: "Agency" },
    agentId: { type: Schema.Types.ObjectId, ref: "Agent" },
    locationId: { type: Schema.Types.ObjectId, ref: "Location" },
    isRepackage: { type: Boolean },
    providerId: { type: Schema.Types.ObjectId, ref: "provider" },
    carrierTypeCategoryId: { type: Schema.Types.ObjectId, ref: "carriertypecategory" },
    deletedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    import: { type: Object },
    export: { type: Object },
    isPaid: { type: Boolean },
    isConsolidated: { type: Boolean, default: false },
    documents: [{ name: { type: String }, path: { type: String } }],
    signature: {
      image: { type: String },
      personName: { type: String },
    },
    invoice: {
      invoiceDate: { type: String },
      taxNumber: { type: String },
      recieversAddress: { type: String },
      service: { type: String },
      serviceType: { type: String },
      shipments: { type: String },
      weight: { type: String },
      items: { type: String },
      shipping: { type: String },
      extra: { type: String },
      discount: { type: String },
      tax: { type: String },
      total: { type: String },
    },
    selectedService: { type: Object },
    handleFee: { type: String },
    insuranceAmount: { type: String },
    declaredTaxValue: { type: String },
    declaredTax: { type: String },
    insuranceTax: { type: String },
    declaredValueSlab: { type: Object },
    publicPrice: { type: String },
    accountPrice: { type: String },
    totalAmount: { type: String },
    zone: {
      current: {
        zoneId: { type: Schema.Types.ObjectId, ref: "zone" },
        levelId: { type: Schema.Types.ObjectId, ref: "level", required: false },
        originId: { type: Schema.Types.ObjectId, ref: "Origin" },
        updatedDateTime: { type: String },
      },
      history: [
        {
          zoneId: { type: Schema.Types.ObjectId, ref: "zone" },
          levelId: { type: Schema.Types.ObjectId, ref: "level", required: false },
          originId: { type: Schema.Types.ObjectId, ref: "Origin" },
          updatedDateTime: { type: String },
        },
      ],
    },
  },
  { timestamps: true }
);

const generateRandomShipmentNumber = () => {
  const prefix = "SHP";
  const randomNumber = Math.floor(Math.random() * 1000000000000)
    .toString()
    .padStart(12, "0");
  const suffix = "XP" + Math.floor(Math.random() * 10);
  return `${prefix}${randomNumber}${suffix}`;
};

shipmentSchema.pre("validate", async function (next) {
  if (!this.shipmentId) {
    let unique = false;
    while (!unique) {
      const newshipmentId = generateRandomShipmentNumber();
      const existingShipment = await mongoose
        .model("Shipment")
        .findOne({ shipmentId: newshipmentId });
      if (!existingShipment) {
        this.shipmentId = newshipmentId;
        unique = true;
      }
    }
  }
  next();
});

export default mongoose.model("Shipment", shipmentSchema);
