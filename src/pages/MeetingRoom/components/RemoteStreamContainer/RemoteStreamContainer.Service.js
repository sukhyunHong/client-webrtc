import axios from "../../../../apis/axios";

export const getInformationRoom = async (params) => {
  const response = await axios.get("/room/getinfo", {params});
  return response;
};

