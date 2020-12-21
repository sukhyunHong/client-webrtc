import api from "../../apis/axios"
import asmediaapi from "../../apis/asmediaapi"

const services = {
  listFn: async ({ term }) => {
    let url = "/user"
    url = term ? url + `?term=${term}` : url
    const response = await api.get(url)
    return response
  },

  findFn: async id => {
    const response = await api.get(`/user/${id}`)
    return response
  },

  getCurrent: async () => {
    const response = await api.get(`/user/current`)
    return response
  },

  createFn: async id => {
    const response = await api.post(`/user/${id}`)
    return response
  },

  updateFn: async user => {
    const response = await api.patch(`/user`, user)
    return response
  },

  updatePasswordFn: async user => {
    const response = await api.patch(`/user/change-password`, user)
    return response
  },

  updateMediaFn: async data => {
    const response = await asmediaapi.post(`/user/avatar`, data)
    return response
  },

  destroyFn: async id => {
    const response = await api.delete(`/user/${id}`)
    return response
  }
}

export default services
