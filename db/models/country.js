import mongoose from "mongoose";

const Schema = mongoose.Schema;

const TimezoneSchema = new Schema({
  zoneName: String,
  gmtOffset: Number,
  gmtOffsetName: String,
  abbreviation: String,
  tzName: String
});

const TranslationSchema = new Schema({
  ko: String,
  "pt-BR": String,
  pt: String,
  nl: String,
  hr: String,
  fa: String,
  de: String,
  es: String,
  fr: String,
  ja: String,
  it: String,
  "zh-CN": String,
  tr: String,
  ru: String,
  uk: String,
  pl: String
}, { _id: false });

const CountrySchema = new Schema({
  name: { type: String, required: true },
  iso3: { type: String, required: true },
  iso2: { type: String, required: true },
  numeric_code: String,
  phone_code: String,
  capital: String,
  currency: String,
  currency_name: String,
  currency_symbol: String,
  tld: String,
  native: String,
  region: String,
  region_id: Number,
  subregion: String,
  subregion_id: Number,
  nationality: String,
  timezones: [TimezoneSchema],
  translations: TranslationSchema,
  latitude: String,
  longitude: String,
  emoji: String,
  emojiU: String,
  unitOfMeasurement: {
    type: String
  },
  unitOfWeight: {
    type: String
  },
  mesaurementUnitDetails: {
    measurementUnit: { type: String },
    weightUnit: { type: String },
    commonDivisorNational: { type: String },
    commonDivisorInterNational: { type: String },
  }
}, { timestamps: true });

export default mongoose.model("Country", CountrySchema);
