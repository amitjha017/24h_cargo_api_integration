import Country from "../db/models/country.js";
import State from "../db/models/state.js";
import City from "../db/models/city.js";
import { success, error } from "../utils/response.js";
import { STATUS_CODES } from "../utils/constants.js";
import { getLoggerWithLabel } from "../utils/logger.js";

/**
 * GET /api/countries
 * List all countries with basic info.
 * Uses OAuth token.
 */
export const getCountries = async function (req, res) {
  const logger = getLoggerWithLabel("getCountries");
  logger.info("getCountries API called");

  try {
    let countries = await Country.find()
      .select({ createdAt: 0, updatedAt: 0, __v: 0 })
      .lean()
      .sort({ name: 1 })
      .exec();

    if (!countries || countries.length === 0) {
      return success(res, STATUS_CODES.OK, [], "No countries found");
    }

    countries = countries.map((country) => ({
      id: country._id,
      name: country.name,
      shortName: country.iso2,
      iso3: country.iso3,
      flag: country.emoji,
      phoneCode: country.phone_code,
      currency: country.currency,
      currencyName: country.currency_name,
      currencySymbol: country.currency_symbol,
      mesaurementUnitDetails: country.mesaurementUnitDetails,
    }));

    logger.info(`Countries fetched: ${countries.length}`);
    return success(res, STATUS_CODES.OK, countries, "Countries fetched successfully");
  } catch (err) {
    logger.error(`Error in getCountries: ${err.message}`);
    return error(res, STATUS_CODES.INTERNAL_SERVER, err.message);
  }
};

/**
 * GET /api/states/:countryId
 * List states for a given country.
 * Uses OAuth token.
 */
export const getStatesByCountry = async function (req, res) {
  const logger = getLoggerWithLabel("getStatesByCountry");
  logger.info("getStatesByCountry API called");

  try {
    const { countryId } = req.params;

    if (!countryId) {
      return error(res, STATUS_CODES.BAD_REQUEST, "countryId is required");
    }

    let states = await State.find({ countryId })
      .select({ name: 1 })
      .lean()
      .sort({ name: 1 })
      .exec();

    if (!states || states.length === 0) {
      return success(res, STATUS_CODES.OK, [], "No states found for this country");
    }

    states = states.map((state) => ({
      id: state._id,
      name: state.name,
    }));

    logger.info(`States fetched: ${states.length}`);
    return success(res, STATUS_CODES.OK, states, "States fetched successfully");
  } catch (err) {
    logger.error(`Error in getStatesByCountry: ${err.message}`);
    return error(res, STATUS_CODES.INTERNAL_SERVER, err.message);
  }
};

/**
 * GET /api/cities?countryId=xxx&stateId=yyy
 * List cities for a given country and state.
 * Uses OAuth token.
 */
export const getCities = async function (req, res) {
  const logger = getLoggerWithLabel("getCities");
  logger.info("getCities API called");

  try {
    const { countryId, stateId } = req.query;

    if (!countryId) {
      return error(res, STATUS_CODES.BAD_REQUEST, "countryId is required");
    }

    const filter = { countryId };
    if (stateId) {
      filter.stateId = stateId;
    }

    let cities = await City.find(filter)
      .select({ name: 1 })
      .lean()
      .sort({ name: 1 })
      .exec();

    if (!cities || cities.length === 0) {
      return success(res, STATUS_CODES.OK, [], "No cities found");
    }

    cities = cities.map((city) => ({
      id: city._id,
      name: city.name,
    }));

    logger.info(`Cities fetched: ${cities.length}`);
    return success(res, STATUS_CODES.OK, cities, "Cities fetched successfully");
  } catch (err) {
    logger.error(`Error in getCities: ${err.message}`);
    return error(res, STATUS_CODES.INTERNAL_SERVER, err.message);
  }
};
