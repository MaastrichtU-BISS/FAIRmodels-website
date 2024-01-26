import getClient from "./client"

const client = getClient()

export const modelApiService = {
    index() {
        return client.get('/model/')
    },

    create(data: {name: string, description: string}) {
        return client.post(`/model/`, data);
    },

    get(id: string) {
        return client.get(`/model/${id}`);
    },

    update(data: {name: string, description: string}) {
        return client.put(`/model/`,  data);
    },

    delete(id: string) {
        return client.delete(`/model/${id}`)
    }
}