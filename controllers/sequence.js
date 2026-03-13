import Sequence from "../db/models/sequence.js";
import { getLoggerWithLabel } from "../utils/logger.js";

export const getNextSequenceValue = async (sequenceName, prefix = "") => {
  const logger = getLoggerWithLabel("getNextSequenceValue");

  logger.info("query to generate new sequence number");
  const newsequencegenerate = await Sequence.findOneAndUpdate(
    { name: sequenceName },
    { $inc: { sequenceValue: 1 } },
    { new: true, upsert: true }
  );
  logger.info("new sequence number generated");

  const formattedSequence = newsequencegenerate.sequenceValue;
  return `${prefix}${formattedSequence}`;
};
