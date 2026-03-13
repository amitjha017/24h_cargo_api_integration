import axios from "axios";

const API_USER_MODULE = process.env.API_USER_MODULE;

export const createUser = (userData, auth) => {
  return new Promise(async (resolve) => {
    try {
      const response = await axios.post(
        `${API_USER_MODULE}/createUser`,
        userData,
        {
          headers: { Authorization: auth },
        }
      );
      resolve(response?.data);
    } catch (error) {
      if (error?.response?.data?.message)
        return resolve({ error: error?.response?.data?.message });
      resolve(null);
    }
  });
};
