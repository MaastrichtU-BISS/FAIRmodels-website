import getClient from "./client"

const client = getClient()

export const modelApiService = {
    index(filter: {owned: boolean}) {
        return client.get(`/model/`, {'params': filter})
    },

    create(data: {name: string, description: string}) {
        return client.post(`/model/`, data);
    },

    get(id: string) {
        return client.get(`/model/${id}`);
    },

    update(id: string, data: {name: string, description: string}) {
        return client.put(`/model/${id}`,  data);
    },

    delete(id: string) {
        return client.delete(`/model/${id}`)
    }
}