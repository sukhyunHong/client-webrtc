import axios from "../../../../apis/axios";

export const getInformationRoom = async (params) => {
  const response = await axios.get("/room/getinfo", {params});
  return response;
};

export const getLectureInfo = async (params) => {
  const response = await axios.get("/room/lecture", {params});
  return response;
}

export const postTestConcentration = async (params) => {
  const response = await axios.post("/room/test-concentration-fail", params);
  return response;
}


